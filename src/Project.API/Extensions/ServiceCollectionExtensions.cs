using System.Reflection;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.OpenApi.Models;
using Project.API.Options;
using Project.API.Services;
using Project.Application;
using Project.Application.Validators;
using Project.Infrastructure;

namespace Project.API.Extensions;

public static class ServiceCollectionExtensions
{
    public const string FrontendCorsPolicy = "FrontendDevCors";

    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddFluentValidationAutoValidation();
        services.AddFluentValidationClientsideAdapters();
        services.AddValidatorsFromAssemblyContaining<CreateReportRequestDtoValidator>();
        services.AddHealthChecks();
        services.AddDataProtection();

        services.Configure<SuperAdminAuthOptions>(
            configuration.GetSection(SuperAdminAuthOptions.SectionName));
        services.Configure<CoreIdentityOptions>(
            configuration.GetSection(CoreIdentityOptions.SectionName));

        services.AddApplication();
        services.AddInfrastructure(configuration);
        services.AddSingleton<ISuperAdminSessionService, SuperAdminSessionService>();
        services.AddScoped<ICurrentIdentityService, CurrentIdentityService>();

        services.AddCors(options =>
        {
            options.AddPolicy(FrontendCorsPolicy, policy =>
            {
                var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                    ?? ["http://localhost:5173", "http://127.0.0.1:5173"];

                policy.WithOrigins(origins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Project API",
                Version = "v1",
                Description = "Clean Architecture API"
            });

            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath);
            }
        });

        return services;
    }
}
