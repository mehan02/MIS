type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const activeLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[activeLevel];
}

function formatScope(scope: string): string {
  return `[MIS:${scope}]`;
}

export const logger = {
  debug(scope: string, message: string, meta?: unknown) {
    if (!shouldLog('debug')) return;
    console.debug(formatScope(scope), message, meta ?? '');
  },
  info(scope: string, message: string, meta?: unknown) {
    if (!shouldLog('info')) return;
    console.info(formatScope(scope), message, meta ?? '');
  },
  warn(scope: string, message: string, meta?: unknown) {
    if (!shouldLog('warn')) return;
    console.warn(formatScope(scope), message, meta ?? '');
  },
  error(scope: string, message: string, meta?: unknown) {
    if (!shouldLog('error')) return;
    console.error(formatScope(scope), message, meta ?? '');
  },
};
