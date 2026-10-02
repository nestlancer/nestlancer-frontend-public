#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs/components');

function listPages(appDir) {
  const app = path.join(root, 'apps', appDir, 'src/app');
  if (!fs.existsSync(app)) return [];
  const pages = [];
  function walk(dir, prefix = '') {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, `${prefix}/${e.name}`);
      else if (e.name === 'page.tsx') pages.push(prefix || '/');
    }
  }
  walk(app);
  return pages.sort();
}

function listFeatures(appDir) {
  const feat = path.join(root, 'apps', appDir, 'src/features');
  if (!fs.existsSync(feat)) return [];
  return fs.readdirSync(feat, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
}

function readPkg(name) {
  const p = path.join(root, 'packages', name, 'package.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const webPages = listPages('web');
const adminPages = listPages('admin');
const landingPages = listPages('landing');
const webFeatures = listFeatures('web');

const webDoc = `# Web application (\`apps/web\`)

The **client portal** for Nestlancer studio customers: sign up, submit project requests, review quotes, pay via Razorpay, track milestones, message the studio, and manage account settings. Built with **Next.js 14 App Router**, **Tailwind**, and **TanStack Query**.

## At a glance

| | |
| --- | --- |
| **Package** | \`@nestlancer/web\` |
| **Dev port** | 9000 |
| **Typical URL** | \`https://dev-web.nestlancer.com\` or \`http://localhost:9000\` |
| **Auth** | Cookie + JWT via gateway; middleware protects \`(dashboard)\` routes |
| **API** | \`NEXT_PUBLIC_API_URL\` + \`/api/v1/*\` (optional same-origin proxy) |

## User journeys (what this app implements)

1. **Discover** — Homepage, portfolio, blog, contact, legal pages (public, SEO-friendly).
2. **Onboard** — Register → email verification → optional 2FA challenge on login.
3. **Request work** — Create service request, attach files, track status until quote arrives.
4. **Commercial** — Review quote, accept → project created; pay milestones via Razorpay (INR/paise).
5. **Delivery** — Project hub: progress, deliverables, milestones, files, messages, payments tabs.
6. **Account** — Profile, security (password, 2FA), notifications, media library, payment methods.

Studio model: users are **clients** of a single operator; there is no multi-freelancer marketplace in the UI.

## Route map (App Router)

| Route group | Path | Purpose |
| ----------- | ---- | ------- |
${webPages.map((p) => `| \`${p.includes('(') ? p.split('/').filter((x) => !x.startsWith('(')).join('/') || '/' : p}\` | \`${p}\` | Page |`).join('\n')}

Route groups: \`(auth)\` unauthenticated shell, \`(dashboard)\` sidebar layout, \`(public)\` marketing/content.

## Feature modules (\`src/features/\`)

Each feature owns UI components, hooks, and API glue:

${webFeatures.map((f) => `- **\`${f}/\`** — see \`apps/web/src/features/${f}/\``).join('\n')}

Pattern per feature: \`components/\`, \`hooks/\`, optional \`api/\`, \`index.ts\` barrel export.

## Data & state

| Layer | Technology | Usage |
| ----- | ---------- | ----- |
| Server data | TanStack Query | Lists, details, mutations with cache invalidation |
| Forms | React Hook Form + \`@nestlancer/validators\` (Zod) | Login, requests, payments, settings |
| HTTP | \`@nestlancer/api-client\` | Axios + generated/handed services |
| Realtime | \`@nestlancer/websocket\` | Messages, notifications |
| Ephemeral UI | Local state / URL | Modals, tabs, filters |

Server Components are used where data can be fetched on the server (public blog/portfolio); dashboard pages are mostly client components with Query.

## Key integrations

- **Razorpay Checkout** — \`features/payments/\` (UPI, cards; test mode documented in [razorpay guide](../../guides/razorpay-test-payments.md))
- **Web Push** — notification preferences; see [web-push-testing](../../guides/web-push-testing.md)
- **Media** — chunked upload + presigned URLs via media API
- **Share links** — \`/share/[token]\` for time-limited media shares

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| \`NEXT_PUBLIC_API_URL\` | Browser-visible API origin |
| \`NEXT_PUBLIC_API_PROXY\` | When \`true\`, call same-origin \`/api/v1\` (Next rewrite) |
| \`API_UPSTREAM\` | Gateway URL for rewrites (server-only) |
| \`NEXT_PUBLIC_WS_URL\` | Socket.IO origin |
| \`NEXT_PUBLIC_SOCKET_IO_PATH\` | Default \`/ws/socket.io\` |

Details: root \`.env.development\` and [backend env guide](../../../nestlancer-backend-api/docs/guides/environment-variables.md).

## Commands

\`\`\`bash
pnpm --filter @nestlancer/web dev
pnpm --filter @nestlancer/web build
pnpm --filter @nestlancer/web test        # Vitest unit
pnpm --filter @nestlancer/web test:e2e    # Playwright
\`\`\`

Docker: \`pnpm docker:start\` (web on 9000) — [nginx guide](../../guides/nginx.md).

## Testing

| Type | Location |
| ---- | -------- |
| Unit | Colocated \`*.test.ts(x)\`, Vitest |
| E2E | \`apps/web/tests/e2e/\` |

## Related documentation

- [Frontend architecture](../../architecture/ARCHITECTURE.md) — full ADRs, patterns, security
- [Directory structure](../../architecture/dir-structure.md)
- [Wireframes — user & public](../../architecture/diagrams/wireframes/)
- [API client](../packages/api-client.md)
- [CHANGELOG](../../changelog/CHANGELOG.md)
`;

fs.mkdirSync(path.join(docs, 'apps'), { recursive: true });
fs.writeFileSync(path.join(docs, 'apps/web.md'), webDoc);

const adminFeatures = listFeatures('admin');
const adminDoc = `# Admin application (\`apps/admin\`)

**Operator console** for the studio owner: manage users, pipeline (requests → quotes → projects), payments, content (blog/portfolio), system health, webhooks, and configuration.

## At a glance

| | |
| --- | --- |
| **Package** | \`@nestlancer/admin\` |
| **Dev port** | 9010 |
| **Auth** | \`ADMIN\` role required |
| **UI** | Gentelella / TailAdmin-derived layout (shared \`@nestlancer/ui\`) |

## Capabilities

- **Users** — search, detail, bulk ops, impersonation (proxied via gateway), password reset
- **Pipeline** — requests, quotes, projects hub with filters and drill-down
- **Payments** — transactions, refunds, disputes, reconciliation views
- **Content** — blog posts, moderation, portfolio, media quarantine
- **System** — health/debug, feature flags, email templates, audit logs, webhooks

## Routes

${adminPages.map((p) => `- \`${p}\``).join('\n')}

## Feature modules

${adminFeatures.map((f) => `- \`${f}/\``).join('\n')}

## Data flow

Same as web: \`@nestlancer/api-client\` → gateway \`/api/v1/admin/*\` and proxied user routes. Contract verification tests live under \`tests/e2e/\`.

## Commands

\`\`\`bash
pnpm --filter @nestlancer/admin dev
pnpm --filter @nestlancer/admin test:e2e
\`\`\`

## Related documentation

- [Wireframes — admin](../../architecture/diagrams/wireframes/admin/)
- [Backend admin service](../../../nestlancer-backend-api/docs/components/services/admin.md)
- [CHANGELOG](../../changelog/CHANGELOG.md)
`;

fs.writeFileSync(path.join(docs, 'apps/admin.md'), adminDoc);

const landingDoc = `# Landing application (\`apps/landing\`)

Marketing site: positioning, pricing, about, contact, and lightweight blog teasers. Mostly **static/SSG** pages with minimal authenticated surface.

## At a glance

| | |
| --- | --- |
| **Package** | \`@nestlancer/landing\` |
| **Dev port** | 9020 |
| **Shared UI** | \`@nestlancer/marketing\` sections |

## Routes

${landingPages.map((p) => `- \`${p}\``).join('\n')}

## Commands

\`\`\`bash
pnpm --filter @nestlancer/landing dev
\`\`\`

Not in default \`docker-compose.dev.yml\`; expose port 9020 for Nginx — [nginx guide](../../guides/nginx.md).

## Related documentation

- [Wireframes — public](../../architecture/diagrams/wireframes/public/)
`;

fs.writeFileSync(path.join(docs, 'apps/landing.md'), landingDoc);

const PACKAGES = {
  'api-client': {
    title: '@nestlancer/api-client',
    summary: 'Typed HTTP access to the gateway OpenAPI contract.',
    sections: `## Architecture

\`\`\`
swagger-docs/openapi-gateway.json
        → Orval (orval.config.ts)
        → src/generated/     # Axios functions (all tags)
        → src/generated/react-query/  # Hooks (blog pilot)
        → src/services/      # Hand-written facades for other domains
        → src/interceptors/  # auth, errors, retry
\`\`\`

## Regenerating the client

\`\`\`bash
pnpm pull:openapi    # GET https://dev.nestlancer.com/docs-all-json
pnpm codegen
pnpm contract:check  # pre-push: drift + Spectral
\`\`\`

**Never hand-edit** \`src/generated/**\`.

## Response envelope

Gateway returns \`{ status, message, data, metadata }\`. Interceptors unwrap \`data\` for callers.

## Consumers

- \`apps/web\`, \`apps/admin\` feature hooks
- Prefer feature-level hooks over calling generated functions directly in pages`,
  },
  ui: {
    title: '@nestlancer/ui',
    summary: 'Design system: primitives, forms, feedback, navigation, tables.',
    sections: `## Categories

| Folder | Examples |
| ------ | -------- |
| \`primitives/\` | Button, Input, Select, Badge, Avatar |
| \`forms/\` | FormField, FileUpload |
| \`feedback/\` | Alert, Toast, Modal, Skeleton |
| \`navigation/\` | Sidebar, Navbar, Tabs, Breadcrumb |
| \`data-display/\` | DataTable, Card, EmptyState |

## Conventions

- Tailwind utility classes + \`cn()\` from \`src/utils/cn.ts\`
- Accessible focus rings and ARIA on interactive primitives
- No domain imports (no \`@nestlancer/api-client\` inside ui)

## Theming

Consume CSS variables from \`@nestlancer/tokens\` / \`@nestlancer/theme\`.`,
  },
  auth: {
    title: '@nestlancer/auth',
    summary: 'Session provider, token refresh, and route protection helpers.',
    sections: `## Exports

- \`AuthProvider\` — wraps apps; hydrates user from \`/api/v1/users/me\` or cookie session
- \`useAuth()\` — current user, login/logout
- Middleware helpers for Next.js edge

## Security

- Prefers **HttpOnly** cookies set by gateway on login
- Does not store access tokens in \`localStorage\`
- Coordinates refresh via \`/api/v1/auth/refresh\`

## Used in

\`apps/web\`, \`apps/admin\` — see \`features/auth/\` for forms.`,
  },
  websocket: {
    title: '@nestlancer/websocket',
    summary: 'Socket.IO client with auth and room subscriptions.',
    sections: `## Connection

\`\`\`typescript
// Typical env
NEXT_PUBLIC_WS_URL=https://dev.nestlancer.com
NEXT_PUBLIC_SOCKET_IO_PATH=/ws/socket.io
\`\`\`

## Hooks

| Hook | Purpose |
| ---- | ------- |
| \`useWebSocket\` | Connection lifecycle |
| \`useSocketRoom\` | Join conversation/project rooms |
| \`usePresence\` | Online indicators |

Event names align with [backend WebSocket protocol](../../../nestlancer-backend-api/docs/architecture/websocket-protocol.md).`,
  },
  types: {
    title: '@nestlancer/types',
    summary: 'Shared TS types not covered by OpenAPI codegen.',
    sections: `Use for UI-only types, socket payloads, and cross-package helpers. Prefer \`api-client\` generated types for REST bodies.`,
  },
  validators: {
    title: '@nestlancer/validators',
    summary: 'Zod schemas shared across apps.',
    sections: `Schemas: auth, project, request, payment, profile. Pair with React Hook Form \`zodResolver\`.`,
  },
  utils: {
    title: '@nestlancer/utils',
    summary: 'Formatting and pure helpers.',
    sections: `INR/paise display, dates (ISO UTC), slugify, file sizes. Safe for RSC.`,
  },
  config: {
    title: '@nestlancer/config',
    summary: 'Validated environment and feature flags.',
    sections: `Zod-parsed \`env.ts\` — fail fast at build if \`NEXT_PUBLIC_*\` missing.`,
  },
  constants: {
    title: '@nestlancer/constants',
    summary: 'Routes, query keys, socket event constants.',
    sections: `Telemetry event names: [constants-telemetry.md](constants-telemetry.md).`,
  },
  hooks: { skipGenerate: true },
  utils: { skipGenerate: true },
  validators: { skipGenerate: true },
  config: { skipGenerate: true },
  constants: { skipGenerate: true },
  ui: { skipGenerate: true },
  theme: { title: '@nestlancer/theme', summary: 'ThemeProvider and dark mode.', sections: `Integrates with \`next-themes\` pattern; used across web and admin.` },
  tokens: { title: '@nestlancer/tokens', summary: 'CSS design tokens.', sections: `Colors, spacing, typography exported for Tailwind presets.` },
  motion: { title: '@nestlancer/motion', summary: 'Framer Motion wrappers.', sections: `Marketing animations; client-only.` },
  marketing: { title: '@nestlancer/marketing', summary: 'Landing page sections.', sections: `Hero, features grid — consumed by \`apps/landing\` and homepage.` },
  'field-help': { title: '@nestlancer/field-help', summary: 'Contextual form tooltips.', sections: `Radix tooltip + help copy for complex admin/web forms.` },
};

fs.mkdirSync(path.join(docs, 'packages'), { recursive: true });
for (const [name, meta] of Object.entries(PACKAGES)) {
  if (meta.skipGenerate) continue;
  const pkg = readPkg(name);
  const deps = pkg
    ? Object.keys(pkg.dependencies || {}).filter((d) => d.startsWith('@nestlancer/'))
    : [];
  const body = `# ${meta.title}

${meta.summary}

## Package info

| | |
| --- | --- |
| **Path** | \`packages/${name}/\` |
| **Import** | \`import { … } from '${meta.title}';\` |

## Workspace dependencies

${deps.length ? deps.map((d) => `- \`${d}\``).join('\n') : '_None_'}

${meta.sections}

## Related documentation

- [Frontend architecture](../../architecture/ARCHITECTURE.md)
- [CHANGELOG](../../changelog/CHANGELOG.md)
`;
  fs.writeFileSync(path.join(docs, 'packages', `${name}.md`), body);
}

console.log('Generated expanded frontend component docs.');
