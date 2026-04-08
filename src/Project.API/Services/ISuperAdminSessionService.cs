namespace Project.API.Services;

public sealed record SuperAdminIdentity(string EpfNo, string Name, string Role);

public interface ISuperAdminSessionService
{
    bool ValidateCredentials(string username, string password);

    SuperAdminIdentity GetConfiguredIdentity();

    SuperAdminIdentity? GetCurrent(HttpRequest request);

    void SignIn(HttpResponse response);

    void SignOut(HttpResponse response);
}
