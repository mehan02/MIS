using Project.Application.DTOs.Reports;
using Project.Core.Entities;
using Project.Core.Enums;
using Project.Core.Interfaces;

namespace Project.Application.Services;

public sealed class ReportService
{
    private readonly IReportRepository _reportRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;

    public ReportService(
        IReportRepository reportRepository,
        IUserRepository userRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork)
    {
        _reportRepository = reportRepository;
        _userRepository = userRepository;
        _fileStorageService = fileStorageService;
        _unitOfWork = unitOfWork;
    }

    public async Task CreateAsync(CreateReportRequestDto dto, string epfNo, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description))
        {
            throw new InvalidOperationException("Title and Description are required.");
        }

        var report = new ReportRequest
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            Department = dto.Department,
            ContactNumber = dto.ContactNumber,
            RequestedByEpf = epfNo,
            Status = ReportStatus.Requested,
            RequestedAt = DateTime.UtcNow
        };

        var filesToUpload = new List<Microsoft.AspNetCore.Http.IFormFile>();
        if (dto.Files != null && dto.Files.Count > 0)
        {
            filesToUpload.AddRange(dto.Files.Where(f => f != null));
        }
        else if (dto.File != null)
        {
            filesToUpload.Add(dto.File);
        }

        foreach (var file in filesToUpload)
        {
            var stored = await _fileStorageService.SaveAsync(file);

            report.Attachments.Add(new ReportAttachment
            {
                Id = Guid.NewGuid(),
                ReportRequestId = report.Id,
                FileName = file.FileName,
                StoredFileName = stored,
                ContentType = file.ContentType ?? string.Empty,
                Size = file.Length,
                UploadedAt = DateTime.UtcNow
            });
        }

        await _reportRepository.AddAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<ReportListItemDto>> GetMyReportsAsync(string epfNo, CancellationToken cancellationToken = default)
    {
        var reports = await _reportRepository.GetByRequesterEpfAsync(epfNo, cancellationToken);
        return await MapReportsAsync(reports);
    }

    public async Task<List<ReportListItemDto>> GetAllReportsAsync(CancellationToken cancellationToken = default)
    {
        var reports = await _reportRepository.GetAllAsync(cancellationToken);
        return await MapReportsAsync(reports);
    }

    public async Task<FilePayload?> GetAttachmentAsync(Guid reportId, Guid? attachmentId, string currentEpf, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var report = await _reportRepository.GetByIdAsync(reportId, includeAttachments: true, cancellationToken: cancellationToken);
        if (report == null)
        {
            return null;
        }

        if (!isAdmin && !string.Equals(report.RequestedByEpf, currentEpf, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException();
        }

        var attachment = attachmentId.HasValue
            ? report.Attachments.FirstOrDefault(a => a.Id == attachmentId.Value)
            : report.Attachments.OrderByDescending(a => a.UploadedAt).FirstOrDefault();

        if (attachment == null)
        {
            return null;
        }

        var stream = await _fileStorageService.OpenReadAsync(attachment.StoredFileName);

        return new FilePayload
        {
            Stream = stream,
            ContentType = string.IsNullOrWhiteSpace(attachment.ContentType) ? "application/octet-stream" : attachment.ContentType,
            FileName = attachment.FileName
        };
    }

    public async Task<bool> DeleteAsync(Guid reportId, string currentEpf, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var report = await _reportRepository.GetByIdAsync(reportId, includeAttachments: true, cancellationToken: cancellationToken);
        if (report == null)
        {
            return false;
        }

        if (!isAdmin && !string.Equals(report.RequestedByEpf, currentEpf, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException();
        }

        _reportRepository.Remove(report);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateStatusAsync(Guid reportId, ReportStatus status, CancellationToken cancellationToken = default)
    {
        var report = await _reportRepository.GetByIdAsync(reportId, includeAttachments: false, cancellationToken: cancellationToken);
        if (report == null)
        {
            return false;
        }

        if (!IsValidTransition(report.Status, status))
        {
            throw new InvalidOperationException($"Invalid status transition from {report.Status} to {status}.");
        }

        report.Status = status;
        report.LastUpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static bool IsValidTransition(ReportStatus from, ReportStatus to)
    {
        if (from == to)
        {
            return true;
        }

        return from switch
        {
            ReportStatus.Requested => to is ReportStatus.InProgress or ReportStatus.Completed or ReportStatus.ClarificationNeeded or ReportStatus.Rejected,
            ReportStatus.InProgress => to is ReportStatus.Completed or ReportStatus.ClarificationNeeded,
            ReportStatus.ClarificationNeeded => to is ReportStatus.InProgress or ReportStatus.Completed,
            ReportStatus.Completed => false,
            ReportStatus.Rejected => false,
            _ => false
        };
    }

    private async Task<List<ReportListItemDto>> MapReportsAsync(IEnumerable<ReportRequest> reports)
    {
        var result = new List<ReportListItemDto>();

        foreach (var r in reports)
        {
            var user = await _userRepository.GetByEpfAsync(r.RequestedByEpf);

            var attachments = r.Attachments
                .OrderByDescending(a => a.UploadedAt)
                .Select(MapAttachment)
                .ToList();

            var latest = attachments.FirstOrDefault();

            result.Add(new ReportListItemDto
            {
                Id = r.Id,
                Title = r.Title,
                Description = r.Description,
                Department = r.Department,
                ContactNumber = r.ContactNumber,
                RequestedByEpf = r.RequestedByEpf,
                RequestedByName = user?.Name,
                Status = r.Status,
                RequestedAt = r.RequestedAt,
                LastUpdatedAt = r.LastUpdatedAt,
                AttachmentId = latest?.Id,
                HasAttachment = attachments.Count > 0,
                Attachment = latest,
                Attachments = attachments
            });
        }

        return result;
    }

    private static ReportAttachmentDto MapAttachment(ReportAttachment attachment)
    {
        return new ReportAttachmentDto
        {
            Id = attachment.Id,
            ReportRequestId = attachment.ReportRequestId,
            FileName = attachment.FileName,
            ContentType = attachment.ContentType,
            Size = attachment.Size,
            UploadedAt = attachment.UploadedAt
        };
    }
}
