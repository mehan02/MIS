namespace Project.Core.Common;

public abstract class AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTime CreatedUtc { get; set; }

    public DateTime? LastModifiedUtc { get; set; }
}
