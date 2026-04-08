namespace Project.Application.Services;

public sealed class MeService
{
    public object BuildMeResponse(string epfNo, string name, string role)
    {
        return new
        {
            epfNo,
            name,
            role
        };
    }
}
