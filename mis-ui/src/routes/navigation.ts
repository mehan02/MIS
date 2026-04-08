export type NavItem = {
  label: string;
  path: string;
  roles: ('USER' | 'ADMIN' | 'SUPER_ADMIN')[];
};

export const navigationItems: NavItem[] = [
  {
    label: 'Home',
    path: '/',
    roles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    label: 'Request Report',
    path: '/request',
    roles: ['USER'],
  },
  {
    label: 'Report Requests',
    path: '/admin/reports',
    roles: ['ADMIN'],
  },
  {
    label: 'Report History',
    path: '/history',
    roles: ['USER', 'ADMIN'],
  },
  {
    label: 'User Management',
    path: '/super-admin/users',
    roles: ['SUPER_ADMIN'],
  },
];
