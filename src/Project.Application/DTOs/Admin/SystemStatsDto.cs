namespace Project.Application.DTOs.Admin;

public sealed class SystemStatsDto
{
    public int TotalUsers { get; set; }

    public int TotalReports { get; set; }

    public IReadOnlyList<ReportStatusCountDto> ReportsByStatus { get; set; } = [];
}

public sealed class ReportStatusCountDto
{
    public string Status { get; set; } = string.Empty;

    public int Count { get; set; }
}
