#!/usr/bin/env node
/**
 * Generates docker-compose.prod.yml from workloads.manifest.json.
 * Run: node scripts/docker/generate-prod-compose.mjs
 *
 * Every service gets hard mem/CPU ceilings so a 6c/12GB VPS cannot
 * thrash SSH if the Compose path is used.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(
  readFileSync(join(root, 'scripts/docker/workloads.manifest.json'), 'utf8')
);

/** Sized for next start SSR on an 8c/24GB VPS (was too tight at 0.35–0.50 / 384–512MB). */
const RESOURCE_CLASSES = {
  web: {
    mem: '1024m',
    cpus: '1.0',
    reserveMem: '256M',
    reserveCpu: '0.25',
    nodeHeap: 768,
  },
  admin: {
    mem: '768m',
    cpus: '0.75',
    reserveMem: '192M',
    reserveCpu: '0.15',
    nodeHeap: 512,
  },
  landing: {
    mem: '1024m',
    cpus: '1.0',
    reserveMem: '256M',
    reserveCpu: '0.25',
    nodeHeap: 768,
  },
};

function resourceClassFor(composeService) {
  return RESOURCE_CLASSES[composeService] || RESOURCE_CLASSES.landing;
}

function resourceLines(cls, indent = '    ') {
  const memUpper = cls.mem.replace('m', 'M');
  return [
    `${indent}mem_limit: ${cls.mem}`,
    `${indent}memswap_limit: ${cls.mem}`,
    `${indent}cpus: ${cls.cpus}`,
    `${indent}deploy:`,
    `${indent}  resources:`,
    `${indent}    limits:`,
    `${indent}      cpus: '${cls.cpus}'`,
    `${indent}      memory: ${memUpper}`,
    `${indent}    reservations:`,
    `${indent}      cpus: '${cls.reserveCpu}'`,
    `${indent}      memory: ${cls.reserveMem}`,
  ].join('\n');
}

function imageRef(id) {
  return `\${NESTLANCER_IMAGE_REGISTRY:-${manifest.imageRegistry}}/${id}:\${NESTLANCER_IMAGE_TAG:-latest}`;
}

// Host-port offset so prod (9100/9110/9120) never clashes with dev (9000/9010/9020).
const FRONTEND_PORT_OFFSET = 100;

function prodServiceBlock(app) {
  const cls = resourceClassFor(app.composeService);
  const hostPort = app.port + FRONTEND_PORT_OFFSET;
  const runtimeEnv = manifest.runtimeEnv?.[app.composeService] ?? {};
  const runtimeEnvLines = Object.entries(runtimeEnv)
    .map(([key, value]) => `      ${key}: ${JSON.stringify(value)}`)
    .join('\n');
  const runtimeEnvBlock = runtimeEnvLines
    ? `\n    environment:\n      NODE_ENV: production\n      PORT: "${app.port}"\n      NODE_OPTIONS: '--max-old-space-size=${cls.nodeHeap}'\n${runtimeEnvLines}`
    : `\n    environment:\n      NODE_ENV: production\n      PORT: "${app.port}"\n      NODE_OPTIONS: '--max-old-space-size=${cls.nodeHeap}'`;
  return `  ${app.composeService}:
    image: ${imageRef(app.id)}
    container_name: nl-prod-${app.id}
    env_file:
      - .env.infisical${runtimeEnvBlock}
    ports:
      - '${hostPort}:${app.port}'
    networks:
      - nestlancer-frontend-prod
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: '10m'
        max-file: '3'
${resourceLines(cls)}
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:${app.port}/']
      interval: 30s
      timeout: 10s
      start_period: 60s
      retries: 5`;
}

const header = `# AUTO-GENERATED — edit scripts/docker/workloads.manifest.json then:
#   node scripts/docker/generate-prod-compose.mjs
#
# Production stack: pre-built GHCR images. Secrets via Infisical → .env.infisical
#   bash scripts/docker/compose-prod.sh up -d
#
# Hard mem/CPU limits on every service (tuned for 8c/24GB VPS; was under-provisioned).
#
# Local build (no registry): pnpm docker:prod:build && pnpm docker:prod:up
# Local build with Dockerfile context: pnpm docker:prod:local:start

networks:
  nestlancer-frontend-prod:
    name: nestlancer-frontend-prod
    driver: bridge

services:
`;

const blocks = manifest.apps.map((a) => prodServiceBlock(a)).join('\n\n');
const out = header + blocks + '\n';
writeFileSync(join(root, 'docker-compose.prod.yml'), out);
console.log('Wrote docker-compose.prod.yml');
