using Project.Application.DTOs.Admin;
using Project.Core.Entities;
using Project.Core.Enums;
using Project.Core.Interfaces;

namespace Project.Application.Services;

public sealed class AdminService
{
    private readonly IUserRepository _userRepository;
    private readonly IReportRepository _reportRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AdminService(IUserRepository userRepository, IReportRepository reportRepository, IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _reportRepository = reportRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<UserDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        return users
            .OrderBy(u => u.Name)
            .Select(u => new UserDto
            {
                EpfNo = u.EpfNo,
                Name = u.Name,
                Role = u.Role.ToString()
            })
            .ToList();
    }

    public async Task<UserDto?> UpdateUserRoleAsync(string epfNo, string roleText, CancellationToken cancellationToken = default)
    {
        if (!RolePolicyService.IsValidUpdatableRole(roleText))
        {
            throw new InvalidOperationException("Invalid role. Allowed values: USER, ADMIN.");
        }

        var user = await _userRepository.GetByEpfAsync(epfNo, cancellationToken);
        if (user == null)
        {
            return null;
        }

        if (user.Role == Role.SUPER_ADMIN)
        {
            throw new InvalidOperationException("SUPER_ADMIN role cannot be changed.");
        }

        user.Role = Enum.Parse<Role>(roleText.Trim().ToUpperInvariant());
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new UserDto
        {
            EpfNo = user.EpfNo,
            Name = user.Name,
            Role = user.Role.ToString()
        };
    }

    public async Task<bool> DeleteUserAsync(string currentEpf, string targetEpf, CancellationToken cancellationToken = default)
    {
        if (string.Equals(currentEpf, targetEpf, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("You cannot delete your own account.");
        }

        var user = await _userRepository.GetByEpfAsync(targetEpf, cancellationToken);
        if (user == null)
        {
            return false;
        }

        if (user.Role == Role.SUPER_ADMIN)
        {
            throw new InvalidOperationException("SUPER_ADMIN users cannot be deleted.");
        }

        var reports = await _reportRepository.GetByRequesterEpfAsync(targetEpf, cancellationToken);
        if (reports.Count > 0)
        {
            throw new InvalidOperationException("User cannot be deleted because they have report history.");
        }

        _userRepository.Remove(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<SystemStatsDto> GetSystemStatsAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var reports = await _reportRepository.GetAllAsync(cancellationToken);

        var reportStatusCounts = reports
            .GroupBy(r => r.Status)
            .Select(g => new ReportStatusCountDto
            {
                Status = g.Key.ToString(),
                Count = g.Count()
            })
            .OrderBy(x => x.Status)
            .ToList();

        return new SystemStatsDto
        {
            TotalUsers = users.Count,
            TotalReports = reports.Count,
            ReportsByStatus = reportStatusCounts
        };
    }

    public async Task EnsureUserExistsAsync(string epfNo, string name, string role, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEpfAsync(epfNo, cancellationToken);
        if (user != null)
        {
            return;
        }

        var parsedRole = Enum.TryParse<Role>(role, true, out var roleValue) ? roleValue : Role.USER;

        await _userRepository.AddAsync(new User
        {
            EpfNo = epfNo,
            Name = string.IsNullOrWhiteSpace(name) ? epfNo : name,
            Role = parsedRole,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
