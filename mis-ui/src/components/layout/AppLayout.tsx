import { Outlet, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { navigationItems } from '../../routes/navigation';
import { normalizeRole } from '../../utils/role';
import { useAppDispatch } from '../../store/hooks';
import { loadCurrentUser, setUser } from '../../store/slices/authSlice';
import { loginSuperAdmin, logoutSuperAdmin } from '../../services/authService';
import Header from './Header';
import Footer from './Footer';
import SuperAdminLoginModal from '../features/superadmin/SuperAdminLoginModal';

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user } = useAuth();
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);

  const roleForNavigation = useMemo(() => normalizeRole(user?.role), [user?.role]);
  const showSuperAdminLogin = roleForNavigation === 'ADMIN' && location.pathname === '/';
  const showSuperAdminLogout = roleForNavigation === 'SUPER_ADMIN';

  const visibleNavigationItems = useMemo(
    () =>
      navigationItems.filter((item) =>
        roleForNavigation ? item.roles.includes(roleForNavigation) : false
      ),
    [roleForNavigation]
  );

  async function handleSuperAdminLogin(username: string, password: string) {
    const identity = await loginSuperAdmin({ username, password });
    dispatch(setUser(identity));
    setIsSuperAdminModalOpen(false);
  }

  async function handleSuperAdminLogout() {
    await logoutSuperAdmin();
    await dispatch(loadCurrentUser());
  }

  return (
    <div className="app-root">
      <Header
        items={visibleNavigationItems}
        showSuperAdminLogin={showSuperAdminLogin}
        onSuperAdminLoginClick={() => setIsSuperAdminModalOpen(true)}
        showSuperAdminLogout={showSuperAdminLogout}
        onSuperAdminLogoutClick={() => {
          void handleSuperAdminLogout();
        }}
      />
      <div className="app-shell">
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      <SuperAdminLoginModal
        isOpen={isSuperAdminModalOpen}
        onClose={() => setIsSuperAdminModalOpen(false)}
        onSubmit={handleSuperAdminLogin}
      />
      <Footer />
    </div>
  );
}
