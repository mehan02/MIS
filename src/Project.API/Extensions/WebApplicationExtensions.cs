using Project.API.Middleware;
using Serilog;

namespace Project.API.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseApiPipeline(this WebApplication app)
    {
        app.UseMiddleware<GlobalExceptionMiddleware>();
        app.UseSerilogRequestLogging();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/swagger/v1/swagger.json", "Project API v1");
                options.RoutePrefix = "swagger";
            });
        }

        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }
        app.UseCors(ServiceCollectionExtensions.FrontendCorsPolicy);

        return app;
    }

    public static WebApplication MapApiEndpoints(this WebApplication app)
    {
        app.MapControllers();
        app.MapHealthChecks("/api/health");
        app.MapGet("/", () => Results.Ok(new
        {
            service = "Project.API",
            status = "ok"
        }));

        return app;
    }
}