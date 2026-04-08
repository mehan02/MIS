using Project.Core.Enums;

namespace Project.Application.Services;

public static class RolePolicyService
{
    public static bool IsValidUpdatableRole(string role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return false;
        }

        return string.Equals(role, nameof(Role.ADMIN), StringComparison.OrdinalIgnoreCase)
            || string.Equals(role, nameof(Role.USER), StringComparison.OrdinalIgnoreCase);
    }
}
