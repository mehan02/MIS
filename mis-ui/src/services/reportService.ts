import type { Report } from '../types/report';
import api from './api';
import { getApiErrorMessage } from './api';
import axios from 'axios';

function toFieldLabel(field: string): string {
  const normalized =
    field
      .replace(/\[\d+\]/g, '')
      .split('.')
      .pop() ?? field;
  switch (normalized.toLowerCase()) {
    case 'title':
      return 'Title';
    case 'description':
      return 'Description';
    case 'contactnumber':
      return 'Contact Number';
    case 'file':
      return 'File';
    case 'department':
      return 'Department';
    case 'priority':
      return 'Priority';
    default:
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}

function normalizeValidationMessage(fieldLabel: string, message: string): string {
  const maxLengthMatch = message.match(/maximum length of\s*'?(\d+)'?/i);
  if (maxLengthMatch?.[1]) {
    return `${fieldLabel} cannot exceed ${maxLengthMatch[1]} characters.`;
  }

  if (/must not be empty|required/i.test(message)) {
    return `${fieldLabel} is required.`;
  }

  return message;
}

function extractApiErrorMessage(data: unknown): string | null {
  if (typeof data === 'string') {
    const text = data.trim();
    return text.length > 0 ? text : null;
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as {
    message?: unknown;
    title?: unknown;
    errors?: Record<string, unknown>;
  };

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }

  if (payload.errors && typeof payload.errors === 'object') {
    const validationMessages: string[] = [];
    for (const [field, value] of Object.entries(payload.errors)) {
      const fieldLabel = toFieldLabel(field);
      const messages = Array.isArray(value) ? value : [value];

      for (const message of messages) {
        if (typeof message !== 'string' || !message.trim()) {
          continue;
        }
        validationMessages.push(normalizeValidationMessage(fieldLabel, message.trim()));
      }
    }

    if (validationMessages.length > 0) {
      return validationMessages.join(' ');
    }
  }

  if (typeof payload.title === 'string' && payload.title.trim()) {
    return payload.title.trim();
  }

  return null;
}

export interface CreateAdHocReportPayload {
  title: string;
  description: string;
  department?: string;
  priority?: string;
  contactNumber?: string;
  files?: File[];
}

export async function fetchMyReports(signal?: AbortSignal): Promise<Report[]> {
  try {
    const resp = await api.get<Report[]>('/api/reports/my', { signal });
    return resp.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ERR_CANCELED') {
        throw err;
      }
      throw new Error(getApiErrorMessage(err));
    }
    throw err;
  }
}

export async function fetchAllReports(signal?: AbortSignal): Promise<Report[]> {
  try {
    const resp = await api.get<Report[]>('/api/reports', { signal });
    return resp.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ERR_CANCELED') {
        throw err;
      }
      throw new Error(getApiErrorMessage(err));
    }
    throw err;
  }
}

export async function createAdHocReport(payload: CreateAdHocReportPayload): Promise<void> {
  const formData = new FormData();
  formData.append('title', payload.title.trim());
  formData.append('description', payload.description.trim());

  if (payload.department?.trim()) {
    formData.append('department', payload.department.trim());
  }

  if (payload.priority?.trim()) {
    formData.append('priority', payload.priority.trim());
  }

  if (payload.contactNumber?.trim()) {
    formData.append('ContactNumber', payload.contactNumber.trim());
  }

  if (payload.files && payload.files.length > 0) {
    for (const file of payload.files) {
      formData.append('Files', file);
    }
  }

  try {
    await api.post('/api/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const message = extractApiErrorMessage(err.response?.data) ?? getApiErrorMessage(err);
      throw new Error(message || 'Failed to submit report request.');
    }
    throw err;
  }
}

export type AdminReportStatus =
  | 'Requested'
  | 'InProgress'
  | 'Completed'
  | 'ClarificationNeeded'
  | 'Rejected';

function toStatusCode(status: AdminReportStatus): number {
  switch (status) {
    case 'Requested':
      return 0;
    case 'InProgress':
      return 1;
    case 'Completed':
      return 2;
    case 'ClarificationNeeded':
      return 3;
    case 'Rejected':
      return 4;
    default:
      return 0;
  }
}

export async function updateReportStatus(
  reportId: string,
  status: AdminReportStatus
): Promise<void> {
  try {
    await api.put(`/api/reports/${reportId}/status`, { status: toStatusCode(status) });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const message = getApiErrorMessage(err, 'Failed to update report status.');
      throw new Error(message || 'Failed to update report status.');
    }
    throw err;
  }
}
