import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import './assets/styles/app.css';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAppDispatch } from './store/hooks';
import { clearAuth, loadCurrentUser } from './store/slices/authSlice';
import { store } from './store';
import { apiEvents } from './services/api';
import type { ApiErrorEventDetail } from './services/api';
import { logger } from './utils/logger';

const AppLayout = lazy(() => import('./components/layout/AppLayout'));
const Home = lazy(() => import('./pages/Home'));
const RequestReport = lazy(() => import('./pages/RequestReport'));
const ReportHistory = lazy(() => import('./pages/ReportHistory'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const SuperAdminUsers = lazy(() => import('./pages/superadmin/SuperAdminUsers'));

function AppShell() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(loadCurrentUser());

    const onUnauthorized = () => {
      dispatch(clearAuth());
    };
    const onApiError = (event: Event) => {
      const customEvent = event as CustomEvent<ApiErrorEventDetail>;
      if (!customEvent.detail) {
        return;
      }

      logger.warn('app', 'Global API error captured.', customEvent.detail);
    };

    apiEvents.addEventListener('unauthorized', onUnauthorized as EventListener);
    apiEvents.addEventListener('api-error', onApiError as EventListener);

    return () => {
      apiEvents.removeEventListener('unauthorized', onUnauthorized as EventListener);
      apiEvents.removeEventListener('api-error', onApiError as EventListener);
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Suspense
        fallback={<div style={{ padding: '1rem 0', color: '#4b5563' }}>Loading page...</div>}
      >
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route
              index
              element={
                <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'SUPER_ADMIN']}>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="request"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <RequestReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="history"
              element={
                <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                  <ReportHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="super-admin/users"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <SuperAdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="super-admin/*"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <Navigate to="/super-admin/users" replace />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </Provider>
  );
}
