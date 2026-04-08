import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { appConfig } from '../constants/appConfig';
import { logger } from '../utils/logger';

const baseURL = appConfig.apiBaseUrl;

export type ApiErrorEventDetail = {
  status?: number;
  message: string;
};

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

type ApiErrorPayload = {
  message?: unknown;
  title?: unknown;
};

function extractApiMessage(error: AxiosError): string {
  const payload = error.response?.data;

  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    const data = payload as ApiErrorPayload;
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.title === 'string' && data.title.trim()) {
      return data.title.trim();
    }
  }

  return error.message || 'API request failed.';
}

export function getApiErrorMessage(error: unknown, fallback = 'Request failed.'): string {
  if (axios.isAxiosError(error)) {
    return extractApiMessage(error);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function applyDevIdentityHeaders(
  cfg: InternalAxiosRequestConfig,
  epf: string,
  name: string
) {
  cfg.headers.set('X-EPF-NO', epf);
  cfg.headers.set('X-USER-NAME', name);
}

// In dev, automatically send a default EPF header so the API middleware can identify a dev user.
if (import.meta.env.DEV) {
  const devRole = appConfig.devUserRole;

  // Default dev names and epf numbers for header-authenticated roles.
  const defaultUser = {
    USER: { epf: 'U1', name: 'Mehan' },
    ADMIN: { epf: 'ADM', name: 'Admin' },
  } as const;

  const roleDefaults = defaultUser[devRole];

  const devEpf = appConfig.devEpf ?? roleDefaults.epf;
  const devName = appConfig.devUserName ?? roleDefaults.name;

  api.interceptors.request.use((cfg) => {
    applyDevIdentityHeaders(cfg, devEpf, devName);
    logger.debug('api', 'Attached development identity headers.', {
      epf: devEpf,
      role: devRole,
    });
    return cfg;
  });
}

// Response interceptor: log 401s for now (could redirect to login later)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = extractApiMessage(error);

      if (status === 401) {
        apiEvents.dispatchEvent(new CustomEvent('unauthorized'));
      }

      const detail: ApiErrorEventDetail = { status, message };
      apiEvents.dispatchEvent(new CustomEvent<ApiErrorEventDetail>('api-error', { detail }));

      logger.warn('api', 'API request failed.', {
        status,
        message,
        url: error.config?.url,
        method: error.config?.method,
      });
    }
    return Promise.reject(error);
  }
);

export default api;

// Simple event mechanism to notify other parts of the app about API-level events
export const apiEvents = new EventTarget();
