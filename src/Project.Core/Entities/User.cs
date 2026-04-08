using Project.Core.Enums;

namespace Project.Core.Entities;

public sealed class User
{
    public string EpfNo { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public Role Role { get; set; } = Role.USER;

    public DateTime CreatedAt { get; set; }

    public bool IsActive { get; set; } = true;
}
