# Admin application (`apps/admin`)

**Operator console** for the studio owner: manage users, pipeline (requests → quotes → projects), payments, content (blog/portfolio), system health, webhooks, and configuration.

## At a glance

|              |                                                                 |
| ------------ | --------------------------------------------------------------- |
| **Package**  | `@nestlancer/admin`                                             |
| **Dev port** | 9010                                                            |
| **Auth**     | `ADMIN` role required                                           |
| **UI**       | Gentelella / TailAdmin-derived layout (shared `@nestlancer/ui`) |

## Capabilities

- **Users** — search, detail, bulk ops, impersonation (proxied via gateway), password reset
- **Pipeline** — requests, quotes, projects hub with filters and drill-down
- **Payments** — transactions, refunds, disputes, reconciliation views
- **Content** — blog posts, moderation, portfolio, media quarantine
- **System** — health/debug, feature flags, email templates, audit logs, webhooks

## Routes

- `/`
- `/(auth)/login`
- `/(dashboard)/analytics`
- `/(dashboard)/api-keys`
- `/(dashboard)/audit`
- `/(dashboard)/contact`
- `/(dashboard)/content`
- `/(dashboard)/content/posts/[id]/edit`
- `/(dashboard)/content/posts/new`
- `/(dashboard)/dashboard`
- `/(dashboard)/integrations`
- `/(dashboard)/media`
- `/(dashboard)/media/analytics`
- `/(dashboard)/media/browse`
- `/(dashboard)/media/folders`
- `/(dashboard)/media/quarantine`
- `/(dashboard)/media/settings`
- `/(dashboard)/media/storage`
- `/(dashboard)/messages`
- `/(dashboard)/messages/archived`
- `/(dashboard)/messages/inbox`
- `/(dashboard)/messages/new`
- `/(dashboard)/messages/new-direct`
- `/(dashboard)/messages/new-group`
- `/(dashboard)/messages/new/direct`
- `/(dashboard)/messages/project/[projectId]`
- `/(dashboard)/messages/thread/[threadId]`
- `/(dashboard)/messages/threads`
- `/(dashboard)/moderation`
- `/(dashboard)/notifications`
- `/(dashboard)/payments`
- `/(dashboard)/payments/[id]`
- `/(dashboard)/payments/accounts`
- `/(dashboard)/payments/by-project`
- `/(dashboard)/payments/company-legal`
- `/(dashboard)/payments/disputes`
- `/(dashboard)/payments/projects/[id]`
- `/(dashboard)/pipeline`
- `/(dashboard)/pipeline/projects`
- `/(dashboard)/pipeline/projects/[id]`
- `/(dashboard)/pipeline/users`
- `/(dashboard)/pipeline/users/[id]`
- `/(dashboard)/portfolio`
- `/(dashboard)/portfolio/[id]/edit`
- `/(dashboard)/portfolio/new`
- `/(dashboard)/profile`
- `/(dashboard)/projects`
- `/(dashboard)/projects/[id]`
- `/(dashboard)/projects/archive`
- `/(dashboard)/projects/completed`
- `/(dashboard)/projects/new`
- `/(dashboard)/projects/stats`
- `/(dashboard)/quotes`
- `/(dashboard)/quotes/[id]`
- `/(dashboard)/quotes/drafts`
- `/(dashboard)/quotes/new`
- `/(dashboard)/quotes/payment-schedules`
- `/(dashboard)/quotes/stats`
- `/(dashboard)/requests`
- `/(dashboard)/requests/[id]`
- `/(dashboard)/requests/[id]/quote/edit`
- `/(dashboard)/requests/[id]/quote/new`
- `/(dashboard)/requests/capacity`
- `/(dashboard)/system`
- `/(dashboard)/system/announcements`
- `/(dashboard)/system/cache`
- `/(dashboard)/system/email-templates`
- `/(dashboard)/system/features`
- `/(dashboard)/system/health`
- `/(dashboard)/system/jobs`
- `/(dashboard)/system/logs`
- `/(dashboard)/system/maintenance`
- `/(dashboard)/system/notification-templates`
- `/(dashboard)/system/staff`
- `/(dashboard)/users`
- `/(dashboard)/users/[id]`
- `/(dashboard)/users/search`

## Feature modules

- `analytics/`
- `audit/`
- `auth/`
- `contact/`
- `content/`
- `dashboard/`
- `documents/`
- `exports/`
- `integrations/`
- `media/`
- `messages/`
- `moderation/`
- `notifications/`
- `payments/`
- `pipeline/`
- `portfolio/`
- `profile/`
- `projects/`
- `quotes/`
- `requests/`
- `system/`
- `users/`

## Data flow

Same as web: `@nestlancer/api-client` → gateway `/api/v1/admin/*` and proxied user routes. Contract verification tests live under `tests/e2e/`.

## Commands

```bash
pnpm --filter @nestlancer/admin dev
pnpm --filter @nestlancer/admin test:e2e
```

## Related documentation

- [Wireframes — admin](../../architecture/diagrams/wireframes/admin/)
- [Backend admin service](../../../nestlancer-backend-api/docs/components/services/admin.md)
- [CHANGELOG](../../changelog/CHANGELOG.md)
