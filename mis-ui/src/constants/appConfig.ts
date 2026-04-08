import { z } from 'zod';
import { logger } from '../utils/logger';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_API_PROXY_TARGET: z.string().url().optional(),
  VITE_DEV_USER_ROLE: z.enum(['USER', 'ADMIN']).optional(),
  VITE_DEV_EPF: z.string().min(1).optional(),
  VITE_DEV_USER_NAME: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  // Keep startup resilient by falling back to defaults while surfacing config issues.
  logger.warn('config', 'Invalid environment configuration detected.',
    parsedEnv.error.flatten());
}

const env = parsedEnv.success ? parsedEnv.data : {};

export const appConfig = {
  apiBaseUrl: env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5242',
  apiProxyTarget: env.VITE_API_PROXY_TARGET,
  devUserRole: env.VITE_DEV_USER_ROLE ?? 'USER',
  devEpf: env.VITE_DEV_EPF,
  devUserName: env.VITE_DEV_USER_NAME,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
