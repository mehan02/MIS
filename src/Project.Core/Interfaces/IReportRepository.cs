using Project.Core.Entities;

namespace Project.Core.Interfaces;

public interface IReportRepository
{
    Task<ReportRequest?> GetByIdAsync(Guid id, bool includeAttachments = false, CancellationToken cancellationToken = default);

    Task<List<ReportRequest>> GetByRequesterEpfAsync(string epfNo, CancellationToken cancellationToken = default);

    Task<List<ReportRequest>> GetAllAsync(CancellationToken cancellationToken = default);

    Task AddAsync(ReportRequest report, CancellationToken cancellationToken = default);

    void Remove(ReportRequest report);
}
