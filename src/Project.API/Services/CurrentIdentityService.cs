using System.Security.Claims;
using Microsoft.Extensions.Options;
using Project.API.Options;

namespace Project.API.Services;

public sealed class CurrentIdentityService : ICurrentIdentityService
{
    private readonly IWebHostEnvironment _environment;
    private readonly CoreIdentityOptions _options;

    public CurrentIdentityService(IWebHostEnvironment environment, IOptions<CoreIdentityOptions> options)
    {
        _environment = environment;
        _options = options.Value;
    }

    public CurrentIdentity? GetCurrent(HttpContext httpContext)
    {
        var fromClaims = ResolveFromClaims(httpContext.User);
        if (fromClaims != null)
        {
            return fromClaims;
        }

        if (!_environment.IsDevelopment() || !_options.AllowDevelopmentHeaderFallback)
        {
            return null;
        }

        var epf = GetHeaderValue(httpContext.Request, "X-EPF-NO");
        if (string.IsNullOrWhiteSpace(epf))
        {
            return null;
        }

        var name = GetHeaderValue(httpContext.Request, "X-USER-NAME") ?? string.Empty;
        return new CurrentIdentity(epf.Trim(), name.Trim());
    }

    private CurrentIdentity? ResolveFromClaims(ClaimsPrincipal principal)
    {
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var epf = FindFirstClaimValue(principal, _options.EpfClaimTypes);
        if (string.IsNullOrWhiteSpace(epf))
        {
            return null;
        }

        var name = FindFirstClaimValue(principal, _options.NameClaimTypes) ?? string.Empty;
        return new CurrentIdentity(epf.Trim(), name.Trim());
    }

    private static string? FindFirstClaimValue(ClaimsPrincipal principal, IEnumerable<string> claimTypes)
    {
        foreach (var claimType in claimTypes)
        {
            if (string.IsNullOrWhiteSpace(claimType))
            {
                continue;
            }

            var claimValue = principal.FindFirst(claimType)?.Value;
            if (!string.IsNullOrWhiteSpace(claimValue))
            {
                return claimValue;
            }
        }

        return null;
    }

    private static string? GetHeaderValue(HttpRequest request, string key)
    {
        return request.Headers.TryGetValue(key, out var values)
            ? values.FirstOrDefault()
            : null;
    }
}
