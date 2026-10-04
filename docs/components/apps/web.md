# Web application (`apps/web`)

The **client portal** for Nestlancer studio customers: sign up, submit project requests, review quotes, pay via Razorpay, track milestones, message the studio, and manage account settings. Built with **Next.js 14 App Router**, **Tailwind**, and **TanStack Query**.

## At a glance

|                 |                                                                    |
| --------------- | ------------------------------------------------------------------ |
| **Package**     | `@nestlancer/web`                                                  |
| **Dev port**    | 9000                                                               |
| **Typical URL** | `https://dev-web.nestlancer.com` or `http://localhost:9000`        |
| **Auth**        | Cookie + JWT via gateway; middleware protects `(dashboard)` routes |
| **API**         | `NEXT_PUBLIC_API_URL` + `/api/v1/*` (optional same-origin proxy)   |

## User journeys (what this app implements)

1. **Discover** — Homepage, portfolio, blog, contact, legal pages (public, SEO-friendly).
2. **Onboard** — Register → email verification → optional 2FA challenge on login.
3. **Request work** — Create service request, attach files, track status until quote arrives.
4. **Commercial** — Review quote, accept → project created; pay milestones via Razorpay (INR/paise).
5. **Delivery** — Project hub: progress, deliverables, milestones, files, messages, payments tabs.
6. **Account** — Profile, security (password, 2FA), notifications, media library, payment methods.

Studio model: users are **clients** of a single operator; there is no multi-freelancer marketplace in the UI.

## Route map (App Router)

| Route group                   | Path                                      | Purpose |
| ----------------------------- | ----------------------------------------- | ------- |
| `/forgot-password`            | `/(auth)/forgot-password`                 | Page    |
| `/login`                      | `/(auth)/login`                           | Page    |
| `/register`                   | `/(auth)/register`                        | Page    |
| `/reset-password`             | `/(auth)/reset-password`                  | Page    |
| `/verify-email`               | `/(auth)/verify-email`                    | Page    |
| `/dashboard`                  | `/(dashboard)/dashboard`                  | Page    |
| `/invoices`                   | `/(dashboard)/invoices`                   | Page    |
| `/invoices/[id]`              | `/(dashboard)/invoices/[id]`              | Page    |
| `/messages`                   | `/(dashboard)/messages`                   | Page    |
| `/messages/[conversationId]`  | `/(dashboard)/messages/[conversationId]`  | Page    |
| `/messages/archived`          | `/(dashboard)/messages/archived`          | Page    |
| `/messages/inbox`             | `/(dashboard)/messages/inbox`             | Page    |
| `/messages/new`               | `/(dashboard)/messages/new`               | Page    |
| `/messages/new/direct`        | `/(dashboard)/messages/new/direct`        | Page    |
| `/messages/thread/[threadId]` | `/(dashboard)/messages/thread/[threadId]` | Page    |
| `/messages/threads`           | `/(dashboard)/messages/threads`           | Page    |
| `/notifications`              | `/(dashboard)/notifications`              | Page    |
| `/payments`                   | `/(dashboard)/payments`                   | Page    |
| `/payments/[id]`              | `/(dashboard)/payments/[id]`              | Page    |
| `/payments/invoice/[id]`      | `/(dashboard)/payments/invoice/[id]`      | Page    |
| `/payments/invoices`          | `/(dashboard)/payments/invoices`          | Page    |
| `/payments/methods`           | `/(dashboard)/payments/methods`           | Page    |
| `/profile`                    | `/(dashboard)/profile`                    | Page    |
| `/profile/edit`               | `/(dashboard)/profile/edit`               | Page    |
| `/projects`                   | `/(dashboard)/projects`                   | Page    |
| `/projects/[id]`              | `/(dashboard)/projects/[id]`              | Page    |
| `/projects/archive`           | `/(dashboard)/projects/archive`           | Page    |
| `/projects/completed`         | `/(dashboard)/projects/completed`         | Page    |
| `/projects/new`               | `/(dashboard)/projects/new`               | Page    |
| `/quotes`                     | `/(dashboard)/quotes`                     | Page    |
| `/quotes/[id]`                | `/(dashboard)/quotes/[id]`                | Page    |
| `/quotes/drafts`              | `/(dashboard)/quotes/drafts`              | Page    |
| `/quotes/new`                 | `/(dashboard)/quotes/new`                 | Page    |
| `/quotes/templates`           | `/(dashboard)/quotes/templates`           | Page    |
| `/requests`                   | `/(dashboard)/requests`                   | Page    |
| `/requests/[id]`              | `/(dashboard)/requests/[id]`              | Page    |
| `/requests/archive`           | `/(dashboard)/requests/archive`           | Page    |
| `/requests/new`               | `/(dashboard)/requests/new`               | Page    |
| `/settings`                   | `/(dashboard)/settings`                   | Page    |
| `/settings/account`           | `/(dashboard)/settings/account`           | Page    |
| `/settings/activity`          | `/(dashboard)/settings/activity`          | Page    |
| `/settings/billing`           | `/(dashboard)/settings/billing`           | Page    |
| `/settings/files`             | `/(dashboard)/settings/files`             | Page    |
| `/settings/notifications`     | `/(dashboard)/settings/notifications`     | Page    |
| `/settings/security`          | `/(dashboard)/settings/security`          | Page    |
| `/settings/sessions`          | `/(dashboard)/settings/sessions`          | Page    |
| `/`                           | `/(public)`                               | Page    |
| `/about`                      | `/(public)/about`                         | Page    |
| `/blog`                       | `/(public)/blog`                          | Page    |
| `/blog/[slug]`                | `/(public)/blog/[slug]`                   | Page    |
| `/blog/bookmarks`             | `/(public)/blog/bookmarks`                | Page    |
| `/blog/category/[slug]`       | `/(public)/blog/category/[slug]`          | Page    |
| `/blog/tag/[slug]`            | `/(public)/blog/tag/[slug]`               | Page    |
| `/contact`                    | `/(public)/contact`                       | Page    |
| `/portfolio`                  | `/(public)/portfolio`                     | Page    |
| `/portfolio/[id]`             | `/(public)/portfolio/[id]`                | Page    |
| `/privacy`                    | `/(public)/privacy`                       | Page    |
| `/terms`                      | `/(public)/terms`                         | Page    |
| `/verify`                     | `/(public)/verify`                        | Page    |
| `/verify-document`            | `/(public)/verify-document`               | Page    |
| `/work`                       | `/(public)/work`                          | Page    |
| `/impersonate`                | `/impersonate`                            | Page    |
| `/share/[token]`              | `/share/[token]`                          | Page    |

Route groups: `(auth)` unauthenticated shell, `(dashboard)` sidebar layout, `(public)` marketing/content.

## Feature modules (`src/features/`)

Each feature owns UI components, hooks, and API glue:

- **`admin/`** — see `apps/web/src/features/admin/`
- **`auth/`** — see `apps/web/src/features/auth/`
- **`blog/`** — see `apps/web/src/features/blog/`
- **`contact/`** — see `apps/web/src/features/contact/`
- **`documents/`** — see `apps/web/src/features/documents/`
- **`invoices/`** — see `apps/web/src/features/invoices/`
- **`marketing/`** — see `apps/web/src/features/marketing/`
- **`media/`** — see `apps/web/src/features/media/`
- **`messaging/`** — see `apps/web/src/features/messaging/`
- **`notifications/`** — see `apps/web/src/features/notifications/`
- **`payments/`** — see `apps/web/src/features/payments/`
- **`portfolio/`** — see `apps/web/src/features/portfolio/`
- **`profile/`** — see `apps/web/src/features/profile/`
- **`progress/`** — see `apps/web/src/features/progress/`
- **`projects/`** — see `apps/web/src/features/projects/`
- **`quotes/`** — see `apps/web/src/features/quotes/`
- **`requests/`** — see `apps/web/src/features/requests/`
- **`settings/`** — see `apps/web/src/features/settings/`
- **`work/`** — see `apps/web/src/features/work/`

Pattern per feature: `components/`, `hooks/`, optional `api/`, `index.ts` barrel export.

## Data & state

| Layer        | Technology                                       | Usage                                             |
| ------------ | ------------------------------------------------ | ------------------------------------------------- |
| Server data  | TanStack Query                                   | Lists, details, mutations with cache invalidation |
| Forms        | React Hook Form + `@nestlancer/validators` (Zod) | Login, requests, payments, settings               |
| HTTP         | `@nestlancer/api-client`                         | Axios + generated/handed services                 |
| Realtime     | `@nestlancer/websocket`                          | Messages, notifications                           |
| Ephemeral UI | Local state / URL                                | Modals, tabs, filters                             |

Server Components are used where data can be fetched on the server (public blog/portfolio); dashboard pages are mostly client components with Query.

## Key integrations

- **Razorpay Checkout** — `features/payments/` (UPI, cards; test mode documented in [razorpay guide](../../guides/razorpay-test-payments.md))
- **Web Push** — notification preferences; see [web-push-testing](../../guides/web-push-testing.md)
- **Media** — chunked upload + presigned URLs via media API
- **Share links** — `/share/[token]` for time-limited media shares

## Environment variables

| Variable                     | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`        | Browser-visible API origin                             |
| `NEXT_PUBLIC_API_PROXY`      | When `true`, call same-origin `/api/v1` (Next rewrite) |
| `API_UPSTREAM`               | Gateway URL for rewrites (server-only)                 |
| `NEXT_PUBLIC_WS_URL`         | Socket.IO origin                                       |
| `NEXT_PUBLIC_SOCKET_IO_PATH` | Default `/ws/socket.io`                                |

Details: root `.env.development` and [backend env guide](../../../../nestlancer-backend-api/docs/reference/environment-variables.md).

## Commands

```bash
pnpm --filter @nestlancer/web dev
pnpm --filter @nestlancer/web build
pnpm --filter @nestlancer/web test        # Vitest unit
pnpm --filter @nestlancer/web test:e2e    # Playwright
```

Docker: `pnpm docker:start` (web on 9000) — [nginx guide](../../guides/nginx.md).

## Testing

| Type | Location                         |
| ---- | -------------------------------- |
| Unit | Colocated `*.test.ts(x)`, Vitest |
| E2E  | `apps/web/tests/e2e/`            |

## Related documentation

- [Frontend architecture](../../architecture/overview.md) — full ADRs, patterns, security
- [Directory structure](../../architecture/dir-structure.md)
- [Wireframes — user & public](../../architecture/diagrams/wireframes/)
- [API client](../packages/api-client.md)
- [CHANGELOG](../../changelog/CHANGELOG.md)
