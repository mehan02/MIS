using Microsoft.AspNetCore.Mvc;
using Project.API.Services;
using Project.Application.DTOs.Reports;
using Project.Application.Services;
using Project.Core.Entities;
using Project.Core.Enums;
using Project.Core.Interfaces;

namespace Project.API.Controllers;

[ApiController]
[Route("api/reports")]
public sealed class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;
    private readonly IUserRepository _userRepository;
    private readonly AdminService _adminService;
    private readonly ISuperAdminSessionService _superAdminSessionService;
    private readonly ICurrentIdentityService _currentIdentityService;

    public ReportsController(
        ReportService reportService,
        IUserRepository userRepository,
        AdminService adminService,
        ISuperAdminSessionService superAdminSessionService,
        ICurrentIdentityService currentIdentityService)
    {
        _reportService = reportService;
        _userRepository = userRepository;
        _adminService = adminService;
        _superAdminSessionService = superAdminSessionService;
        _currentIdentityService = currentIdentityService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateReportRequestDto dto, CancellationToken cancellationToken)
    {
        var currentUser = await GetCurrentUserAsync(cancellationToken);
        if (currentUser == null)
        {
            return Unauthorized();
        }

        try
        {
            await _reportService.CreateAsync(dto, currentUser.EpfNo, cancellationToken);
            return StatusCode(StatusCodes.Status201Created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("my")]
    public async Task<IActionResult> MyReports(CancellationToken cancellationToken)
    {
        var currentUser = await GetCurrentUserAsync(cancellationToken);
        if (currentUser == null)
        {
            return Unauthorized();
        }

        var reports = await _reportService.GetMyReportsAsync(currentUser.EpfNo, cancellationToken);
        return Ok(reports);
    }

    [HttpGet]
    public async Task<IActionResult> All(CancellationToken cancellationToken)
    {
        var currentUser = await GetCurrentUserAsync(cancellationToken);
        if (currentUser == null)
        {
            return Unauthorized();
        }

        if (!IsAdmin(currentUser))
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var reports = await _reportService.GetAllReportsAsync(cancellationToken);
        return Ok(reports);
    }

    [HttpGet("{id}/attachment")]
    public async Task<IActionResult> GetAttachment(Guid id, CancellationToken cancellationToken)
    {
        var currentUser = await GetCurrentUserAsync(cancellationToken);
        if (currentUser == null)
        {
            return Unauthorized();
        }

        var file = await _reportService.GetAttachmentAsync(
            id,
            null,
            currentUser.EpfNo,
            IsAdmin(currentUser),
            cancellationToken);
        if (file == null)
        {
            return NotFound();
        }

        return File(file.Stream, file.ContentType, file.FileName);
    }

    [HttpGet("{id}/attachments/{attachmentId}")]
    public async Task<IActionResult> GetAttachmentById(Guid id, Guid attachmentId, CancellationToken cancellationToken)
    {
        var currentUser = await GetCurrentUserAsync(cancellationToken);
        if (currentUser == null)
        {
            return Unauthorized();
        }

        var file = await _reportService.GetAttachmentAsync(
            id,
            attachmentId,
            currentUser.EpfNo,
            IsAdmin(currentUser),
            cancellationToken);
        if (file == null)
        {
            return NotFound();
        }

        return File(file.Stream, file.ContentType, file.FileName);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateReportStatusDto dto, CancellationToken cancellationToken)
    {
        var currentUser = await GetCurrentUserAsync(cancellationToken);
        if (currentUser == null)
        {
            return Unauthorized();
        }

        if (!IsAdmin(currentUser))
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        try
        {
            var updated = await _reportService.UpdateStatusAsync(id, dto.Status, cancellationToken);
            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var currentUser = await GetCurrentUserAsync(cancellationToken);
        if (currentUser == null)
        {
            return Unauthorized();
        }

        try
        {
            var deleted = await _reportService.DeleteAsync(
                id,
                currentUser.EpfNo,
                IsAdmin(currentUser),
                cancellationToken);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }
    }

    private async Task<User?> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var currentIdentity = _currentIdentityService.GetCurrent(HttpContext);
        if (currentIdentity != null)
        {
            var user = await _userRepository.GetByEpfAsync(currentIdentity.EpfNo, cancellationToken);
            if (user != null)
            {
                return user;
            }

            await _adminService.EnsureUserExistsAsync(
                currentIdentity.EpfNo,
                currentIdentity.Name,
                nameof(Role.USER),
                cancellationToken);

            return await _userRepository.GetByEpfAsync(currentIdentity.EpfNo, cancellationToken);
        }

        var superAdminIdentity = _superAdminSessionService.GetCurrent(Request);
        if (superAdminIdentity == null)
        {
            return null;
        }

        await _adminService.EnsureUserExistsAsync(
            superAdminIdentity.EpfNo,
            superAdminIdentity.Name,
            superAdminIdentity.Role,
            cancellationToken);

        return await _userRepository.GetByEpfAsync(superAdminIdentity.EpfNo, cancellationToken);
    }

    private static bool IsAdmin(User user)
    {
        return user.Role == Role.ADMIN || user.Role == Role.SUPER_ADMIN;
    }
}
