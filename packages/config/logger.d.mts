export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type Logger = {
  debug: (message: string, fields?: Record<string, unknown>) => void;
  info: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
  error: (message: string, fields?: Record<string, unknown>) => void;
};

export function resolveLogLevel(): LogLevel;
export function resolveServiceName(fallback?: string): string;
export function redactSecrets(value: unknown, depth?: number): unknown;
export function createLogger(bindings?: {
  service?: string;
  correlationId?: string;
  event?: string;
  extra?: Record<string, unknown>;
}): Logger;
export const logger: Logger;
