namespace Project.Core.Entities;

public sealed class ReportAttachment
{
    public Guid Id { get; set; }

    public Guid ReportRequestId { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string StoredFileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long Size { get; set; }

    public DateTime UploadedAt { get; set; }

    public ReportRequest ReportRequest { get; set; } = null!;
}
