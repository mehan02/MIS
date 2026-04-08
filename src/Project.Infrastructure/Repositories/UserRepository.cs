using Microsoft.EntityFrameworkCore;
using Project.Core.Entities;
using Project.Core.Interfaces;
using Project.Infrastructure.Data;

namespace Project.Infrastructure.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _dbContext;

    public UserRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<User?> GetByEpfAsync(string epfNo, CancellationToken cancellationToken = default)
    {
        return _dbContext.Users.FirstOrDefaultAsync(u => u.EpfNo == epfNo, cancellationToken);
    }

    public Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.Users.AsNoTracking().OrderBy(u => u.Name).ToListAsync(cancellationToken);
    }

    public Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        return _dbContext.Users.AddAsync(user, cancellationToken).AsTask();
    }

    public void Remove(User user)
    {
        _dbContext.Users.Remove(user);
    }
}
