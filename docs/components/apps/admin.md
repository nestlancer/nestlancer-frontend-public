<div align="center">

# Admin application (`apps/admin`)

### **Operator console** for the studio owner: manage users, pipeline (requests → quotes → projects), payments, content (blog/portfolio), system health, webhooks, and configuration.

</div>

---

## 📖 Table of Contents

- [👁 At a glance](#at-a-glance)
- [Capabilities](#capabilities)
- [Routes](#routes)
- [Feature modules](#feature-modules)
- [Data flow](#data-flow)
- [Commands](#commands)
- [📚 Related documentation](#related-documentation)

---

## 👁 At a glance

|              |                                                                 |
| :----------- | :-------------------------------------------------------------- |
| **Package**  | `@nestlancer/admin`                                             |
| **Dev port** | 9010                                                            |
| **Auth**     | `ADMIN` role required                                           |
| **UI**       | Gentelella / TailAdmin-derived layout (shared `@nestlancer/ui`) |

---

## Capabilities

- **Users** — search, detail, bulk ops, impersonation (proxied via gateway), password reset
- **Pipeline** — requests, quotes, projects hub with filters and drill-down
- **Payments** — transactions, refunds, disputes, reconciliation views
- **Content** — blog posts, moderation, portfolio, media quarantine
- **System** — health/debug, feature flags, email templates, audit logs, webhooks

---

## Routes

- `/`
- `/(auth)/login`
- `/(dashboard)/analytics`
- `/(dashboard)/audit`
- `/(dashboard)/contact`
- `/(dashboard)/content`
- `/(dashboard)/content/posts/[id]/edit`
- `/(dashboard)/content/posts/new`
- `/(dashboard)/dashboard`
- `/(dashboard)/integrations`
- `/(dashboard)/media`
- `/(dashboard)/messages`
- `/(dashboard)/messages/new-group`
- `/(dashboard)/messages/project/[projectId]`
- `/(dashboard)/messages/thread/[threadId]`
- `/(dashboard)/moderation`
- `/(dashboard)/payments`
- `/(dashboard)/pipeline`
- `/(dashboard)/pipeline/projects`
- `/(dashboard)/pipeline/projects/[id]`
- `/(dashboard)/pipeline/users`
- `/(dashboard)/pipeline/users/[id]`
- `/(dashboard)/portfolio`
- `/(dashboard)/portfolio/[id]/edit`
- `/(dashboard)/portfolio/new`
- `/(dashboard)/projects`
- `/(dashboard)/projects/[id]`
- `/(dashboard)/quotes`
- `/(dashboard)/quotes/[id]`
- `/(dashboard)/requests`
- `/(dashboard)/requests/[id]`
- `/(dashboard)/system`
- `/(dashboard)/users`
- `/(dashboard)/users/[id]`

---

## Feature modules

- `analytics/`
- `audit/`
- `auth/`
- `contact/`
- `content/`
- `dashboard/`
- `integrations/`
- `media/`
- `messages/`
- `moderation/`
- `payments/`
- `pipeline/`
- `portfolio/`
- `projects/`
- `quotes/`
- `requests/`
- `system/`
- `users/`

---

## Data flow

Same as web: `@nestlancer/api-client` → gateway `/api/v1/admin/*` and proxied user routes. Contract verification tests live under `tests/e2e/`.

---

## Commands

```bash
pnpm --filter @nestlancer/admin dev
pnpm --filter @nestlancer/admin test:e2e
```

---

## 📚 Related documentation

- [Wireframes — admin](../../architecture/diagrams/wireframes/admin/)
- [Backend admin service](../../../../nestlancer-backend-api/docs/components/services/admin.md) (sibling repo)
- [CHANGELOG](../../changelog/CHANGELOG.md)

---

<div align="center">

**Admin application (`apps/admin`)** — Nestlancer backend component documentation

</div>
