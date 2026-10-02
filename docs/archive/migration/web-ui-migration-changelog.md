## 📖 Table of Contents

- [Added](#added)
- [Removed / replaced](#removed-replaced)
- [Modules restyled](#modules-restyled)
- [Unchanged (by design)](#unchanged-by-design)
- [Acceptance checklist](#acceptance-checklist)

---

## Added

| Path                                             | Purpose                                  |
| :----------------------------------------------- | :--------------------------------------- |
| `src/styles/tailadmin-tokens.css`                | Brand scale, panel surfaces, layout vars |
| `src/lib/tailadmin-classes.ts`                   | Shared Tailwind class strings            |
| `src/components/web/WebPanel.tsx`                | Flat card surface                        |
| `src/components/web/DashboardMetricCard.tsx`     | TailAdmin KPI cards                      |
| `src/components/web/DashboardWorkspaceChart.tsx` | ApexCharts bar chart                     |
| `src/components/web/WebConfirmProvider.tsx`      | Replaces `window.confirm`                |
| `src/components/auth/AuthGridShape.tsx`          | Auth brand panel decoration              |
| `src/components/auth/AuthPageHeader.tsx`         | Auth page titles                         |
| `src/components/layout/SidebarContext.tsx`       | Collapsible sidebar state                |
| `docs/web-ui-migration-inventory.md`             | Phase 1 audit                            |
| `docs/web-ui-migration-plan.md`                  | Strategy + PR breakdown                  |

---

## Removed / replaced

| Legacy                                                 | Replacement                     |
| :----------------------------------------------------- | :------------------------------ |
| `glass-panel` CSS utility                              | `webPanelClass` / `WebPanel`    |
| `GlassPanel` component usage                           | `WebPanel`                      |
| `accent-gradient` buttons                              | `webPrimaryButtonClass`         |
| `accent-gradient-text`                                 | `webPrimaryTextClass`           |
| `window.confirm` (10 sites)                            | `useWebConfirm()`               |
| Auth mesh/shine gradients                              | TailAdmin split auth layout     |
| Glass dashboard header                                 | Flat `border-gray-200` header   |
| Gradient sidebar active bar                            | `bg-ta-brand-50` menu highlight |
| `shadow-premium`, `shadow-glass`, `shadow-accent-glow` | `shadow-theme-xs/sm`            |
| `gradient-auth-mesh/shine` tailwind keys               | Removed (auth no longer uses)   |

---

## Modules restyled

- **Auth:** login, register, forgot/reset password, verify email, 2FA challenge
- **Shell:** sidebar, header, mobile nav, user menu
- **Dashboard:** overview with 6 KPIs + chart + activity
- **Pipeline:** requests, quotes, projects (list + detail + hub)
- **Messaging:** split-pane layout
- **Billing:** payments list/detail/invoice/methods, checkout panel
- **Account:** profile, settings hub + tabs, notifications, media library
- **Public (light):** blog cards, portfolio hero, public header/footer area

---

## Unchanged (by design)

- All API calls, TanStack Query keys, routes, auth guards
- `packages/api-client`, backend contracts
- `apps/admin` Gentelella v4 styling
- Marketing homepage content structure (`(public)/page.tsx` layout only lightly touched via header)

---

## Acceptance checklist

- [x] TailAdmin auth + dashboard shell
- [x] 6 KPI dashboard + ApexCharts
- [x] No `window.confirm` in web app
- [x] No `glass-panel` / `GlassPanel` in dashboard code
- [x] Command palette covers all nav sections
- [x] `pnpm type-check` + `pnpm lint` pass
- [ ] `pnpm test:e2e` — run locally when port 9000 is free
