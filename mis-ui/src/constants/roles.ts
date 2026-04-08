export const APP_ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'] as const;

export type AppRole = (typeof APP_ROLES)[number];
