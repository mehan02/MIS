using Microsoft.AspNetCore.Http;

namespace Project.Application.DTOs.Reports;

public sealed class CreateReportRequestDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? Department { get; set; }

    public string? ContactNumber { get; set; }

    public List<IFormFile>? Files { get; set; }

    public IFormFile? File { get; set; }
}
