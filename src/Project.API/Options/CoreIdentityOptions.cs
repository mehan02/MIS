namespace Project.API.Options;

public sealed class CoreIdentityOptions
{
    public const string SectionName = "CoreIdentity";

    public string[] EpfClaimTypes { get; set; } = ["epf", "epf_no", "employee_number", "sub"];

    public string[] NameClaimTypes { get; set; } = ["name", "preferred_username", "given_name"];

    public bool AllowDevelopmentHeaderFallback { get; set; } = true;
}
