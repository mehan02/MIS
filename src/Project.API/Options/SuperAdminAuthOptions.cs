namespace Project.API.Options;

public sealed class SuperAdminAuthOptions
{
    public const string SectionName = "SuperAdminAuth";

    public string Username { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string DisplayName { get; set; } = "Super Admin";

    public int SessionMinutes { get; set; } = 30;
}
