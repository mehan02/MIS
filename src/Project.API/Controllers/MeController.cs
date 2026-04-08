using Microsoft.AspNetCore.Mvc;
using Project.API.Services;
using Project.Application.Services;
using Project.Core.Enums;
using Project.Core.Interfaces;

namespace Project.API.Controllers;

[ApiController]
[Route("api/me")]
public sealed class MeController : ControllerBase
{
    private readonly MeService _meService;
    private readonly AdminService _adminService;
    private readonly ISuperAdminSessionService _superAdminSessionService;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentIdentityService _currentIdentityService;

    public MeController(
        MeService meService,
        AdminService adminService,
        ISuperAdminSessionService superAdminSessionService,
        IUserRepository userRepository,
        ICurrentIdentityService currentIdentityService)
    {
        _meService = meService;
        _adminService = adminService;
        _superAdminSessionService = superAdminSessionService;
        _userRepository = userRepository;
        _currentIdentityService = currentIdentityService;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var currentIdentity = _currentIdentityService.GetCurrent(HttpContext);
        if (currentIdentity != null)
        {
            // Core system provides identity (EPF/name). MIS role is resolved from MIS user table.
            var user = await _userRepository.GetByEpfAsync(currentIdentity.EpfNo, cancellationToken);
            if (user == null)
            {
                await _adminService.EnsureUserExistsAsync(
                    currentIdentity.EpfNo,
                    currentIdentity.Name,
                    nameof(Role.USER),
                    cancellationToken);

                user = await _userRepository.GetByEpfAsync(currentIdentity.EpfNo, cancellationToken);
            }

            if (user == null)
            {
                return Unauthorized();
            }

            return Ok(_meService.BuildMeResponse(user.EpfNo, user.Name, user.Role.ToString()));
        }

        var superAdminIdentity = _superAdminSessionService.GetCurrent(Request);
        if (superAdminIdentity == null)
        {
            return Unauthorized();
        }

        await _adminService.EnsureUserExistsAsync(
            superAdminIdentity.EpfNo,
            superAdminIdentity.Name,
            superAdminIdentity.Role,
            cancellationToken);

        return Ok(_meService.BuildMeResponse(
            superAdminIdentity.EpfNo,
            superAdminIdentity.Name,
            superAdminIdentity.Role));
    }
}
