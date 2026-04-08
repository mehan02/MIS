namespace Project.Application.DTOs.Reports;

public sealed class ReportAttachmentDto
{
    public Guid Id { get; set; }

    public Guid ReportRequestId { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long Size { get; set; }

    public DateTime UploadedAt { get; set; }
}
