using Serilog;

namespace Project.API.Extensions;

public static class HostBuilderExtensions
{
    public static IHostBuilder AddSerilogLogging(this IHostBuilder hostBuilder)
    {
        hostBuilder.UseSerilog((context, loggerConfiguration) =>
        {
            loggerConfiguration
                .ReadFrom.Configuration(context.Configuration)
                .Enrich.FromLogContext();
        });

        return hostBuilder;
    }
}
