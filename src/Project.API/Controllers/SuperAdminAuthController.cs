using Microsoft.AspNetCore.Mvc;
using Project.API.Services;
using Project.Application.Services;

namespace Project.API.Controllers;

[ApiController]
[Route("api/superadmin/auth")]
public sealed class SuperAdminAuthController : ControllerBase
{
    private readonly ISuperAdminSessionService _superAdminSessionService;
    private readonly MeService _meService;
    private readonly AdminService _adminService;

    public SuperAdminAuthController(
        ISuperAdminSessionService superAdminSessionService,
        MeService meService,
        AdminService adminService)
    {
        _superAdminSessionService = superAdminSessionService;
        _meService = meService;
        _adminService = adminService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] SuperAdminLoginRequest request, CancellationToken cancellationToken)
    {
        if (!_superAdminSessionService.ValidateCredentials(request.Username, request.Password))
        {
            return Unauthorized(new { message = "Invalid super admin credentials." });
        }

        _superAdminSessionService.SignIn(Response);
        var identity = _superAdminSessionService.GetConfiguredIdentity();

        await _adminService.EnsureUserExistsAsync(identity.EpfNo, identity.Name, identity.Role, cancellationToken);

        return Ok(_meService.BuildMeResponse(identity.EpfNo, identity.Name, identity.Role));
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        _superAdminSessionService.SignOut(Response);
        return NoContent();
    }
}

public sealed class SuperAdminLoginRequest
{
    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
