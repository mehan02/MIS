import { NavLink, Outlet } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../assets/styles/app.css';
import logo from '../assets/images/slic-life.png';
import { navigationItems } from '../routes/navigation';

export default function AppLayout() {
  const { user } = useAuth();

  const roleForNavigation = useMemo<'USER' | 'ADMIN' | 'SUPER_ADMIN' | undefined>(() => {
    if (!user?.role) return undefined;
    if (user.role === 'USER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return user.role;
    }
    return undefined;
  }, [user?.role]);

  const visibleNavigationItems = useMemo(
    () => navigationItems.filter((item) => (roleForNavigation ? item.roles.includes(roleForNavigation) : false)),
    [roleForNavigation]
  );

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img src={logo} alt="MIS logo" className="app-logo" />

            <nav className="nav-tabs" aria-label="Primary">
              {visibleNavigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
