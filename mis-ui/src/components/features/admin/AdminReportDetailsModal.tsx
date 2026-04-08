import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import { updateReportStatus } from '../../../services/reportService';
import type { AdminReportStatus } from '../../../services/reportService';
import api from '../../../services/api';
import '../../../assets/styles/components/admin-report-details-modal.css';

type TransitionState =
  | 'Requested'
  | 'InProgress'
  | 'Completed'
  | 'ClarificationNeeded'
  | 'Rejected';

type AttachmentLike = {
  id: string;
  fileName?: string;
  uploadedAt?: string;
};

type ReportLike = {
  id: string;
  title?: string;
  description?: string;
  department?: string;
  contactNumber?: string;
  requestedByName?: string;
  requestedByEpf?: string;
  requestedAt?: string;
  lastUpdatedAt?: string | null;
  status?: string | number;
  attachment?: unknown;
  attachmentId?: string;
  hasAttachment?: boolean;
  attachments?: AttachmentLike[];
};

interface AdminReportDetailsModalProps {
  report: ReportLike | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void | Promise<void>;
  readOnly?: boolean;
}

const STATUS_LABELS: Record<TransitionState, string> = {
  Requested: 'Requested',
  InProgress: 'In Progress',
  Completed: 'Completed',
  ClarificationNeeded: 'Clarification Needed',
  Rejected: 'Rejected',
};

const ALLOWED_TRANSITIONS: Record<TransitionState, TransitionState[]> = {
  Requested: ['InProgress', 'Completed', 'ClarificationNeeded'],
  InProgress: ['Completed', 'ClarificationNeeded'],
  ClarificationNeeded: ['InProgress', 'Completed'],
  Completed: [],
  Rejected: [],
};

function normalizeStatus(status?: string | number): TransitionState {
  if (typeof status === 'number') {
    switch (status) {
      case 0:
        return 'Requested';
      case 1:
        return 'InProgress';
      case 2:
        return 'Completed';
      case 3:
        return 'ClarificationNeeded';
      case 4:
        return 'Rejected';
      default:
        return 'Requested';
    }
  }

  const normalized = (status ?? '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .trim()
    .toLowerCase();
  if (normalized === 'in progress') return 'InProgress';
  if (normalized === 'clarification needed') return 'ClarificationNeeded';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'requested' || normalized === 'pending') return 'Requested';
  return 'Requested';
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

function parseFileNameFromDisposition(headerValue?: string) {
  if (!headerValue) return undefined;
  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = headerValue.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1];
}

function Detail({
  label,
  value,
  full = false,
}: {
  label: string;
  value: ReactNode;
  full?: boolean;
}) {
  return (
    <p className={`admin-report-detail ${full ? 'admin-report-detail-full' : ''}`}>
      <strong>{label}:</strong> {value}
    </p>
  );
}

export default function AdminReportDetailsModal({
  report,
  isOpen,
  onClose,
  onStatusUpdated,
  readOnly = false,
}: AdminReportDetailsModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<TransitionState | ''>('');
  const [loading, setLoading] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attachments = useMemo(() => {
    if (!report) return [] as AttachmentLike[];
    if (report.attachments && report.attachments.length > 0) return report.attachments;
    if (report.attachmentId) return [{ id: report.attachmentId }];
    return [] as AttachmentLike[];
  }, [report]);

  const currentStatus = useMemo(() => normalizeStatus(report?.status), [report?.status]);
  const allowedTransitions = useMemo(() => ALLOWED_TRANSITIONS[currentStatus], [currentStatus]);
  const isFinalState = allowedTransitions.length === 0;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedStatus(allowedTransitions[0] ?? '');
    setError(null);
  }, [isOpen, report?.id, allowedTransitions]);

  async function handleUpdateStatus() {
    if (!report || !selectedStatus) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateReportStatus(report.id, selectedStatus as AdminReportStatus);
      await onStatusUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadAttachment(attachment: AttachmentLike) {
    if (!report) {
      return;
    }

    setDownloadingAttachmentId(attachment.id);
    setError(null);

    try {
      const response = await api.get(`/api/reports/${report.id}/attachments/${attachment.id}`, {
        responseType: 'blob',
      });

      const disposition = response.headers['content-disposition'] as string | undefined;
      const suggestedName =
        parseFileNameFromDisposition(disposition) ??
        attachment.fileName ??
        `report-${report.id}-attachment`;
      const contentType =
        (response.headers['content-type'] as string | undefined) ?? 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = suggestedName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to download attachment.');
    } finally {
      setDownloadingAttachmentId(null);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Details">
      <div className="admin-report-modal">
        <div className="admin-report-details-grid">
          <Detail label="Title" value={report?.title ?? '-'} />
          <Detail label="Current Status" value={STATUS_LABELS[currentStatus]} />
          <Detail label="User Name" value={report?.requestedByName ?? '-'} />
          <Detail label="Department" value={report?.department ?? '-'} />
          <Detail label="Requested Date" value={formatDate(report?.requestedAt)} />
          <Detail label="Contact Number" value={report?.contactNumber ?? '-'} />
          <Detail label="Description" value={report?.description ?? '-'} full />
        </div>

        {attachments.length > 0 && (
          <div className="admin-report-attachments">
            <h4>Attachments</h4>
            <div className="admin-report-attachments-list">
              {attachments.map((attachment) => (
                <Button
                  key={attachment.id}
                  type="button"
                  className="admin-report-download-btn"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownloadAttachment(attachment)}
                  disabled={downloadingAttachmentId === attachment.id}
                >
                  {downloadingAttachmentId === attachment.id
                    ? 'Downloading...'
                    : (attachment.fileName ?? 'Download Attachment')}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!readOnly && (
          <div className="admin-report-status-section">
            <label htmlFor="admin-next-status">Next Status</label>
            <select
              id="admin-next-status"
              className="admin-report-status-select"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as TransitionState)}
              disabled={isFinalState || loading}
            >
              {allowedTransitions.length === 0 && (
                <option value="">No transitions available</option>
              )}
              {allowedTransitions.map((transition) => (
                <option key={transition} value={transition}>
                  {STATUS_LABELS[transition]}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="admin-report-status-error" role="alert">
            {error}
          </p>
        )}

        {!readOnly && (
          <div className="admin-report-actions">
            <span />

            <Button
              type="button"
              className="admin-report-update-btn"
              variant="primary"
              size="md"
              onClick={handleUpdateStatus}
              disabled={isFinalState || loading || !selectedStatus}
            >
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
