import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { normalizeRole } from '../utils/role';
import type { AppRole } from '../constants/roles';

type AllowedRole = AppRole;

interface ProtectedRouteProps {
  allowedRoles: AllowedRole[];
  children?: ReactNode;
  fallbackPath?: string;
}

export default function ProtectedRoute({
  allowedRoles,
  children,
  fallbackPath,
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: '1rem 0', color: '#4b5563' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#4b5563' }}>
        <h2>Authentication error</h2>
        <p>{error.message}</p>
        <p>
          Verify that the backend is running and the frontend can reach{' '}
          <code>{import.meta.env.VITE_API_BASE_URL}</code> (resolved to{' '}
          <code>{api.defaults.baseURL}</code>). Also ensure your browser is not blocking requests
          due to CORS or self-signed certificates.
        </p>
      </div>
    );
  }

  if (!user) {
    if (fallbackPath) {
      return (
        <Navigate
          to={fallbackPath}
          replace
          state={{ from: location.pathname, reason: 'not-authenticated' }}
        />
      );
    }

    return (
      <div style={{ padding: '2rem', color: '#4b5563' }}>
        <h2>Not authenticated</h2>
        <p>
          No user identity could be loaded. Ensure the backend is providing authentication headers
          or your environment is configured to send the expected user context.
        </p>
      </div>
    );
  }

  const role = normalizeRole(user.role);
  const isAllowed = Boolean(role && allowedRoles.includes(role));

  if (!isAllowed) {
    if (fallbackPath) {
      return (
        <Navigate
          to={fallbackPath}
          replace
          state={{ from: location.pathname, reason: 'forbidden' }}
        />
      );
    }

    return (
      <div style={{ padding: '2rem', color: '#4b5563' }}>
        <h2>Access denied</h2>
        <p>You do not have the required role to view this page.</p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
