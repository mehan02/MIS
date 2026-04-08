import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import type { Report } from '../types/report';
import { fetchAllReports, fetchMyReports } from '../services/reportService';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import UxState from '../components/common/UxState';
import { useAuth } from '../hooks/useAuth';
import AdminReportDetailsModal from '../components/features/admin/AdminReportDetailsModal';

type ReportHistoryRecord = Report & {
  requestedAt?: string;
  lastUpdatedAt?: string | null;
  type?: string;
};

function formatType(value?: string) {
  if (!value) return 'Ad-hoc Report';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'adhoc' || normalized === 'ad_hoc' || normalized === 'ad-hoc')
    return 'Ad-hoc Report';
  return value;
}

function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;

  // Backend returns UTC timestamps without timezone suffix.
  // Add 'Z' for no-offset values so JS parses as UTC, then localizes for display.
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

export default function ReportHistory() {
  const location = useLocation();
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportHistoryRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadReports = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) {
        setLoading(true);
      }
      setError(null);

      try {
        if (user?.role === 'ADMIN') {
          const data = await fetchAllReports();
          const completedOnly = ((data as unknown as ReportHistoryRecord[]) ?? []).filter(
            (report) => normalizeStatus(report.status) === 2
          );
          setReports(completedOnly);
        } else {
          const data = await fetchMyReports();
          setReports((data as unknown as ReportHistoryRecord[]) ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report history.');
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    },
    [user?.role]
  );

  useEffect(() => {
    void loadReports(true);

    const intervalId = window.setInterval(() => {
      void loadReports(false);
    }, 15000);

    const onFocus = () => {
      void loadReports(false);
    };

    const onVisibility = () => {
      if (!document.hidden) {
        void loadReports(false);
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadReports]);

  useEffect(() => {
    if ((location.state as { refresh?: boolean } | null)?.refresh) {
      void loadReports(false);
    }
  }, [location.state, loadReports]);

  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) => {
        const aTime = parseApiDate(a.lastUpdatedAt ?? a.requestedAt)?.getTime() ?? 0;
        const bTime = parseApiDate(b.lastUpdatedAt ?? b.requestedAt)?.getTime() ?? 0;
        return bTime - aTime;
      }),
    [reports]
  );

  function handleView(report: ReportHistoryRecord) {
    setSelectedReport(report);
    setIsModalOpen(true);
  }

  return (
    <section className="report-history-page">
      <header className="report-history-header">
        <h2>Report History</h2>
        <p>Track completed reports</p>
      </header>

      <div className="report-history-card">
        {loading && (
          <UxState
            type="loading"
            title="Loading reports..."
            message="Fetching your report history."
          />
        )}

        {!loading && error && (
          <UxState type="error" title="Unable to load report history" message={error} />
        )}

        {!loading && !error && sortedReports.length === 0 && (
          <UxState
            type="empty"
            title="No reports found"
            message={
              user?.role === 'ADMIN'
                ? 'No completed reports available yet.'
                : 'You have not submitted any reports yet.'
            }
          />
        )}

        {!loading && !error && sortedReports.length > 0 && (
          <div className="report-history-table-wrap">
            <table className="report-history-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Requested Date</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.map((report) => (
                  <tr key={report.id}>
                    <td className="report-history-title">{report.title}</td>
                    <td>{formatType(report.type)}</td>
                    <td>
                      <StatusBadge status={report.status} />
                    </td>
                    <td>{formatDate(report.requestedAt)}</td>
                    <td>{formatDate(report.lastUpdatedAt ?? report.requestedAt)}</td>
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
        onStatusUpdated={() => void loadReports(false)}
        readOnly={user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN'}
      />
    </section>
  );
}
