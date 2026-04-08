import type { AppRole } from '../constants/roles';

export function normalizeRole(role?: string): AppRole | undefined {
  if (!role) return undefined;

  const normalized = role.trim().toUpperCase();
  if (normalized === 'USER' || normalized === 'ADMIN' || normalized === 'SUPER_ADMIN') {
    return normalized;
  }

  return undefined;
}
