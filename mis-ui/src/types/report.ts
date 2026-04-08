export type ReportStatus =
  | number
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLARIFICATION_NEEDED'
  | string;

export interface Report {
  id: string;
  title: string;
  type?: string;
  status: ReportStatus;
  requestedAt?: string; // ISO timestamp
  lastUpdatedAt?: string | null; // ISO timestamp
}
