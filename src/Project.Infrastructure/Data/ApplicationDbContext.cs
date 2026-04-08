using Microsoft.EntityFrameworkCore;
using Project.Core.Entities;
using Project.Core.Enums;

namespace Project.Infrastructure.Data;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<ReportRequest> ReportRequests => Set<ReportRequest>();

    public DbSet<ReportAttachment> ReportAttachments => Set<ReportAttachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.EpfNo);

            entity.Property(u => u.EpfNo).HasMaxLength(20).IsRequired();
            entity.Property(u => u.Name).HasMaxLength(100).IsRequired();
            entity.Property(u => u.Role).HasConversion<string>().HasDefaultValue(Role.USER).IsRequired();
            entity.Property(u => u.CreatedAt).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(u => u.IsActive).IsRequired();
        });

        modelBuilder.Entity<ReportRequest>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Title).HasMaxLength(200).IsRequired();
            entity.Property(r => r.Description).HasMaxLength(2000).IsRequired();
            entity.Property(r => r.Department).HasMaxLength(100);
            entity.Property(r => r.ContactNumber).HasMaxLength(20);
            entity.Property(r => r.RequestedByEpf).HasMaxLength(20).IsRequired();
            entity.Property(r => r.Status).HasConversion<string>().HasDefaultValue(ReportStatus.Requested).IsRequired();
            entity.Property(r => r.RequestedAt).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(r => r.RequestedByEpf)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(r => r.RequestedByEpf);
            entity.HasIndex(r => r.Status);
            entity.HasIndex(r => r.RequestedAt);
        });

        modelBuilder.Entity<ReportAttachment>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.Property(a => a.FileName).IsRequired();
            entity.Property(a => a.StoredFileName).IsRequired();
            entity.Property(a => a.ContentType).IsRequired();
            entity.Property(a => a.Size).IsRequired();
            entity.Property(a => a.UploadedAt).IsRequired();

            entity.HasOne(a => a.ReportRequest)
                .WithMany(r => r.Attachments)
                .HasForeignKey(a => a.ReportRequestId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
