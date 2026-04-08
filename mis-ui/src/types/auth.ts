export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  epfNo: string;
  name: string;
  role: UserRole;
}
