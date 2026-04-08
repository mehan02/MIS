using Microsoft.EntityFrameworkCore;
using Project.Core.Entities;
using Project.Core.Interfaces;
using Project.Infrastructure.Data;

namespace Project.Infrastructure.Repositories;

public sealed class ReportRepository : IReportRepository
{
    private readonly ApplicationDbContext _dbContext;

    public ReportRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ReportRequest?> GetByIdAsync(Guid id, bool includeAttachments = false, CancellationToken cancellationToken = default)
    {
        IQueryable<ReportRequest> query = _dbContext.ReportRequests;

        if (includeAttachments)
        {
            query = query.Include(r => r.Attachments);
        }

        return await query.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public Task<List<ReportRequest>> GetByRequesterEpfAsync(string epfNo, CancellationToken cancellationToken = default)
    {
        return _dbContext.ReportRequests
            .Include(r => r.Attachments)
            .AsNoTracking()
            .Where(r => r.RequestedByEpf == epfNo)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<List<ReportRequest>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.ReportRequests
            .Include(r => r.Attachments)
            .AsNoTracking()
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(ReportRequest report, CancellationToken cancellationToken = default)
    {
        return _dbContext.ReportRequests.AddAsync(report, cancellationToken).AsTask();
    }

    public void Remove(ReportRequest report)
    {
        _dbContext.ReportRequests.Remove(report);
    }
}
