import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import axios from 'axios';
import type { Report } from '../types/report';
import { fetchAllReports, fetchMyReports } from '../services/reportService';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { FiClock, FiLoader, FiCheckCircle, FiAlertCircle, FiPlus, FiEye } from 'react-icons/fi';
import Button from '../components/common/Button';
import UxState from '../components/common/UxState';
import StatusBadge from '../components/common/StatusBadge';
import AdminReportDetailsModal from '../components/features/admin/AdminReportDetailsModal';

type DashboardStat = {
  key: 'pending' | 'inProgress' | 'completed' | 'clarification';
  label: string;
  value: number;
  icon: ReactElement;
  cardClass: string;
};

type HomeReport = Report & {
  requestedAt?: string;
  type?: string;
  status: string | number;
  department?: string;
  contactNumber?: string;
  requestedByEpf?: string;
  requestedByName?: string;
  lastUpdatedAt?: string | null;
  attachment?: unknown;
  hasAttachment?: boolean;
  attachmentId?: string;
  attachments?: Array<{
    id: string;
    fileName?: string;
    uploadedAt?: string;
  }>;
};

function normalizeStatus(
  status: string | number | undefined
): 'pending' | 'inProgress' | 'completed' | 'clarification' {
  if (typeof status === 'number') {
    switch (status) {
      case 0:
        return 'pending';
      case 1:
        return 'inProgress';
      case 2:
        return 'completed';
      case 3:
      case 4:
        return 'clarification';
      default:
        return 'pending';
    }
  }

  const normalized = (status ?? '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .trim()
    .toLowerCase();
  if (normalized === 'requested' || normalized === 'pending') return 'pending';
  if (normalized === 'in progress') return 'inProgress';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'clarification needed' || normalized === 'rejected') return 'clarification';
  return 'pending';
}

function formatReportType(type?: string) {
  if (!type) return 'Ad-hoc Report';
  const normalized = type.trim().toLowerCase();
  if (normalized === 'adhoc' || normalized === 'ad_hoc') return 'Ad-hoc Report';
  if (normalized === 'monthly') return 'Monthly Report';
  if (normalized === 'quarterly') return 'Quarterly Report';
  return type;
}

function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;
  const normalized = /([zZ]|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatLastUpdated(value?: string | null) {
  const date = parseApiDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatRequestedDate(value?: string | null) {
  const date = parseApiDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isAdminOnly = user?.role === 'ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [reports, setReports] = useState<HomeReport[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<HomeReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const refreshReports = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const load = isAdmin ? fetchAllReports : fetchMyReports;
        const data = await load(signal);
        setReports((data as unknown as HomeReport[]) ?? []);
      } catch (e) {
        if (axios.isAxiosError(e) && e.code === 'ERR_CANCELED') {
          return;
        }
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    const ac = new AbortController();
    void refreshReports(ac.signal);

    return () => ac.abort();
  }, [refreshReports]);

  const stats = useMemo(() => {
    const init = { pending: 0, inProgress: 0, completed: 0, clarification: 0 };
    if (!reports) return init;
    for (const r of reports) {
      switch (normalizeStatus(r.status)) {
        case 'pending':
          init.pending++;
          break;
        case 'inProgress':
          init.inProgress++;
          break;
        case 'completed':
          init.completed++;
          break;
        case 'clarification':
          init.clarification++;
          break;
        default:
          break;
      }
    }
    return init;
  }, [reports]);

  const statsCards: DashboardStat[] = useMemo(
    () => [
      {
        key: 'pending',
        label: 'Pending Reports',
        value: stats.pending,
        icon: <FiClock />,
        cardClass: 'card-pending',
      },
      {
        key: 'inProgress',
        label: 'In Progress',
        value: stats.inProgress,
        icon: <FiLoader />,
        cardClass: 'card-inprogress',
      },
      {
        key: 'completed',
        label: 'Completed',
        value: stats.completed,
        icon: <FiCheckCircle />,
        cardClass: 'card-completed',
      },
      {
        key: 'clarification',
        label: 'Rejected / Clarification Needed',
        value: stats.clarification,
        icon: <FiAlertCircle />,
        cardClass: 'card-clarify',
      },
    ],
    [stats]
  );

  const recent = useMemo(() => {
    return [...(reports ?? [])]
      .sort((a, b) => {
        const aTime = parseApiDate(a.lastUpdatedAt ?? a.requestedAt)?.getTime() ?? 0;
        const bTime = parseApiDate(b.lastUpdatedAt ?? b.requestedAt)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [reports]);

  const pendingRequests = useMemo(() => {
    return [...(reports ?? [])]
      .filter((r) => normalizeStatus(r.status) === 'pending')
      .sort((a, b) => {
        const aTime = parseApiDate(a.lastUpdatedAt ?? a.requestedAt)?.getTime() ?? 0;
        const bTime = parseApiDate(b.lastUpdatedAt ?? b.requestedAt)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [reports]);

  function handleView(report: HomeReport) {
    setSelectedReport(report);
    setIsModalOpen(true);
  }

  return (
    <section className="home-page">
      <header className="hero">
        <div>
          <h1 className="hero-title">Welcome back, {user?.name ?? user?.epfNo ?? '(Name)'}</h1>
          <h2 className="hero-heading">
            {isAdminOnly
              ? 'MIS Unit Report Management System Admin Dashboard'
              : 'MIS Unit Report Management System'}
          </h2>
          {!isAdmin && (
            <p className="hero-sub">
              Request, generate, and track your reports efficiently from one central dashboard
            </p>
          )}
        </div>
      </header>

      <div className="dashboard-cards">
        {statsCards.map((card) => (
          <div key={card.key} className={`stat-card ${card.cardClass}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-body">
              <div className="stat-value-wrap">
                <span className="stat-value">{loading ? '…' : card.value}</span>
                <span className="stat-title">{card.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <div className="quick-actions">
          <div className="quick-actions-header">
            <h3>Quick Actions</h3>
          </div>

          <Link className="quick-card only-action" to="/request" aria-label="Request Ad-hoc Report">
            <div className="quick-icon">
              <FiPlus />
            </div>
            <div>
              <div className="quick-title">Request</div>
              <div className="quick-sub">Ad-hoc Report</div>
            </div>
          </Link>
        </div>
      )}

      <div className="recent">
        <div className="recent-header">
          <h3>{isAdmin ? (isSuperAdmin ? 'Recent Activities' : 'Pending Requests') : 'Recent Activity'}</h3>
        </div>

        {loading && (
          <UxState
            type="loading"
            title="Loading reports..."
            message={isAdmin ? 'Fetching pending requests.' : 'Fetching your recent activity.'}
          />
        )}
        {!loading && error && (
          <UxState type="error" title="Unable to load reports" message={error} />
        )}

        {!loading && !error && !isAdmin && recent.length > 0 && (
          <table className="recent-table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className="report-title">{r.title}</td>
                  <td>{formatReportType(r.type)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{formatLastUpdated(r.lastUpdatedAt)}</td>
                  <td>
                    <Button
                      className="report-history-download-btn home-table-action-btn"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleView(r)}
                    >
                      <FiEye /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && isAdmin && pendingRequests.length > 0 && (
          <table className="recent-table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Requested By</th>
                <th>Type</th>
                <th>Requested Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((r) => (
                <tr key={r.id}>
                  <td className="report-title">{r.title}</td>
                  <td>{r.requestedByName ?? r.requestedByEpf ?? '-'}</td>
                  <td>{formatReportType(r.type)}</td>
                  <td>{formatRequestedDate(r.requestedAt)}</td>
                  <td>
                    <Button
                      className="report-history-download-btn home-table-action-btn"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleView(r)}
                    >
                      <FiEye /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && !isAdmin && recent.length === 0 && (
          <UxState type="empty" title="No reports found" message="No recent report activity yet." />
        )}

        {!loading && !error && isAdmin && pendingRequests.length === 0 && (
          <UxState
            type="empty"
            title="No pending requests"
            message="There are currently no pending report requests."
          />
        )}
      </div>

      <AdminReportDetailsModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReport(null);
        }}
        onStatusUpdated={() => refreshReports()}
        readOnly={!isAdmin}
      />
    </section>
  );
}
