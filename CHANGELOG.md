## [Unreleased]

### Fixed

- fix(admin): dual-model billing sums installments only (no work+schedule double-count); Installment/Delivery badges
- fix(web): trailing work milestones included in Final installment with clearer client copy

### Added

- Expanded documentation under `docs/components/` for apps and packages

---

## 2026-06 (4 commits)

### Added

- feat(web): realign studio product copy and add frontend CI (`2bb63c2`, 2026-06-01)

### Fixed

- fix(web): finish studio copy realignment and refresh OpenAPI client (`3ecbc48`, 2026-06-01)

### 📚 Documentation

- docs: add master implementation tracker as single source of truth (`cb80f18`, 2026-06-01)

### Tests

- test(ci): expand CI coverage and harden requests/auth flows (`aca61c4`, 2026-06-01)

---

## 2026-05 (80 commits)

### Added

- feat(web): migrate client portal to TailAdmin design system (`006df0f`, 2026-05-31)
- feat(admin): unify console UI theming, layout, and status components (`64a0a3a`, 2026-05-31)
- feat(admin): add user and project pipeline hub views (`c1a41e7`, 2026-05-31)
- feat(admin): migrate console to Gentelella UI and add pipeline hub (`adfeb71`, 2026-05-30)
- feat(web): unify public routes and add visual regression coverage (`7f6eb5a`, 2026-05-30)
- feat(blog): rebuild listing and article layouts with sidebar navigation (`154ca6c`, 2026-05-30)
- feat(portfolio): enhance portfolio timeline and content security policy integration (`01256f1`, 2026-05-29)
- feat(api-client): update API client and hooks for enhanced functionality (`7417c56`, 2026-05-29)
- feat(api-client): normalize pulled spec and regenerate client (`b2ed975`, 2026-05-29)
- feat(api-client): regenerate from merged OpenAPI and align contract tooling (`c84c5fc`, 2026-05-29)
- feat(web,admin,ui): ship shared UI upgrade, telemetry, and mocked e2e coverage (`628fc0f`, 2026-05-28)
- feat(api-client): enhance authentication and blog features (`b3cb72d`, 2026-05-26)
- feat(admin,web): content management and public blog experience (`fc23dad`, 2026-05-26)
- feat: implement global theme toggle and animated background components across admin portal pages (`465c39c`, 2026-05-26)
- feat: remove obsolete demo assets and documentation while updating analytics client integration. (`b3e1c96`, 2026-05-25)
- feat: standardize dashboard UI components and introduce unified design system (`efd5c9d`, 2026-05-24)
- feat(admin,media): portfolio admin UI, presigned downloads, and API drift checks (`04ecfe2`, 2026-05-24)
- feat(messaging): enhance file message handling and upload functionality (`bf28fa9`, 2026-05-24)
- feat(admin): enhance media management with tabbed interface and new components (`b046c92`, 2026-05-24)
- feat(media): admin quarantine UI, chunked upload client, and public share pages (`d6d8cf4`, 2026-05-23)
- feat(web,admin): integrate @radix-ui/react-tooltip and update form components (`09d2646`, 2026-05-23)
- feat(web,admin): add field-help package and wire contextual form tooltips (`54e349e`, 2026-05-23)
- feat(web,admin): milestone gates, paise display, deliverable review, and admin ops console (`5795a29`, 2026-05-22)
- feat(web): Razorpay checkout UX, test-payment docs, and payment console polish (`8fb2bad`, 2026-05-22)
- feat(web,admin): payments console, checkout flows, and API client gap fixes (`9a552c6`, 2026-05-21)
- feat(web,admin): regenerate Orval client from full OpenAPI and wire gap-analysis UI flows (`dd5d6cc`, 2026-05-21)
- feat(admin): add requests and quotes console with realtime sync and 2FA fixes (`8196bcb`, 2026-05-21)
- feat(admin): integrate Playwright for end-to-end testing and enhance user management features (`30c0df4`, 2026-05-20)
- feat(web,admin,landing): standardize env files and add production compose (`9a80abe`, 2026-05-17)
- feat(web,admin): 2FA login, Razorpay checkout, auth BFF, and feature gaps (`e56f3e6`, 2026-05-17)
- feat(dashboard): use aggregated BFF summary and simplify admin overview (`2f29559`, 2026-05-16)
- feat(web): premium client auth, dashboard shell, and account UX (`eb7ec83`, 2026-05-16)
- feat(admin): overhaul operator console with Tremor dashboards and theming (`529a779`, 2026-05-15)
- feat(messaging): add admin and client chat threads with realtime updates (`9da2b14`, 2026-05-15)
- feat: enhance dashboard functionality with new messaging and notifications components (`df2d72f`, 2026-05-14)
- feat: enhance admin dashboard components and improve data handling (`3f40b4b`, 2026-05-14)
- feat: enhance admin dashboard with new routes and client components (`05c5d82`, 2026-05-14)
- feat: implement logout functionality and enhance API client for session management (`ca3fa94`, 2026-05-14)
- feat: add multi-subdomain Nginx configuration and standardize dev environment URLs for web, admin, and landing apps (`6db97b8`, 2026-05-13)
- feat: enhance admin application with new features and dependencies (`fd9fb7b`, 2026-05-13)
- feat: enhance WebSocket integration with authenticated socket provider (`d048f15`, 2026-05-12)
- feat: add Docker support for development environment and Nginx configuration (`c1575e6`, 2026-05-12)
- feat: implement AdminWireframeSections component for dashboard pages (`898c505`, 2026-05-12)
- feat: implement dark mode support with theme provider and toggle component (`27a4696`, 2026-05-12)
- feat: update Nestlancer frontend structure and configurations (`e5b3dc0`, 2026-05-11)
- feat: initialize Nestlancer frontend monorepo structure with essential configurations (`dfa3784`, 2026-05-11)
- feat: add foundational documentation for Nestlancer frontend implementation (`215929c`, 2026-05-11)
- feat: enhance wireframe documentation with new sections for media management, payments disputes, system configuration, user account security, and payment history (`4e738eb`, 2026-05-10)
- feat: expand architecture documentation and add new web page assumptions (`fa6e31c`, 2026-05-10)
- feat: add dockerized development environment with multi-service support and npm scripts (`72599d5`, 2026-05-09)
- feat: enhance admin and landing applications with new features and configurations (`d93ccc4`, 2026-05-09)
- feat: Phase 13 — Testing, performance & deployment config (`e7436fc`, 2026-05-08)
- feat: implement Phase 12 progress tracking and admin webhooks management (`f854263`, 2026-05-08)
- feat: implement Phase 10-11 public platform features and admin dashboard foundation (`02cf93d`, 2026-05-08)
- feat: implement Phase 8-9 payments/media and profile/portfolio/settings modules (`bea39e9`, 2026-05-08)
- feat: implement Phase 6-7 requests/quotes workflows and realtime messaging/notifications (`50a8021`, 2026-05-08)
- feat: implement Phase 3-5 auth flow, dashboard shell, and projects module (`8c3f4a3`, 2026-05-08)
- feat: implement Phase 1 (foundation) and Phase 2 (API layer) (`2d5ab45`, 2026-05-08)

### Fixed

- fix(payments): admin refund fixes, client refund UI, and debug logging (`88f6971`, 2026-05-31)
- fix(web): client view recording, engagement UI, and API client sync (`f0df29d`, 2026-05-31)
- fix(security): keep secrets out of URLs for client and admin auth (`84861f7`, 2026-05-31)
- fix(admin): correct data display and harden API verification (`0099f9f`, 2026-05-31)
- fix(api-client): sync OpenAPI mirror and skip prettier on contract JSON (`fc93fd2`, 2026-05-29)
- fix(utils): guard optional IP parse segments for strict TypeScript (`cdfc4b7`, 2026-05-23)
- fix(api-client): regenerate OpenAPI client after Swagger documentation tag change (`a49c48b`, 2026-05-15)
- fix: resolve phase 1-12 implementation gaps and admin app structure (`efa12e1`, 2026-05-08)

### Changed

- chore(commitlint): update configuration and Husky hooks (`2f9b926`, 2026-05-29)
- chore(api-client): regenerate from gateway merged OpenAPI spec (`6be75c2`, 2026-05-29)
- refactor(admin): streamline dependencies and integrate @nestlancer/ui components (`3c2a9b2`, 2026-05-27)
- refactor: overhaul dashboard and admin top navigation headers with consistent accent gradients and enhanced layout components (`95469a3`, 2026-05-25)
- refactor: centralize auth UI copy in a new constants module and improve cross-portal login redirection toasts (`bbd7040`, 2026-05-14)
- refactor: remove portfolio pages and update middleware configuration (`216f50d`, 2026-05-12)
- chore: remove codebase and associated configuration files (`5ed3816`, 2026-05-09)
- refactor: rename pipeline to tasks in turbo.json for clarity (`36a77ca`, 2026-05-08)
- chore: update development ports and add TypeScript environment files (`7efaeda`, 2026-05-08)
- Initialize Nestlancer frontend monorepo with Next.js 14, TypeScript, and Tailwind CSS. Set up project structure, environment variables, ESLint, Prettier, and CI/CD workflows. Add admin and landing … (`64b0195`, 2026-05-08)

### 📚 Documentation

- docs: add theme design system and update wireframe documentation to reference Google Stitch patterns (`e6fafeb`, 2026-05-12)
- docs: refactor wireframe documentation by splitting individual pages into separate markdown files (`70c0d58`, 2026-05-10)
- docs: add architectural documentation for Nestlancer frontend (`0db797a`, 2026-05-09)

### Tests

- test(admin): add API contract verification and live page E2E coverage (`3fac87e`, 2026-05-31)

---
