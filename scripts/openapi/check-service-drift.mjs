#!/usr/bin/env node
/**
 * Compare hand-written api-client service paths against openapi-gateway.json.
 * Exits 1 when a service method references a path/method pair missing from OpenAPI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const servicesDir = path.join(root, 'packages/api-client/src/services');
const specPath = path.join(root, 'swagger-docs/openapi-gateway.json');

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

function normalizeServicePath(raw) {
  let p = raw.trim();
  if (p.startsWith('`/')) p = p.slice(1);
  if (p.endsWith('`')) p = p.slice(0, -1);
  p = p.replace(/\$\{encodeURIComponent\([^)]+\)\}/g, '{id}');
  p = p.replace(/\$\{[^}]+\}/g, '{id}');
  if (!p.startsWith('/')) p = `/${p}`;
  return p.replace(/\/+/g, '/');
}

function normalizePathForCompare(p) {
  return p
    .replace(/^\/api\/v1/, '')
    .replace(/\{[^}]+\}/g, '{param}')
    .replace(/\/+/g, '/') || '/';
}

function loadOpenApiIndex(spec) {
  const index = new Set();
  for (const [routePath, methods] of Object.entries(spec.paths ?? {})) {
    const normalized = normalizePathForCompare(routePath);
    for (const method of METHODS) {
      if (methods[method]) {
        index.add(`${method.toUpperCase()} ${normalized}`);
      }
    }
  }
  return index;
}

function extractServiceCalls(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const calls = [];
  const regex = /this\.client\.(get|post|put|patch|delete)<[^>]*>\(\s*(`[^`]+`|'[^']+'|"[^"]+")/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const rawPath = match[2].slice(1, -1);
    const pathNorm = normalizePathForCompare(normalizeServicePath(rawPath));
    calls.push({ method, path: pathNorm, file: path.basename(filePath) });
  }
  return calls;
}

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith('--only='));
const allowlistPath = args.find((a) => a.startsWith('--allowlist='))?.split('=')[1];
const onlyFiles = onlyArg
  ? onlyArg
      .split('=')[1]
      .split(',')
      .map((f) => (f.endsWith('.service.ts') ? f : `${f}.service.ts`))
  : null;

function loadAllowlist() {
  if (!allowlistPath) return new Set();
  const file = path.resolve(root, allowlistPath);
  if (!fs.existsSync(file)) return new Set();
  return new Set(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !l.startsWith('#')),
  );
}

function main() {
  if (!fs.existsSync(specPath)) {
    console.error(`OpenAPI spec not found: ${specPath}`);
    process.exit(1);
  }

  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const openApiIndex = loadOpenApiIndex(spec);

  const allowlist = loadAllowlist();

  const serviceFiles = fs
    .readdirSync(servicesDir)
    .filter((f) => f.endsWith('.service.ts') && f !== 'base.service.ts')
    .filter((f) => (onlyFiles ? onlyFiles.includes(f) : true));

  const missing = [];

  for (const file of serviceFiles) {
    const calls = extractServiceCalls(path.join(servicesDir, file));
    for (const call of calls) {
      const key = `${call.method} ${call.path}`;
      if (openApiIndex.has(key)) continue;
      const allowKey = `${call.file}: ${key}`;
      if (allowlist.has(key) || allowlist.has(allowKey)) continue;
      missing.push({ ...call, key, allowKey });
    }
  }

  if (missing.length === 0) {
    console.log(
      `OK: ${serviceFiles.length} hand-written service file(s) match OpenAPI paths` +
        (allowlist.size ? ` (${allowlist.size} allowlisted)` : '') +
        '.',
    );
    return;
  }

  console.error(`API client drift: ${missing.length} hand-written path(s) not in OpenAPI:\n`);
  for (const m of missing) {
    console.error(`  ${m.allowKey}`);
  }
  console.error('\nUpdate the service or refresh swagger-docs/openapi-gateway.json.');
  process.exit(1);
}

main();
