using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Project.Core.Interfaces;

namespace Project.Infrastructure.Services;

public sealed class FileStorageService : IFileStorageService
{
    private const long MaxSizeBytes = 300 * 1024 * 1024;
    private readonly string _basePath;

    public FileStorageService(IHostEnvironment env)
    {
        ArgumentNullException.ThrowIfNull(env);

        _basePath = Path.Combine(env.ContentRootPath, "Storage", "Reports");
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveAsync(IFormFile file)
    {
        ArgumentNullException.ThrowIfNull(file);

        if (file.Length <= 0)
        {
            throw new InvalidOperationException("File is empty.");
        }

        if (file.Length > MaxSizeBytes)
        {
            throw new InvalidOperationException($"File size exceeds the maximum allowed size of {MaxSizeBytes} bytes.");
        }

        var ext = Path.GetExtension(file.FileName) ?? string.Empty;
        var storedFileName = Guid.NewGuid().ToString("N") + ext;
        var destinationPath = Path.Combine(_basePath, storedFileName);

        await using var stream = new FileStream(destinationPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await file.CopyToAsync(stream);

        return storedFileName;
    }

    public Task<Stream> OpenReadAsync(string storedFileName)
    {
        if (string.IsNullOrWhiteSpace(storedFileName))
        {
            throw new ArgumentNullException(nameof(storedFileName));
        }

        var path = Path.Combine(_basePath, storedFileName);
        if (!File.Exists(path))
        {
            throw new FileNotFoundException("Stored file not found.", storedFileName);
        }

        return Task.FromResult<Stream>(File.OpenRead(path));
    }
}
