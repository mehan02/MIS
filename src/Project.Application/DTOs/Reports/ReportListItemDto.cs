using Project.Core.Enums;

namespace Project.Application.DTOs.Reports;

public sealed class ReportListItemDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? Department { get; set; }

    public string? ContactNumber { get; set; }

    public string RequestedByEpf { get; set; } = string.Empty;

    public string? RequestedByName { get; set; }

    public ReportStatus Status { get; set; }

    public DateTime RequestedAt { get; set; }

    public DateTime? LastUpdatedAt { get; set; }

    public Guid? AttachmentId { get; set; }

    public bool HasAttachment { get; set; }

    public ReportAttachmentDto? Attachment { get; set; }

    public List<ReportAttachmentDto> Attachments { get; set; } = new();
}
