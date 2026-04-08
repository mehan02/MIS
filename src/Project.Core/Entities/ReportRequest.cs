using Project.Core.Enums;

namespace Project.Core.Entities;

public sealed class ReportRequest
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? Department { get; set; }

    public string? ContactNumber { get; set; }

    public ReportStatus Status { get; set; } = ReportStatus.Requested;

    public string RequestedByEpf { get; set; } = string.Empty;

    public DateTime RequestedAt { get; set; }

    public DateTime? LastUpdatedAt { get; set; }

    public ICollection<ReportAttachment> Attachments { get; set; } = new List<ReportAttachment>();
}
