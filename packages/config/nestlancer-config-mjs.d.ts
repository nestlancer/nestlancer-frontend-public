declare module '@nestlancer/config/proxy-api-v1.mjs' {
  export function resolveApiProxyUpstream(requestHost?: string): string;
  export function proxyApiV1(request: Request, pathSegments: string[]): Promise<Response>;
}

declare module '@nestlancer/config/correlation-id.mjs' {
  export const CORRELATION_COOKIE: string;
  export const CORRELATION_ID_PATTERN: RegExp;
  export function isUsableCorrelationId(value: unknown): value is string;
  export function mintCorrelationId(): string;
  export function readCookie(name: string, cookieHeader?: string): string | undefined;
  export function resolveCorrelationId(options?: {
    headers?: Headers | Record<string, string | string[] | undefined>;
    cookieHeader?: string;
    prefer?: string;
  }): string;
  export function applyCorrelationHeaders(
    headers: Headers | Record<string, string> | undefined,
    correlationId?: string
  ): Headers | Record<string, string>;
}

declare module '@nestlancer/config/logger.mjs' {
  export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

  export interface LoggerBindings {
    service?: string;
    correlationId?: string;
    event?: string;
    extra?: Record<string, unknown>;
  }

  export interface Logger {
    debug(message: string, fields?: Record<string, unknown>): void;
    info(message: string, fields?: Record<string, unknown>): void;
    warn(message: string, fields?: Record<string, unknown>): void;
    error(message: string, fields?: Record<string, unknown>): void;
    child(bindings?: LoggerBindings): Logger;
  }

  export function resolveLogLevel(): LogLevel;
  export function resolveServiceName(fallback?: string): string;
  export function redactSecrets(value: unknown, depth?: number): unknown;
  export function createLogger(bindings?: LoggerBindings): Logger;
  export const logger: Logger;
}

declare module '@nestlancer/config/route-log.mjs' {
  export function withRouteLog<
    T extends (request: Request, context?: unknown) => Promise<Response> | Response,
  >(
    handler: T,
    options: { service: string; event?: string }
  ): (request: Request, context?: unknown) => Promise<Response>;
}

declare module '@nestlancer/config/request-log.mjs' {
  export function withRequestLog(
    response: Response,
    request: { headers: Headers; nextUrl?: { pathname?: string }; method: string },
    service: string,
    options?: { setCorrelationCookie?: boolean }
  ): Response;
}
