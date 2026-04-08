import { NavLink } from 'react-router-dom';
import type { NavItem } from '../../routes/navigation';

interface SidebarProps {
  items: NavItem[];
}

export default function Sidebar({ items }: SidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="Sidebar navigation">
      <nav className="app-sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive ? 'app-sidebar-link active' : 'app-sidebar-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
