import { createLogger, resolveServiceName } from '@nestlancer/config/logger.mjs';

export async function register() {
  // Node runtime only — Edge instrumentation must stay free of Node APIs.
  if (process.env.NEXT_RUNTIME === 'edge') return;

  const service = resolveServiceName('nl-prod-frontend-web');
  const log = createLogger({ service });
  log.info('frontend app starting', {
    event: 'app.start',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  });
}
