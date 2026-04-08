interface StatusBadgeProps {
  status: string | number;
}

type BadgeState = 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLARIFICATION_NEEDED' | 'REJECTED';

function normalizeStatus(value: string | number): BadgeState {
  if (typeof value === 'number') {
    switch (value) {
      case 0:
        return 'REQUESTED';
      case 1:
        return 'IN_PROGRESS';
      case 2:
        return 'COMPLETED';
      case 3:
        return 'CLARIFICATION_NEEDED';
      case 4:
        return 'REJECTED';
      default:
        return 'REQUESTED';
    }
  }

  const normalized = value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .trim()
    .toLowerCase();

  switch (normalized) {
    case 'requested':
    case 'pending':
      return 'REQUESTED';
    case 'in progress':
      return 'IN_PROGRESS';
    case 'completed':
      return 'COMPLETED';
    case 'clarification needed':
      return 'CLARIFICATION_NEEDED';
    case 'rejected':
      return 'REJECTED';
    default:
      return 'REQUESTED';
  }
}

function formatStatusLabel(state: BadgeState): string {
  switch (state) {
    case 'REQUESTED':
      return 'Requested';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CLARIFICATION_NEEDED':
      return 'Clarification Needed';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Requested';
  }
}

function statusClass(state: BadgeState) {
  switch (state) {
    case 'REQUESTED':
      return 'status-state-requested';
    case 'IN_PROGRESS':
      return 'status-state-in-progress';
    case 'COMPLETED':
      return 'status-state-completed';
    case 'CLARIFICATION_NEEDED':
      return 'status-state-clarification-needed';
    case 'REJECTED':
      return 'status-state-rejected';
    default:
      return 'status-state-requested';
  }
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const state = normalizeStatus(status);

  return (
    <span className={`status-badge ${statusClass(state)}`}>
      <span className="dot" />
      <span className="label">{formatStatusLabel(state)}</span>
    </span>
  );
}
