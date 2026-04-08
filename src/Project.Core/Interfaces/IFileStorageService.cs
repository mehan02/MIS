using Microsoft.AspNetCore.Http;

namespace Project.Core.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(IFormFile file);

    Task<Stream> OpenReadAsync(string storedFileName);
}
