using Project.Core.Entities;

namespace Project.Core.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEpfAsync(string epfNo, CancellationToken cancellationToken = default);

    Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default);

    Task AddAsync(User user, CancellationToken cancellationToken = default);

    void Remove(User user);
}
