/**
 * Zero-dep structured logger for Next.js server runtimes.
 * Writes one JSON object per line to stdout/stderr for Docker / Promtail.
 */

const LEVELS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
});

const SECRET_KEY_PATTERN =
  /pass(word|wd)|secret|token|authorization|cookie|refresh|access.?token|api.?key|private.?key|credential/i;

/**
 * @param {unknown} value
 * @returns {'debug'|'info'|'warn'|'error'}
 */
function normalizeLevel(value) {
  if (typeof value !== 'string') return 'info';
  const lower = value.trim().toLowerCase();
  if (lower in LEVELS) return /** @type {'debug'|'info'|'warn'|'error'} */ (lower);
  return 'info';
}

export function resolveLogLevel() {
  if (process.env.LOG_LEVEL) return normalizeLevel(process.env.LOG_LEVEL);
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Prefer NESTLANCER_SERVICE; else fall back for env without compose override.
 * @param {string} [fallback]
 */
export function resolveServiceName(fallback = 'nl-frontend') {
  const fromEnv = process.env.NESTLANCER_SERVICE;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim();
  return fallback;
}

/**
 * Redact secret-looking keys recursively (shallow-safe for log payloads).
 * @param {unknown} value
 * @param {number} [depth]
 * @returns {unknown}
 */
export function redactSecrets(value, depth = 0) {
  if (depth > 4 || value == null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item, depth + 1));
  }
  if (typeof value !== 'object') return value;
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = redactSecrets(raw, depth + 1);
    }
  }
  return out;
}

/**
 * @typedef {object} LoggerBindings
 * @property {string} [service]
 * @property {string} [correlationId]
 * @property {string} [event]
 * @property {Record<string, unknown>} [extra]
 */

/**
 * @param {LoggerBindings} [bindings]
 */
export function createLogger(bindings = {}) {
  const baseService = bindings.service || resolveServiceName();
  const baseCorrelationId = bindings.correlationId;
  const baseEvent = bindings.event;
  const baseExtra = bindings.extra && typeof bindings.extra === 'object' ? bindings.extra : {};

  /**
   * @param {'debug'|'info'|'warn'|'error'} level
   * @param {string} message
   * @param {Record<string, unknown>} [fields]
   */
  function write(level, message, fields = {}) {
    const min = LEVELS[resolveLogLevel()] ?? LEVELS.info;
    if ((LEVELS[level] ?? LEVELS.info) < min) return;

    const safeFields =
      fields && typeof fields === 'object' ? /** @type {Record<string, unknown>} */ (redactSecrets(fields)) : {};

    const payload = {
      level,
      message: typeof message === 'string' ? message : String(message),
      timestamp: new Date().toISOString(),
      service:
        typeof safeFields.service === 'string' ? safeFields.service : baseService,
      ...baseExtra,
      ...safeFields,
    };

    if (baseEvent && payload.event == null) payload.event = baseEvent;
    if (baseCorrelationId && payload.correlationId == null) {
      payload.correlationId = baseCorrelationId;
    }

    // Avoid duplicating service if it was in fields and base
    if (typeof fields.service === 'string') payload.service = fields.service;

    const line = JSON.stringify(payload);
    if (level === 'error' || level === 'warn') {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  return {
    debug(message, fields) {
      write('debug', message, fields);
    },
    info(message, fields) {
      write('info', message, fields);
    },
    warn(message, fields) {
      write('warn', message, fields);
    },
    error(message, fields) {
      write('error', message, fields);
    },
    /**
     * @param {LoggerBindings} childBindings
     */
    child(childBindings = {}) {
      return createLogger({
        service: childBindings.service || baseService,
        correlationId: childBindings.correlationId || baseCorrelationId,
        event: childBindings.event || baseEvent,
        extra: {
          ...baseExtra,
          ...(childBindings.extra && typeof childBindings.extra === 'object'
            ? childBindings.extra
            : {}),
          ...(childBindings.correlationId
            ? { correlationId: childBindings.correlationId }
            : {}),
        },
      });
    },
  };
}

/** Process-wide default logger (service from env or nl-frontend). */
export const logger = createLogger();
