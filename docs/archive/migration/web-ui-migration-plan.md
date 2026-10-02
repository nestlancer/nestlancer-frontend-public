## 📖 Table of Contents

- [🏗 Architecture](#architecture)
- [PR sequence (completed)](#pr-sequence-completed)
- [Dependencies added](#dependencies-added)
- [Dependencies not upgraded](#dependencies-not-upgraded)
- [Verification](#verification)

---

## 🏗 Architecture

**Approach:** Hybrid token port (Option A). Keep Next.js 14 / React 18 / TanStack Query; adopt TailAdmin as visual design system only.

- Tokens: `apps/web/src/styles/tailadmin-tokens.css` + `tailwind.config.ts` `ta-brand-*`
- Shared classes: `apps/web/src/lib/tailadmin-classes.ts`
- Card wrapper: `apps/web/src/components/web/WebPanel.tsx`
- Confirm UX: `apps/web/src/components/web/WebConfirmProvider.tsx`

Admin app (`apps/admin`) remains on Gentelella v4 — web tokens are app-scoped.

---

## PR sequence (completed)

| PR  | Scope                    | Key files                                                                         |
| :-- | :----------------------- | :-------------------------------------------------------------------------------- |
| 1   | Tokens + auth            | `(auth)/**`, `tailadmin-tokens.css`, auth forms                                   |
| 2   | Dashboard shell          | `SidebarContext`, `Sidebar`, `DashboardHeader`, `DashboardShell`, mobile nav      |
| 3   | Dashboard home           | `DashboardOverview`, `DashboardMetricCard`, `DashboardWorkspaceChart`, ApexCharts |
| 4   | Interactions             | `WebConfirmProvider`, `CommandPaletteRoot`, 10 confirm replacements               |
| 5   | Pipeline lists           | requests/quotes/projects list clients, `WorkListItem`                             |
| 6   | Pipeline details         | request/quote detail, project hub tabs                                            |
| 7   | Messages + notifications | `MessagesLayoutShell`, `NotificationsClient`                                      |
| 8   | Account + billing        | settings, profile, payments, media library                                        |
| 9   | Cleanup + public polish  | remove legacy CSS, blog/portfolio cards, `PublicHeader`                           |

---

## Dependencies added

- `apexcharts`, `react-apexcharts` (dashboard chart only)

---

## Dependencies not upgraded

- Next.js 14, React 18, Tailwind CSS 3 (TailAdmin v2 targets newer stack — patterns ported only)

---

## Verification

```bash
cd nestlancer-frontend/apps/web
pnpm type-check
pnpm lint
pnpm test:e2e
pnpm dev   # http://localhost:9000
```

Compare with https://nextjs-demo.tailadmin.com
