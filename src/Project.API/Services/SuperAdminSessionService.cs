using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;
using Project.API.Options;
using Project.Core.Enums;

namespace Project.API.Services;

public sealed class SuperAdminSessionService : ISuperAdminSessionService
{
    private const string CookieName = "mis_superadmin_session";
    private const string ProtectorPurpose = "project-api-superadmin-session";

    private readonly IDataProtector _protector;
    private readonly IWebHostEnvironment _environment;
    private readonly SuperAdminAuthOptions _options;

    public SuperAdminSessionService(
        IDataProtectionProvider dataProtectionProvider,
        IWebHostEnvironment environment,
        IOptions<SuperAdminAuthOptions> options)
    {
        _protector = dataProtectionProvider.CreateProtector(ProtectorPurpose);
        _environment = environment;
        _options = options.Value;
    }

    public bool ValidateCredentials(string username, string password)
    {
        if (string.IsNullOrWhiteSpace(_options.Username) || string.IsNullOrWhiteSpace(_options.PasswordHash))
        {
            return false;
        }

        if (!string.Equals(username?.Trim(), _options.Username, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return VerifyPbkdf2Hash(password, _options.PasswordHash);
    }

    public SuperAdminIdentity GetConfiguredIdentity()
    {
        return new SuperAdminIdentity(
            _options.Username,
            string.IsNullOrWhiteSpace(_options.DisplayName) ? "Super Admin" : _options.DisplayName,
            nameof(Role.SUPER_ADMIN));
    }

    public SuperAdminIdentity? GetCurrent(HttpRequest request)
    {
        if (!request.Cookies.TryGetValue(CookieName, out var cookieValue) || string.IsNullOrWhiteSpace(cookieValue))
        {
            return null;
        }

        try
        {
            var unprotected = _protector.Unprotect(cookieValue);
            var parts = unprotected.Split('|', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2)
            {
                return null;
            }

            if (!long.TryParse(parts[1], out var expiryUnixSeconds))
            {
                return null;
            }

            var nowUnixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (expiryUnixSeconds <= nowUnixSeconds)
            {
                return null;
            }

            if (!string.Equals(parts[0], _options.Username, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            return GetConfiguredIdentity();
        }
        catch
        {
            return null;
        }
    }

    public void SignIn(HttpResponse response)
    {
        var sessionMinutes = Math.Max(5, _options.SessionMinutes);
        var expiresUtc = DateTimeOffset.UtcNow.AddMinutes(sessionMinutes);
        var payload = $"{_options.Username}|{expiresUtc.ToUnixTimeSeconds()}";
        var protectedPayload = _protector.Protect(payload);

        response.Cookies.Append(CookieName, protectedPayload, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Expires = expiresUtc,
            IsEssential = true,
            Path = "/"
        });
    }

    public void SignOut(HttpResponse response)
    {
        response.Cookies.Delete(CookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/"
        });
    }

    private static bool VerifyPbkdf2Hash(string password, string encodedHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(encodedHash))
        {
            return false;
        }

        var hashParts = encodedHash.Split('.', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (hashParts.Length != 3)
        {
            return false;
        }

        if (!int.TryParse(hashParts[0], out var iterations) || iterations < 10_000)
        {
            return false;
        }

        byte[] salt;
        byte[] expectedHash;
        try
        {
            salt = Convert.FromBase64String(hashParts[1]);
            expectedHash = Convert.FromBase64String(hashParts[2]);
        }
        catch (FormatException)
        {
            return false;
        }

        if (salt.Length == 0 || expectedHash.Length == 0)
        {
            return false;
        }

        var computed = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expectedHash.Length);

        return CryptographicOperations.FixedTimeEquals(computed, expectedHash);
    }
}
