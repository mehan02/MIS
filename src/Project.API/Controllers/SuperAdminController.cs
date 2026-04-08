using Microsoft.AspNetCore.Mvc;
using Project.API.Services;
using Project.Application.DTOs.Admin;
using Project.Application.Services;
using System.Diagnostics.CodeAnalysis;

namespace Project.API.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class SuperAdminController : ControllerBase
{
    private readonly AdminService _adminService;
    private readonly ISuperAdminSessionService _superAdminSessionService;

    public SuperAdminController(AdminService adminService, ISuperAdminSessionService superAdminSessionService)
    {
        _adminService = adminService;
        _superAdminSessionService = superAdminSessionService;
    }

    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetUsers(CancellationToken cancellationToken)
    {
        if (!TryGetSuperAdmin(out _))
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var users = await _adminService.GetUsersAsync(cancellationToken);
        return Ok(users);
    }

    [HttpPut("users/{epfNo}/role")]
    public async Task<ActionResult<UserDto>> UpdateUserRole(string epfNo, [FromBody] UpdateRoleRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetSuperAdmin(out _))
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        try
        {
            var updated = await _adminService.UpdateUserRoleAsync(epfNo, request.Role, cancellationToken);
            if (updated == null)
            {
                return NotFound(new { message = $"User not found for id '{epfNo}'." });
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("users/{epfNo}")]
    public async Task<IActionResult> DeleteUser(string epfNo, CancellationToken cancellationToken)
    {
        if (!TryGetSuperAdmin(out var superAdminIdentity))
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        try
        {
            var deleted = await _adminService.DeleteUserAsync(superAdminIdentity.EpfNo, epfNo, cancellationToken);
            if (!deleted)
            {
                return NotFound(new { message = $"User not found for id '{epfNo}'." });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("system-stats")]
    public async Task<IActionResult> GetSystemStats(CancellationToken cancellationToken)
    {
        if (!TryGetSuperAdmin(out _))
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var stats = await _adminService.GetSystemStatsAsync(cancellationToken);
        return Ok(stats);
    }

    private bool TryGetSuperAdmin([NotNullWhen(true)] out SuperAdminIdentity? superAdminIdentity)
    {
        superAdminIdentity = _superAdminSessionService.GetCurrent(Request);
        return superAdminIdentity != null;
    }
}
