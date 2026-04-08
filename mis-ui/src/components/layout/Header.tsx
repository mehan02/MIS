import { NavLink } from 'react-router-dom';
import { FiShield, FiLogOut } from 'react-icons/fi';
import logo from '../../assets/images/slic-life.png';
import type { NavItem } from '../../routes/navigation';

interface HeaderProps {
  items: NavItem[];
  showSuperAdminLogin?: boolean;
  onSuperAdminLoginClick?: () => void;
  showSuperAdminLogout?: boolean;
  onSuperAdminLogoutClick?: () => void;
}

export default function Header({
  items,
  showSuperAdminLogin = false,
  onSuperAdminLoginClick,
  showSuperAdminLogout = false,
  onSuperAdminLogoutClick,
}: HeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <img src={logo} alt="MIS logo" className="app-logo" />

          <nav className="nav-tabs" aria-label="Primary">
            {items.map((item) => (
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

        {(showSuperAdminLogin || showSuperAdminLogout) && (
          <div className="top-actions">
            {showSuperAdminLogin && (
              <button
                type="button"
                className="topbar-superadmin-trigger"
                onClick={onSuperAdminLoginClick}
                aria-label="Open super admin login"
              >
                <FiShield />
                <span>Super Admin Login</span>
              </button>
            )}

            {showSuperAdminLogout && (
              <button
                type="button"
                className="topbar-superadmin-trigger topbar-superadmin-logout"
                onClick={onSuperAdminLogoutClick}
                aria-label="Sign out from super admin"
              >
                <FiLogOut />
                <span>Super Admin Logout</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
