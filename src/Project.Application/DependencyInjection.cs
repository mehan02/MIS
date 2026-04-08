using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Project.Application.Services;

namespace Project.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddAutoMapper(Assembly.GetExecutingAssembly());
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        services.AddScoped<MeService>();
        services.AddScoped<ReportService>();
        services.AddScoped<AdminService>();

        return services;
    }
}
