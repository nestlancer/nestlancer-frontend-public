/**
 * Load repo-root env files for all Next.js apps (no per-app .env copies).
 *
 * Order (later wins):
 *   1. `.env.development` or `.env.production` (committed fallback / local edits)
 *   2. `.env.infisical` (Infisical export — Docker CD/VPS and optional local overlay)
 *
 * Import first line in each app's `next.config.mjs`:
 *   import '@nestlancer/config/load-root-env.mjs';
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Never let env files override runtime mode — breaks Next.js / React during `next build`. */
const PROTECTED_ENV_KEYS = new Set(['NODE_ENV']);

function applyEnvFile(filePath, { override = false } = {}) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (PROTECTED_ENV_KEYS.has(key)) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!key) continue;
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const mode =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';

applyEnvFile(resolve(repoRoot, `.env.${mode}`));
applyEnvFile(resolve(repoRoot, '.env.infisical'), { override: true });
