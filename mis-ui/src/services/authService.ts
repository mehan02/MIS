import type { User } from '../types/auth';
import api from './api';
import { getApiErrorMessage } from './api';
import axios from 'axios';

type UnauthorizedError = Error & { status?: number };

type SuperAdminLoginPayload = {
  username: string;
  password: string;
};

export async function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  try {
    const resp = await api.get<User>('/api/me', { signal });
    const data = resp.data;

    if (
      !data ||
      typeof data.epfNo !== 'string' ||
      typeof data.name !== 'string' ||
      typeof data.role !== 'string'
    ) {
      throw new Error('Malformed user payload');
    }

    return { epfNo: data.epfNo, name: data.name, role: data.role as User['role'] };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ERR_CANCELED') {
        throw err;
      }

      const status = err.response?.status;
      if (status === 401) {
        const e: UnauthorizedError = new Error('Unauthorized');
        e.status = 401;
        throw e;
      }

      throw new Error(getApiErrorMessage(err));
    }

    throw err;
  }
}

export async function loginSuperAdmin(
  payload: SuperAdminLoginPayload,
  signal?: AbortSignal
): Promise<User> {
  try {
    const resp = await api.post<User>('/api/superadmin/auth/login', payload, { signal });
    const data = resp.data;

    if (
      !data ||
      typeof data.epfNo !== 'string' ||
      typeof data.name !== 'string' ||
      typeof data.role !== 'string'
    ) {
      throw new Error('Malformed user payload');
    }

    return { epfNo: data.epfNo, name: data.name, role: data.role as User['role'] };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ERR_CANCELED') {
        throw err;
      }

      throw new Error(getApiErrorMessage(err, 'Super admin login failed.'));
    }

    throw err;
  }
}

export async function logoutSuperAdmin(signal?: AbortSignal): Promise<void> {
  try {
    await api.post('/api/superadmin/auth/logout', undefined, { signal });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ERR_CANCELED') {
        throw err;
      }

      throw new Error(getApiErrorMessage(err, 'Super admin logout failed.'));
    }

    throw err;
  }
}
