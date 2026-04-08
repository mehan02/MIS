using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Project.Core.Interfaces;
using Project.Infrastructure.Data;
using Project.Infrastructure.Repositories;
using Project.Infrastructure.Services;

namespace Project.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=(localdb)\\mssqllocaldb;Database=ProjectDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true";

        var provider = configuration["Database:Provider"]?.Trim().ToLowerInvariant();

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (provider == "sqlite" || connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
            {
                options.UseSqlite(connectionString);
                return;
            }

            options.UseSqlServer(connectionString);
        });

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();
        services.AddScoped<IFileStorageService, FileStorageService>();

        return services;
    }
}
