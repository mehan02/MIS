namespace Project.API.Services;

public sealed record CurrentIdentity(string EpfNo, string Name);

public interface ICurrentIdentityService
{
    CurrentIdentity? GetCurrent(HttpContext httpContext);
}
