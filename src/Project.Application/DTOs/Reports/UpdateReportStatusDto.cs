using Project.Core.Enums;

namespace Project.Application.DTOs.Reports;

public sealed class UpdateReportStatusDto
{
    public ReportStatus Status { get; set; }
}
