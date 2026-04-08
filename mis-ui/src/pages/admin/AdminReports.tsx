import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiEye } from 'react-icons/fi';
import type { Report } from '../../types/report';
import { fetchAllReports } from '../../services/reportService';
import Button from '../../components/common/Button';
import AdminReportDetailsModal from '../../components/features/admin/AdminReportDetailsModal';
import UxState from '../../components/common/UxState';
import StatusBadge from '../../components/common/StatusBadge';

type AdminReport = Report & {
  department?: string;
  contactNumber?: string;
  requestedByEpf?: string;
  requestedByName?: string;
  requestedAt?: string;
  lastUpdatedAt?: string | null;
  attachments?: Array<{
    id: string;
    fileName?: string;
    uploadedAt?: string;
  }>;
};

function normalizeStatus(status: string | number | undefined) {
  if (typeof status === 'number') return status;
  const value = (status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '');
  if (value === 'completed') return 2;
  if (value === 'inprogress') return 1;
  if (value === 'clarificationneeded') return 3;
  if (value === 'rejected') return 4;
  return 0;
}

function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;
  const normalized = /([zZ]|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value?: string | null) {
  const parsed = parseApiDate(value);
  if (!parsed) return '-';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export default function AdminReports() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const refreshReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllReports();
      setReports((data as unknown as AdminReport[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshReports();
  }, [refreshReports]);

  const sortedReports = useMemo(
    () =>
      reports
        .filter((report) => normalizeStatus(report.status) !== 2)
        .sort((a, b) => {
          const aTime = parseApiDate(a.requestedAt ?? a.lastUpdatedAt)?.getTime() ?? 0;
          const bTime = parseApiDate(b.requestedAt ?? b.lastUpdatedAt)?.getTime() ?? 0;
          return bTime - aTime;
        }),
    [reports]
  );

  function handleView(report: AdminReport) {
    setSelectedReport(report);
    setIsModalOpen(true);
  }

  return (
    <section className="admin-reports-page">
      <header className="admin-reports-header">
        <h1>Requested Reports</h1>
        <p>View and track all current requests</p>
      </header>

      <div className="admin-reports-card">
        {loading && (
          <UxState type="loading" title="Loading reports..." message="Fetching report requests." />
        )}

        {!loading && error && (
          <UxState type="error" title="Unable to load reports" message={error} />
        )}

        {!loading && !error && sortedReports.length === 0 && (
          <UxState
            type="empty"
            title="No reports found"
            message="There are currently no reports to review."
          />
        )}

        {!loading && !error && sortedReports.length > 0 && (
          <div className="admin-reports-table-wrap">
            <table className="admin-reports-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Requested Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.map((report) => (
                  <tr key={report.id}>
                    <td className="admin-reports-title">{report.title}</td>
                    <td>{report.requestedByName ?? report.requestedByEpf ?? '-'}</td>
                    <td>
                      <StatusBadge status={report.status} />
                    </td>
                    <td>{formatDate(report.requestedAt)}</td>
                    <td>
                      <Button
                        className="report-history-download-btn home-table-action-btn"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleView(report)}
                      >
                        <FiEye /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminReportDetailsModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReport(null);
        }}
        onStatusUpdated={refreshReports}
      />
    </section>
  );
}
