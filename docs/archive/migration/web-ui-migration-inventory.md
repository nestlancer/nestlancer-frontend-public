## 📖 Table of Contents

- [Executive summary](#executive-summary)
- [1. Route & navigation map](#1-route-navigation-map)
- [2. Layout shell (current)](#2-layout-shell-current)
- [3. Design tokens (current)](#3-design-tokens-current)
- [4. Legacy styling inventory](#4-legacy-styling-inventory)
- [5. Shared UI patterns](#5-shared-ui-patterns)
- [6. Feature clients — API & workflow summary](#6-feature-clients-api-workflow-summary)
- [7. Command palette (current)](#7-command-palette-current)
- [8. TailAdmin reference audit](#8-tailadmin-reference-audit)
- [9. Gap analysis — current vs TailAdmin](#9-gap-analysis-current-vs-tailadmin)
- [10. API ↔ UI coverage](#10-api-ui-coverage)
- [11. Recommended PR sequence (8 PRs)](#11-recommended-pr-sequence-8-prs)
- [12. Architecture recommendation](#12-architecture-recommendation)
- [13. Verification checklist (for final migration sign-off)](#13-verification-checklist-for-final-migration-sign-off)
- [14. Reference paths](#14-reference-paths)

---

## Executive summary

The client portal uses a **glassmorphism + gradient accent** visual system across shell chrome, auth, and most feature pages. Business logic is mature: TanStack Query, `@nestlancer/api-client`, WebSocket messaging, and role-agnostic client workflows are well separated in `*Client.tsx` files.

TailAdmin adoption is a **shell + surface restyle**, not a stack upgrade. Nestlancer web stays on **Next.js 14 / React 18 / Tailwind CSS 3**; TailAdmin v2 patterns (Tailwind 4 `@theme`, collapsible 290px/90px sidebar, ApexCharts, flat bordered cards) are ported as class semantics and CSS variables.

**Highest-impact gaps:**

| Area            | Current                           | TailAdmin reference                  | Gap severity         |
| :-------------- | :-------------------------------- | :----------------------------------- | :------------------- |
| Dashboard shell | Fixed 260px sidebar, glass header | Collapsible sidebar + flat header    | High                 |
| Auth layout     | Gradient mesh + glass card        | Split panel + `GridShape` brand side | High                 |
| Dashboard home  | StatCards + activity, no chart    | Ecommerce metrics + ApexCharts grid  | Medium               |
| List pages      | Card grids (not DataTable)        | Basic tables + card metrics          | Medium               |
| Messages        | Custom split-pane inbox           | No chat demo in free TailAdmin       | Medium (custom port) |
| Confirm dialogs | 10 `window.confirm` sites         | Modal components                     | High (UX)            |
| Command palette | 7 items                           | Full nav search                      | Low                  |

---

## 1. Route & navigation map

### 1.1 Auth routes (5)

| Route              | Page                              | Client component                      | Pattern              |
| :----------------- | :-------------------------------- | :------------------------------------ | :------------------- |
| `/login`           | `(auth)/login/page.tsx`           | `LoginForm`, `TwoFactorChallengeForm` | Form + 2FA step      |
| `/register`        | `(auth)/register/page.tsx`        | `RegisterForm`                        | Form + social        |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | `PasswordResetForm`                   | Form                 |
| `/reset-password`  | `(auth)/reset-password/page.tsx`  | `ResetPasswordClient`                 | Form (token query)   |
| `/verify-email`    | `(auth)/verify-email/page.tsx`    | `VerifyEmailClient`                   | Auto-verify + resend |

**Layout:** `(auth)/layout.tsx` — split brand panel (desktop) + centered `glass-panel` form card; mesh/shine gradients.

### 1.2 Dashboard routes (25 pages)

| Section       | Routes                                                                                               | Count |
| :------------ | :--------------------------------------------------------------------------------------------------- | :---- |
| Home          | `/dashboard`                                                                                         | 1     |
| Requests      | `/requests`, `/requests/new`, `/requests/[id]`                                                       | 3     |
| Quotes        | `/quotes`, `/quotes/[id]`                                                                            | 2     |
| Projects      | `/projects`, `/projects/new`, `/projects/[id]`                                                       | 3     |
| Messages      | `/messages`, `/messages/[conversationId]`, `/messages/thread/[threadId]`, `/messages/new/direct`     | 4     |
| Billing       | `/payments`, `/payments/[id]`, `/payments/invoice/[id]`, `/payments/methods`                         | 4     |
| Notifications | `/notifications`                                                                                     | 1     |
| Profile       | `/profile`, `/profile/edit`                                                                          | 2     |
| Settings      | `/settings`, `/settings/account`, `/settings/security`, `/settings/notifications`, `/settings/files` | 5     |

**Total in-scope routes:** 30 (5 auth + 25 dashboard)

### 1.3 Navigation config

**File:** `apps/web/src/config/dashboard-nav.ts`

| Section | Items                                                                        |
| :------ | :--------------------------------------------------------------------------- |
| Main    | Dashboard, Requests, Projects, Quotes, Messages, Billing, Notifications      |
| Explore | Blog, Portfolio (links to public routes — leave URLs, restyle nav item only) |
| Account | Profile, Settings                                                            |

**Mobile:** `DASHBOARD_BOTTOM_NAV` — Dashboard, Projects, Messages, Billing shortcuts + full menu sheet.

### 1.4 Out of scope

- `(public)/` — home, blog, portfolio, freelancers, contact, terms, privacy, work
- `/share/[token]` — guest share view (defer)
- `(public)/blog/bookmarks` — uses `RequireAuth` but lives in public route group; defer unless scoped

---

## 2. Layout shell (current)

### 2.1 Dashboard shell

```
DashboardShell
├── RequestsQuotesRealtimeSync
├── CommandPaletteRoot
├── Sidebar (lg+, 260px, sticky)
├── DashboardHeader (glass topbar, gradient accent line)
├── <main id="main-content"> (max-w-dashboard, padded)
├── DashboardMobileBottomNav
└── DashboardMobileNavSheet
```

**Files:**

| File                                       | Role                                            | Legacy styling                      |
| :----------------------------------------- | :---------------------------------------------- | :---------------------------------- |
| `components/layout/DashboardShell.tsx`     | Orchestrator                                    | —                                   |
| `components/layout/Sidebar.tsx`            | 3-section nav                                   | `accent-gradient` active bar + logo |
| `components/layout/DashboardHeader.tsx`    | Breadcrumb, ⌘K, theme, notifications, user menu | `glass-panel`, gradient top line    |
| `components/layout/DashboardMobileNav.tsx` | Bottom bar + sheet                              | `glass-panel`                       |
| `components/layout/DashboardLayout.tsx`    | Thin wrapper                                    | —                                   |
| `app/(dashboard)/layout.tsx`               | `WebAuthGuard`                                  | —                                   |

**Real-time / global:** `RequestsQuotesRealtimeSync`, `CommandPaletteRoot`

**Accessibility:** Root layout already has skip-to-content link + `themeInitScript` (FOUC guard exists at app root).

### 2.2 Auth shell

| Element      | Current                                                               |
| :----------- | :-------------------------------------------------------------------- |
| Background   | `bg-gradient-auth-mesh`, `bg-gradient-auth-shine`, floating blur orbs |
| Brand panel  | Primary color, quote block, Sparkles logo                             |
| Form wrapper | `glass-panel rounded-2xl/3xl shadow-premium/glass-lg`                 |
| Theme toggle | `AuthThemeToggle` in header                                           |

### 2.3 Settings sub-shell

`SettingsLayoutClient` — horizontal tab nav (Profile, Account, Security, Notifications, Files) wrapping settings routes. Migrate with settings PR.

### 2.4 Messages sub-shell

`MessagesLayoutShell` — desktop split-pane (conversation list + content); 3× `glass-panel` wrappers. No TailAdmin chat page in free repo — port split layout using TailAdmin card/border tokens.

---

## 3. Design tokens (current)

### 3.1 `apps/web/src/app/globals.css`

| Utility                 | Purpose                      |
| :---------------------- | :--------------------------- |
| `.glass-panel`          | Border + blur + glass shadow |
| `.accent-gradient`      | 135° brand gradient fill     |
| `.accent-gradient-text` | Gradient clipped text        |
| `.transition-theme`     | 280ms theme transitions      |
| `.section-y-*`          | Marketing section spacing    |
| Article/trust utilities | Mostly public pages          |

### 3.2 `@nestlancer/theme/tokens.css` (via import)

Key variables used by web:

- `--sidebar-width: 260px`, `--header-height`, `--content-max-width`
- `--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-shadow`
- `--accent-1`, `--accent-2` (gradient pair)
- Semantic HSL: `--background`, `--primary`, `--sidebar`, etc.

### 3.3 `apps/web/tailwind.config.ts`

- Dark mode: `class`
- Custom shadows: `glass`, `glass-lg`, `premium`, `accent-glow`, `inner-glow`
- Background images: `gradient-auth-mesh`, `gradient-auth-shine`
- Layout: `w-sidebar`, `h-header`, `max-w-dashboard`
- Fonts: `--font-sans` (Outfit), `--font-display` (Fraunces)

### 3.4 TailAdmin tokens to port (from `/root/workspace/tailadmin/src/app/globals.css`)

TailAdmin uses Tailwind v4 `@theme` with:

- Brand scale: `--color-brand-500` (#465fff) through `--color-brand-950`
- Gray scale + `--color-gray-dark`
- Surface tokens: `boxdark`, `strokedark`, `bodydark` (dark mode)
- Typography: `--text-theme-xl/sm/xs`, title scale
- Sidebar widths: **290px expanded / 90px collapsed** (vs Nestlancer 260px fixed)

**Migration approach:** Map TailAdmin semantic colors to new `--ta-*` CSS variables in `apps/web/src/styles/tailadmin-tokens.css`, bridged to existing `@nestlancer/theme` where admin app must not break.

---

## 4. Legacy styling inventory

### 4.1 `glass-panel` class — 25 usages in 16 files (+ definition)

| File                              | Uses |
| :-------------------------------- | :--- |
| `MessagesLayoutShell.tsx`         | 3    |
| `SettingsSecurityClient.tsx`      | 3    |
| `SettingsAccountClient.tsx`       | 3    |
| `SettingsNotificationsClient.tsx` | 2    |
| `PaymentDetailClient.tsx`         | 2    |
| `ProfileEditClient.tsx`           | 2    |
| `DashboardMobileNav.tsx`          | 2    |
| `QuotesListClient.tsx`            | 1    |
| `QuoteDetailClient.tsx`           | 1    |
| `PaymentMethodsClient.tsx`        | 1    |
| `PaymentInvoiceClient.tsx`        | 1    |
| `ProfileViewClient.tsx`           | 1    |
| `ProjectsListClient.tsx`          | 1    |
| `settings/page.tsx`               | 1    |
| `(auth)/layout.tsx`               | 1    |
| `DashboardHeader.tsx`             | 1    |

### 4.2 `GlassPanel` component — 3 files

- `DashboardOverview.tsx`
- `RequestDetailClient.tsx`
- `ProjectHubContractStrip.tsx`

### 4.3 `accent-gradient` / `accent-gradient-text` — 15 class usages in 11 in-scope files

Shell: `Sidebar.tsx`, `DashboardMobileNav.tsx`  
Features: `DashboardOverview`, `RequestsListClient`, `RequestDetailClient`, `QuoteDetailClient`, `ProjectHubHeader`, `ProjectHubMilestonesTab`, `ProjectHubContractStrip`, `WorkListItem`  
Out of scope: `PortfolioHero.tsx` (1)

### 4.4 Native confirm dialogs — 10 call sites in 8 in-scope files

| File                             | Action                                                          |
| :------------------------------- | :-------------------------------------------------------------- |
| `RequestDetailClient.tsx`        | Remove attachment, delete draft                                 |
| `PaymentMethodsClient.tsx`       | Remove payment method                                           |
| `PaymentDetailClient.tsx`        | Cancel pending payment                                          |
| `SettingsSecurityClient.tsx`     | Sign out device                                                 |
| `SettingsAccountClient.tsx`      | Delete account                                                  |
| `NotificationsClient.tsx`        | Delete notification                                             |
| `MediaLibraryClient.tsx`         | Delete file, revoke share                                       |
| `BlogPostInteractionsClient.tsx` | Delete comment _(public route — defer or include in dialog PR)_ |

No `window.prompt` found in `apps/web`.

---

## 5. Shared UI patterns

### 5.1 Web-local components (`apps/web/src/components/`)

| Component                   | Used for            | Migration priority |
| :-------------------------- | :------------------ | :----------------- |
| `PageHeader`                | All major pages     | PR 4+              |
| `EmptyState`                | Lists, messages     | PR 4+              |
| `StatusPill`                | Status labels       | PR 4+              |
| `SwitchRow`                 | Settings toggles    | PR 8               |
| `TabPanelSkeleton`          | Project hub loading | PR 6               |
| `CommandPaletteRoot`        | ⌘K (7 items)        | PR 5               |
| `NavbarUserMenu`            | Header dropdown     | PR 2               |
| `DashboardNotificationLink` | Header bell         | PR 2               |

### 5.2 `@nestlancer/ui` usage (in-scope)

**Heavy use:** `PageHeader`, `Button`, `StatCard`, `EmptyState`, `ErrorState`, `Skeleton`/`SkeletonTable`, `StatusBadge`, `Card`, `toast`, `cn`, `FilterBar`, `Pagination`, `ActionBanner`

**Light use:** `GlassPanel` (3), `Dialog`/`Sheet` (available — use for confirm replacement)

**Unused in web:** `DataTable` (lists are card grids)

### 5.3 Per-module UI patterns

| Module        | List pattern                   | Detail pattern       | Key shared UI                                    |
| :------------ | :----------------------------- | :------------------- | :----------------------------------------------- |
| Dashboard     | KPI grid + activity            | —                    | `StatCard`, `GlassPanel`, `ActionBanner`         |
| Requests      | Tabs + filter bar + list items | 2-col + sidebar CTA  | `WorkHubTabBar`, `WorkFilterBar`, `WorkListItem` |
| Quotes        | Stat bar + card grid           | Sticky action footer | `StatusBadge`, glass cards                       |
| Projects      | Card grid                      | Tabbed hub (5 tabs)  | `ProjectHub*` components                         |
| Messages      | Split-pane inbox               | Chat thread          | WebSocket, `MessageThreadToolbar`                |
| Payments      | Filter + stat hero + cards     | Timeline + checkout  | `PaymentStatsHero`, `PaymentCheckoutPanel`       |
| Notifications | Tabbed list                    | —                    | Embeds settings prefs on tab                     |
| Profile       | Hero card                      | Edit form sections   | Avatar upload                                    |
| Settings      | Hub link grid                  | Section forms        | `SettingsLayoutClient` tabs                      |
| Media/files   | Upload grid + share modal      | —                    | `FileUpload`, `ShareMediaModal`                  |

---

## 6. Feature clients — API & workflow summary

### 6.1 Auth (`features/auth/components/`)

| Component                | API                                           | Notes                |
| :----------------------- | :-------------------------------------------- | :------------------- |
| `LoginForm`              | `auth.login`, `users.getProfile`              | Redirect after login |
| `TwoFactorChallengeForm` | `auth.verify2FA`                              | Inline on login page |
| `RegisterForm`           | `auth.register`                               | Zod + RHF            |
| `PasswordResetForm`      | `auth.forgotPassword`                         |                      |
| `SocialLogin`            | OAuth links                                   | Keep behavior        |
| `ResetPasswordClient`    | `auth.resetPassword`                          | Token from URL       |
| `VerifyEmailClient`      | `auth.verifyEmail`, `auth.resendVerification` | Auto-run on mount    |

### 6.2 Dashboard

| Component           | API                         | Data                                                                    |
| :------------------ | :-------------------------- | :---------------------------------------------------------------------- |
| `DashboardOverview` | `users.getDashboardSummary` | Projects, requests, quotes, payments, messages, notifications, activity |

### 6.3 Work pipeline

| Client                | Primary APIs                                                            |
| :-------------------- | :---------------------------------------------------------------------- |
| `RequestsListClient`  | `requests.list`, `requests.getStats`, `projects.list`                   |
| `NewRequestClient`    | `requests.create`                                                       |
| `RequestDetailClient` | `requests.getById`, quotes, timeline, attachments, submit/update/delete |
| `QuotesListClient`    | `quotes.list`, `quotes.getStats`                                        |
| `QuoteDetailClient`   | `quotes.getById`, accept/decline/changes, PDF, project lookup           |
| `ProjectsListClient`  | `projects.list`                                                         |
| `ProjectsNewClient`   | `quotes.list` (redirect hub — no create form)                           |
| `ProjectDetailClient` | `projects.getById`, milestones, progress                                |

**Project hub tabs:** overview, milestones, deliverables, files, messages — each under `features/projects/hub/`.

### 6.4 Messaging

| Client                    | Primary APIs                   | Real-time   |
| :------------------------ | :----------------------------- | :---------- |
| `ConversationsListPanel`  | `messaging.conversations`      | —           |
| `MessageThreadClient`     | project messages CRUD          | WebSocket   |
| `MessageChatThreadClient` | direct thread messages         | WebSocket   |
| `MessageNewDirectClient`  | `messaging.createDirectThread` | Auto-create |

### 6.5 Billing

| Client                 | Primary APIs                                  |
| :--------------------- | :-------------------------------------------- |
| `PaymentsListClient`   | `payments.list`                               |
| `PaymentDetailClient`  | `payments.getById`, cancel, dispute, receipts |
| `PaymentInvoiceClient` | `payments.getInvoiceUrl`                      |
| `PaymentMethodsClient` | methods CRUD, default                         |

### 6.6 Account

| Client                                    | Primary APIs                      |
| :---------------------------------------- | :-------------------------------- |
| `NotificationsClient`                     | list, read, delete, readAll       |
| `ProfileViewClient` / `ProfileEditClient` | profile get/update, avatar        |
| `SettingsAccountClient`                   | preferences, export, deletion     |
| `SettingsSecurityClient`                  | password, sessions, 2FA           |
| `SettingsNotificationsClient`             | notification prefs                |
| `MediaLibraryClient`                      | media list, upload, share, delete |

---

## 7. Command palette (current)

**File:** `components/command/CommandPaletteRoot.tsx`  
**Flag:** `commandPaletteWeb` (default on)

| ID                 | Group      | Label       | Target          |
| :----------------- | :--------- | :---------- | :-------------- |
| nav-dashboard      | Navigation | Dashboard   | `/dashboard`    |
| nav-requests       | Navigation | Requests    | `/requests`     |
| nav-projects       | Navigation | Projects    | `/projects`     |
| nav-messages       | Navigation | Messages    | `/messages`     |
| nav-payments       | Navigation | Payments    | `/payments`     |
| nav-settings       | Navigation | Settings    | `/settings`     |
| action-new-request | Actions    | New request | `/requests/new` |

**Missing vs sidebar:** Quotes, Notifications, Profile, Blog, Portfolio, New project, New direct message, Theme toggle.

---

## 8. TailAdmin reference audit

### 8.1 TailAdmin repo structure (local)

| Path                                                   | Purpose                                         |
| :----------------------------------------------------- | :---------------------------------------------- |
| `src/layout/AppSidebar.tsx`                            | Collapsible nav, 290/90px, accordion submenus   |
| `src/layout/AppHeader.tsx`                             | Sticky header, search, notifications, user menu |
| `src/context/SidebarContext.tsx`                       | Expand/collapse/mobile state                    |
| `src/app/(admin)/layout.tsx`                           | Shell wrapper                                   |
| `src/app/(admin)/page.tsx`                             | Ecommerce dashboard grid                        |
| `src/components/ecommerce/*`                           | Metrics, charts, recent orders                  |
| `src/components/auth/SignInForm.tsx`, `SignUpForm.tsx` | Auth forms                                      |
| `src/app/(full-width-pages)/(auth)/`                   | signin, signup layouts                          |
| `src/components/charts/*`                              | ApexCharts line/bar                             |
| `src/components/tables/BasicTableOne.tsx`              | Table styling reference                         |
| `src/components/user-profile/*`                        | Profile cards                                   |
| `src/components/ui/modal/*`                            | Confirm dialog patterns                         |

**Not in free TailAdmin:** dedicated chat/inbox, file manager, reset-password page (only signin/signup in auth folder). Nestlancer must **adapt** form-elements + modal patterns for forgot/reset/verify-email.

### 8.2 Page mapping

| Nestlancer                                             | TailAdmin reference                                                        | Notes                             |
| :----------------------------------------------------- | :------------------------------------------------------------------------- | :-------------------------------- |
| `/dashboard`                                           | `(admin)/page.tsx` + `EcommerceMetrics`, `StatisticsChart`, `RecentOrders` | Add ApexCharts in PR 3            |
| `/login`                                               | `SignInForm` + auth layout                                                 | Keep 2FA inline step              |
| `/register`                                            | `SignUpForm`                                                               | Keep social login row             |
| `/forgot-password`, `/reset-password`, `/verify-email` | `form-elements` + auth layout                                              | No 1:1 page — same shell          |
| `/requests`, `/quotes`, `/projects`                    | `BasicTableOne` styling on card lists OR table refactor                    | Keep card UX; restyle surfaces    |
| `/projects/[id]`                                       | `profile` + tabbed sections                                                | Custom tab bar stays              |
| `/messages`                                            | Custom (no chat demo)                                                      | TailAdmin cards + split grid      |
| `/payments`                                            | `RecentOrders` + table patterns                                            | Keep `PaymentCheckoutPanel` logic |
| `/notifications`                                       | `NotificationDropdown` scaled up                                           | List row styling                  |
| `/profile`, `/profile/edit`                            | `UserMetaCard`, `UserInfoCard`, form-elements                              |                                   |
| `/settings/*`                                          | `form-elements`, `ToggleSwitch`                                            | Tab nav restyle                   |
| `/settings/files`                                      | `DropZone` + grid                                                          | No file-manager page              |

---

## 9. Gap analysis — current vs TailAdmin

### 9.1 Shell & navigation

| Gap                  | Current               | Target                                | Effort |
| :------------------- | :-------------------- | :------------------------------------ | :----- |
| Sidebar width        | Fixed 260px           | 290px expanded / 90px collapsed       | M      |
| Sidebar collapse     | None                  | Hover expand + pin                    | M      |
| Header surface       | Glass + gradient line | Flat white/gray-900 + border-b        | S      |
| Active nav indicator | Gradient left bar     | TailAdmin filled/highlight menu item  | S      |
| Mobile nav           | Bottom bar + sheet    | TailAdmin `Backdrop` + drawer pattern | M      |
| Breadcrumb           | Custom                | `PageBreadCrumb` pattern              | S      |

### 9.2 Auth

| Gap        | Current                 | Target                               | Effort |
| :--------- | :---------------------- | :----------------------------------- | :----- |
| Background | Animated mesh gradients | Solid brand-950 panel + `GridShape`  | M      |
| Form card  | Glass blur              | White/dark-gray bordered card        | S      |
| Pages      | 5 routes                | TailAdmin has 2 — extend same layout | S      |

### 9.3 Dashboard

| Gap             | Current           | Target                                        | Effort |
| :-------------- | :---------------- | :-------------------------------------------- | :----- |
| Charts          | None              | ApexCharts area/line (StatisticsChart)        | M      |
| KPI cards       | `StatCard` (4-up) | `EcommerceMetrics` icon badges                | S      |
| Recent activity | Custom list       | TailAdmin timeline / RecentOrders table style | S      |
| Layout grid     | Flexible sections | 12-col TailAdmin grid                         | S      |

### 9.4 Feature pages

| Gap             | Current                       | Target                                                     | Effort   |
| :-------------- | :---------------------------- | :--------------------------------------------------------- | :------- |
| Cards           | `glass-panel rounded-2xl/3xl` | `rounded-xl border border-stroke bg-white dark:bg-boxdark` | S (wide) |
| Primary CTAs    | `accent-gradient` buttons     | TailAdmin brand-500 solid buttons                          | S        |
| Tables          | Card lists                    | Optional: table styling without changing data layout       | M        |
| Confirm UX      | `window.confirm`              | `WebConfirmDialog` + TailAdmin modal                       | M        |
| Command palette | 7 items                       | All nav + quick actions                                    | S        |

### 9.5 Technical / stack

| Gap               | Notes                                                                                                               |
| :---------------- | :------------------------------------------------------------------------------------------------------------------ |
| Tailwind v3 vs v4 | Port `@theme` colors to CSS variables; do not upgrade Tailwind in same PR series                                    |
| Fonts             | Nestlancer: Fraunces + Outfit; TailAdmin: Outfit only — keep Nestlancer fonts or align to Outfit-only for dashboard |
| Charts            | Add `apexcharts` + `react-apexcharts` in dashboard PR only                                                          |
| Shared packages   | Scope TailAdmin tokens to `apps/web` imports; avoid breaking `apps/admin` Gentelella tokens                         |
| Tests             | 3 e2e specs: `smoke`, `requests-list.mocked`, `public-pages.visual` — update selectors after shell PR               |

---

## 10. API ↔ UI coverage

All major user API domains have UI coverage. **No new features** required for migration.

| API domain                | UI coverage                     | Gaps                                             |
| :------------------------ | :------------------------------ | :----------------------------------------------- |
| Auth                      | Full (5 pages + 2FA)            | —                                                |
| Users / dashboard summary | `/dashboard`, profile, settings | —                                                |
| Requests                  | List, new, detail               | —                                                |
| Quotes                    | List, detail + actions          | —                                                |
| Projects                  | List, hub tabs                  | `/projects/new` is redirect hub only (by design) |
| Messaging                 | Inbox, threads, direct          | —                                                |
| Payments                  | List, detail, invoice, methods  | —                                                |
| Notifications             | List + prefs                    | —                                                |
| Media                     | Settings/files                  | —                                                |
| Progress                  | Inside project hub              | —                                                |

---

## 11. Recommended PR sequence (8 PRs)

| PR    | Title                            | Scope                                                                            | Files (primary)                                               | Risk                         |
| :---- | :------------------------------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------ | :--------------------------- |
| **1** | TailAdmin tokens + auth restyle  | `tailadmin-tokens.css`, auth layout + 5 auth pages/forms, remove auth glass/mesh | `(auth)/**`, `globals.css`, `styles/`                         | Low                          |
| **2** | Dashboard shell                  | Sidebar collapse, header, mobile nav, `WebPanel` base component                  | `components/layout/**`, `DashboardShell`                      | Medium — e2e selectors       |
| **3** | Dashboard overview               | KPI cards, ApexCharts, activity feed, quick links                                | `DashboardOverview.tsx`, chart component                      | Low                          |
| **4** | Confirm dialog + command palette | `WebConfirmDialog`, replace 10 confirms, expand ⌘K                               | `components/`, 8 feature files                                | Medium                       |
| **5** | Work pipeline lists              | Requests, quotes, projects list pages + shared work components                   | `features/requests`, `quotes`, `projects`, `work/`            | Low                          |
| **6** | Work pipeline details            | Request/quote/project detail + hub tabs                                          | `RequestDetailClient`, `QuoteDetailClient`, `projects/hub/**` | Medium                       |
| **7** | Messages + notifications         | Split-pane restyle, chat chrome, notification list                               | `features/messaging/**`, `notifications/**`                   | Medium — WebSocket untouched |
| **8** | Billing + account                | Payments, profile, settings, media library                                       | `payments/**`, `profile/**`, `settings/**`, `media/**`        | Low                          |

**Post-migration cleanup PR (optional 9):** Remove dead glass CSS vars from `globals.css` and `@nestlancer/theme` if no longer referenced; grep verification.

---

## 12. Architecture recommendation

**Selected approach: Option A (hybrid token port)**

1. Add `apps/web/src/styles/tailadmin-tokens.css` with `--ta-brand-*`, `--ta-stroke`, `--ta-box-*` mapped for Tailwind 3 via `@layer base` or extended `tailwind.config.ts` colors.
2. Create `WebPanel` — thin wrapper replacing both `glass-panel` class and `GlassPanel` with TailAdmin card classes.
3. Rebuild shell components to mirror `AppSidebar` / `AppHeader` behavior using React state (no need to copy `SidebarContext` verbatim — adapt to existing patterns).
4. Add ApexCharts only in PR 3; reuse TailAdmin chart config from `StatisticsChart` / `MonthlySalesChart`.
5. Keep all `apiServices.*`, `queryKeys`, routes, auth guards unchanged.

**Do not:** merge TailAdmin repo, upgrade to Next 16 / Tailwind 4, or modify `apps/admin`.

---

## 13. Verification checklist (for final migration sign-off)

- [ ] 30 in-scope routes render in light + dark mode
- [ ] Zero `glass-panel` / `GlassPanel` / `accent-gradient` in dashboard + auth
- [ ] Zero `window.confirm` in `apps/web` (in-scope files)
- [ ] Sidebar collapse works at lg+
- [ ] Command palette covers all `DASHBOARD_NAV_SECTIONS` items
- [ ] `pnpm type-check`, `pnpm lint`, `pnpm test:e2e` pass in `apps/web`
- [ ] Admin app (`apps/admin`) visually unchanged after shared theme edits

---

## 14. Reference paths

```
apps/web/
├── src/app/(auth)/                    # 5 auth routes
├── src/app/(dashboard)/               # 25 dashboard routes
├── src/components/layout/             # Shell
├── src/components/command/            # Command palette
├── src/config/dashboard-nav.ts
├── src/features/                      # Feature clients
├── src/lib/user-dashboard-view-model.ts
└── tests/e2e/

tailadmin/
├── src/layout/AppSidebar.tsx
├── src/layout/AppHeader.tsx
├── src/app/(admin)/page.tsx
├── src/components/ecommerce/
├── src/components/auth/
└── src/app/globals.css
```

---

**Next step:** Review this inventory. Reply **“Approved — proceed with PR 1”** to begin TailAdmin tokens + auth migration.
