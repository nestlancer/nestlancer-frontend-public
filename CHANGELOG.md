# Changelog

All notable changes to the **Nestlancer Frontend** monorepo are documented here.

- Style: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- Generated from git history by `scripts/docs/generate-changelog.mjs` (`pnpm docs:changelog`)
- Coverage: **306 commits** (2026-05-08 → 2026-10-02)

## [Unreleased]

### Added

- Expanded documentation under `docs/components/` for apps and packages

---

## 2026-10

_5 commits_

### Added

- **assets** — add new logo assets for admin, landing, and web applications (`67b6943e`, 2026-10-01)

### Fixed

- **admin** — redirect /api-keys to integrations (`19729b79`, 2026-10-02)
- **audit** — restore quote decline and close remaining UI audit gaps (`b1406a30`, 2026-10-02)
- **ui** — address audit findings for notifications, quotes, and media (`a8053123`, 2026-10-01)
- **auth,admin** — session refresh, remember-me, hard 404s, and deploy static (`0ac9d50b`, 2026-10-01)

---

## 2026-09

_89 commits_

### Added

- **seo** — add llms.txt, enrich JSON-LD, and drop escrow claims (`de297fb2`, 2026-09-29)
- **admin** — sign the admin into the client account after impersonation (`d97aec94`, 2026-09-23)
- **logging** — add structured container logs for apps and auth BFF (`3f343660`, 2026-09-22)
- **admin** — company legal identity CRUD for PDF branding (`7dcd3b76`, 2026-09-20)
- **docker** — add resumable phased prod builds with progress UI (`2e09eebb`, 2026-09-19)
- **security** — enforce production safety for WebSocket URLs (`bc62b193`, 2026-09-18)
- **security** — make Turnstile optional via Infisical site key (`07b01f85`, 2026-09-18)
- **docker** — streamline production image builds with Docker Bake (`07dc74ee`, 2026-09-17)
- **correlation** — improve correlation ID validation and resolution process (`f5a5947a`, 2026-09-17)
- **correlation** — enhance correlation ID validation and resolution logic (`ea45f576`, 2026-09-17)
- **portfolio** — upgrade public listing to an animated zigzag timeline (`ab11343e`, 2026-09-16)
- **landing** — implement featured work slider and enhance global styles (`f75448e3`, 2026-09-16)
- **forms** — add format-hint placeholders across web and admin inputs (`6ef7f30a`, 2026-09-16)
- **debug** — enhance debug visibility and refine UI elements across applications (`5c03b721`, 2026-09-16)
- **docker** — add health checks for services in production configuration (`63c6b282`, 2026-09-16)
- **correlation** — implement correlation ID handling across applications (`a01833b1`, 2026-09-16)
- **middleware** — integrate request logging across applications (`55d1154e`, 2026-09-15)
- **styles** — add print stylesheet and update global styles (`b261649d`, 2026-09-14)
- **auth** — integrate Turnstile captcha for enhanced security in login and password reset forms (`fb645673`, 2026-09-13)
- **payments** — enhance manual payment modal functionality and user experience (`0a238457`, 2026-09-13)
- **error** — add error handling component for project details (`2393f00d`, 2026-09-12)
- **payments** — improve manual payment modal validation and user experience (`b949e6c1`, 2026-09-12)
- **auth** — enhance refresh token handling and error responses (`0d27b72e`, 2026-09-12)
- **progress** — enhance project update functionality and loading states (`1782af70`, 2026-09-12)
- **payments** — enhance manual payment modal and error handling (`9aaa3dc9`, 2026-09-11)
- **messages** — enhance conversation queue with dynamic navigation and improved UI (`7fd814e2`, 2026-09-10)
- **media** — implement file preview functionality in media library (`7171cb8d`, 2026-09-10)
- **auth** — implement operator portal UI and enhance login experience (`b6bc6711`, 2026-09-08)
- **web** — redesign auth brand panel to match Nexus Fusion home (`dc311ff3`, 2026-09-08)
- **media** — enhance media management with user-specific document handling (`6836b26b`, 2026-09-08)
- **media** — enhance media management interface and upload functionality (`dd49ea9d`, 2026-09-07)
- **moderation** — implement message flagging and moderation features (`08049058`, 2026-09-07)
- **theme** — update theme handling and synchronization across applications (`72ab0623`, 2026-09-07)
- **web, admin** — enhance user menus and improve budget handling in requests (`2857df57`, 2026-09-06)
- **landing, web** — update CookieConsentBanner and enhance API response handling (`7b4d972c`, 2026-09-06)
- **motion** — introduce ZigReveal and SoftTilt animations for enhanced UI transitions (`08ee8148`, 2026-09-06)
- **landing** — integrate framer-motion and enhance UI components (`160984a0`, 2026-09-05)
- **ui** — raise dashboard parity across admin and client portals (`6fe2d6d8`, 2026-09-05)
- **admin** — densify command center with live queues and request volume (`af5cf5da`, 2026-09-05)
- **dashboards** — densify client portal and fix admin command center (`6f73dac4`, 2026-09-04)
- **admin** — finish Analytics hub with tabbed charts and exports (`774275d6`, 2026-09-04)
- **messaging** — full-page workspace with captions and quote replies (`d1bd07e1`, 2026-09-04)
- **ui** — unify client and admin dashboard list chrome (`2bfbfc96`, 2026-09-03)
- **ui** — introduce PctProgressFill component and update progress displays (`a7201b9f`, 2026-09-01)

### Fixed

- **security** — harden redirects, URLs, and CSP-safe UI (`6d089259`, 2026-09-28)
- **perf** — share queries and add missing dashboard routes (`e4b638b1`, 2026-09-24)
- **integrations** — add aria-labels to switches for better accessibility (`34ed73a0`, 2026-09-23)
- **openapi** — document admin company-legal payment routes (`d0090b96`, 2026-09-22)
- **audit** — repair route aliases and stop logout on transient refresh failures (`13e386d5`, 2026-09-22)
- **perf** — speed landing SSR and raise UI container resources (`502e2bab`, 2026-09-22)
- **styles** — adjust color tokens for WCAG AA compliance (`2e0a8c8a`, 2026-09-21)
- **audit** — close routing, notFound, and milestone KPI gaps (`6bea2693`, 2026-09-20)
- **audit** — validate GSTIN/PAN and restore settings billing route (`db669aa4`, 2026-09-20)
- **ui** — stop billing zeros-on-error and blank admin entity shells (`6e389739`, 2026-09-20)
- **payments** — show invoice generating state while document worker lags (`8cbb8531`, 2026-09-19)
- **seo** — stop baking localhost into prod redirects, sitemap, and verify UI (`9d88e26d`, 2026-09-18)
- **ui** — close public and auth audit gaps for Turnstile, landmarks, and chrome (`1d552b7f`, 2026-09-17)
- **blog** — update author name in BlogPostPreview and enhance list item styling in BlogMarkdown (`f3e6887d`, 2026-09-13)
- **api** — document admin project status history (`47914fef`, 2026-09-13)
- **quotes** — collapse duplicate quote history events (`4bb9cfd7`, 2026-09-12)
- **admin** — gate milestone submit and project completion (`4cd66110`, 2026-09-12)
- **ui** — humanize statuses and fix client request/quote/payment UX (`87b6a11c`, 2026-09-11)
- **contact** — unblock form submit and upgrade admin inquiries inbox (`eec44694`, 2026-09-10)
- **audit** — remediate external MPC UI, media, and a11y findings (`0c6b8e98`, 2026-09-09)
- **config** — avoid bare window check without DOM lib (`de894ace`, 2026-09-08)
- **audit** — hub redirects, DM composer, greeting, and checkout copy (`3d90d447`, 2026-09-06)
- **web** — separate profile/settings and harden client 2FA flows (`97ba862a`, 2026-09-05)
- **ui** — prevent select chevron overlap and polish admin hubs (`30b5cea2`, 2026-09-04)
- **audit** — close NL-UI-001/002, NL-PAY-004, and NL-HOST-001 (`d39e008d`, 2026-09-02)
- **payments** — retry Razorpay confirm and align test-card checkout help (`ba001c50`, 2026-09-02)
- **audit** — improve realtime messaging and quote-to-project UX (`02634f9c`, 2026-09-02)
- **audit** — remediate NL-CLIENT-003, NL-DATA-002, NL-ADMIN-005, and NL-UI-001 (`016889a9`, 2026-09-02)
- **payments** — improve admin milestone selection and progress display (`8ea75c05`, 2026-09-01)
- **payments** — reset form fields on modal open and improve deliverable refresh logic (`eb1cf720`, 2026-09-01)
- **audit** — replace dashboard chart and add cookie consent for CSP compliance (`f6d0a094`, 2026-09-01)
- **auth** — route bff login through local gateway and audit ui fixes (`47323551`, 2026-09-01)

### Changed

- **motion** — remove framer-motion dependency and implement custom motion components (`3a99b115`, 2026-09-29)
- **landing** — restructure landing page components and introduce HomeBelowFold (`a6cffa77`, 2026-09-29)
- **env** — sync example env files with Infisical keys (`32b059e4`, 2026-09-28)
- **security** — ignore real .env files and keep examples only (`66d34bd7`, 2026-09-28)
- remove outdated rules and guidelines files (`cdeeed4c`, 2026-09-25)
- **api** — streamline API proxy handling and remove build-time rewrites (`888f1102`, 2026-09-24)
- **docker** — scope one-app builds and document faster workflows (`bfaab5bd`, 2026-09-19)
- **dashboard** — optimize polling intervals and cache usage for dashboard queries (`c7cdd9b1`, 2026-09-14)
- **progress** — enhance loading state handling and improve timeline rendering (`a3282477`, 2026-09-11)
- **csp** — streamline content security policy for style sources (`f5fadd4e`, 2026-09-09)
- **openapi** — sync gateway spec for media, documents, and moderation (`c5e2211d`, 2026-09-08)
- **ui** — unify brand link and simplify NestlancerLogo (`2c4286d5`, 2026-09-07)

### Documentation

- **seed** — point the archived tracker at the backend seed runner (`cd78951c`, 2026-09-23)

---

## 2026-08

_55 commits_

### Added

- **payments** — add offline bank/UPI checkout and admin verification UI (`282c6c67`, 2026-08-26)
- **blog** — upgrade article page to editorial reading layout (`0ed51e6d`, 2026-08-25)
- **repo** — add frontend development guidelines (`1972a557`, 2026-08-16)
- **admin** — redesign Blog console with live post preview (`1e7b2059`, 2026-08-14)
- **media** — upgrade admin and user media libraries for enterprise DAM UX (`73fbbd75`, 2026-08-13)
- **system** — maintenance UX, System Config console, and OpenAPI refresh (`0d5fd9fd`, 2026-08-13)
- **messaging** — command-center inbox layout and shared dashboard footer (`7894cba4`, 2026-08-11)
- **messaging** — inbox actions, group UX, smart scroll, and remove emoji reactions (`60329e99`, 2026-08-10)
- **messaging** — redesign inbox and add live/waiting chat presence (`3c109d84`, 2026-08-07)
- **admin,web** — add admin version downloads and simplify client document UI (`8c9b8f9b`, 2026-08-01)

### Fixed

- **audit** — harden CSP nonce flow, auth cookies, and dashboard metadata (`1f369761`, 2026-08-31)
- **audit** — apply audit UI fixes and refresh api client (`0c60b362`, 2026-08-30)
- restore missing deps and tighten BFF auth cookie handling (`aef18f7e`, 2026-08-30)
- **audit** — remediate UI findings and refresh API client (`f12cd49b`, 2026-08-29)
- **auth** — isolate next/headers cookie reader for server routes (`5a780aaa`, 2026-08-28)
- **security** — remediate external audit findings for BFF and admin UX (`7db2e4a1`, 2026-08-28)
- **ui** — send app public links to apex and finish audit UX (`1fddb1ee`, 2026-08-27)
- **ui** — finish audit fixes for login portal, invoices, and CSP (`7910cc43`, 2026-08-27)
- **ui** — address external audit findings across app, admin, and landing (`0854f918`, 2026-08-26)
- **ui** — correct KPIs, Turnstile, and admin charts from prod QA (`9c8edf1b`, 2026-08-26)
- **payments** — stop dual-model billing double-count and clarify installments (`08ecb9f7`, 2026-08-26)
- **marketing** — align public product story and add production SEO (`7a298d17`, 2026-08-25)
- **config** — prefer API_UPSTREAM for SSR and point builds at app host (`9f5bf97c`, 2026-08-25)
- **docker** — point client app URLs at app.nestlancer.com (`3260b15c`, 2026-08-25)
- **auth** — gate BFF login by role and allow TLS-forwarded origins (`52f6d1c6`, 2026-08-24)
- **admin** — harden API verifiers and live Playwright against prod (`068a10f1`, 2026-08-23)
- **ci** — reset frontend compose volumes before Dev CD up (`eaa15d61`, 2026-08-20)
- **ci** — raise Frontend Dev CD SSH command timeout to 30m (`d08fcc04`, 2026-08-20)
- **ci** — ensure nestlancer-dev Docker network exists before compose up (`01c7950d`, 2026-08-20)
- **ci** — clone frontend deploy path on VPS if missing (`c8174458`, 2026-08-20)
- **web** — align mocked e2e assertions with current UI copy (`bc7d1e7f`, 2026-08-20)
- **web** — stop same-origin API rewrite loops in mocked e2e (`0f223458`, 2026-08-20)
- **ci** — mock session bootstrap in Playwright and use same-origin API (`d0b8c246`, 2026-08-20)
- **ci** — share dev API env vars with Playwright build job (`ea31ce33`, 2026-08-20)
- **ci** — set NEXT_PUBLIC_API_URL for production builds on runners (`c44eee38`, 2026-08-20)
- **ci** — pass API_UPSTREAM through Turbo for next lint (`8c5adce6`, 2026-08-20)
- **ci** — set API_UPSTREAM for next lint on GitHub runners (`5b0079c5`, 2026-08-20)
- **ci** — resolve ui lint error and add deployment guides (`5af90962`, 2026-08-20)
- **ci/cd** — isolate prod from dev for same-VPS coexistence (`1dc9b902`, 2026-08-19)
- **security** — harden frontend XSS, auth BFF, and API retries (`a6fbeb99`, 2026-08-16)
- **admin** — rename CMS Publisher to Blog for clearer operator UX (`38e22f41`, 2026-08-13)
- **admin** — improve audit logs page and refresh OpenAPI (`6a1253a7`, 2026-08-07)
- **payments** — show linked installment status for multi-step quote schedules (`79e37a00`, 2026-08-02)
- **web,admin** — improve project hub sticky layout and payment document downloads (`3287e95a`, 2026-08-01)

### Changed

- **api** — sync OpenAPI and regenerate client for dual-path payments (`0f309430`, 2026-08-26)
- **footer** — streamline footer component structure and improve accessibility (`a751f426`, 2026-08-25)
- **api-client** — regenerate Orval client from refreshed OpenAPI (`59fa5d0e`, 2026-08-23)
- **openapi** — refresh spec and regenerate client from production API (`9a04c499`, 2026-08-22)
- **docker** — add standalone prod builds and GHCR CD pipeline (`14dc921e`, 2026-08-18)
- **docker** — enable full-app watch on the 24GB VPS (`32ac8b42`, 2026-08-18)
- **docker** — update resource limits and memory settings for development (`ba70a907`, 2026-08-17)
- **docker** — retune frontend limits for the 8c/24GB VPS (`73bc508c`, 2026-08-15)
- **openapi** — add admin document version download endpoint (`edd96bfe`, 2026-08-01)

### Documentation

- update deployment guides with current status and improved clarity (`1de13962`, 2026-08-21)

### Removed

- **docker** — restore compose, Dockerfiles, and scripts to pre-VPS-tune state (`45092333`, 2026-08-17)

---

## 2026-07

_13 commits_

### Added

- **payments** — add client milestone display and payment-aware status UI (`5c642fd6`, 2026-07-31)
- **messaging** — redesign admin inbox queue and chat dock (`f8adc53d`, 2026-07-25)
- **quotes** — add service agreement preview, signing flow, and admin contract download (`2e7c5d74`, 2026-07-24)
- **quotes** — rebuild admin quote builder and show terms on client pages (`4c310b4e`, 2026-07-23)
- **admin** — sync Flow Plan v2 UI with backend quote and capacity APIs (`1c80af65`, 2026-07-19)
- **env** — update development environment configuration and API endpoints (`17169a71`, 2026-07-18)
- **docker** — harden dev/prod compose for 6c/12GB VPS (`8d29c65d`, 2026-07-17)

### Fixed

- **profile,payments** — save profile fields and prefill Razorpay contact (`56d67def`, 2026-07-30)
- **payments** — gate admin/client UI for pay-only milestones (`f751ffa5`, 2026-07-20)
- **openapi** — align notification channels examples for Spectral (`38ae2c7f`, 2026-07-19)

### Changed

- **api-client** — refresh OpenAPI for contract preview and admin download routes (`8d55d12b`, 2026-07-24)
- **api-client** — refresh OpenAPI for seed-safe admin APIs (`e39a8c4f`, 2026-07-19)
- **env** — restore dev API URLs to https://dev-api.nestlancer.com (`0bb53e0a`, 2026-07-19)

---

## 2026-06

_64 commits_

### Added

- **config** — update build outputs and metadata configuration (`820fcf11`, 2026-06-16)
- **admin** — add payment detail, operator profile, and shared UI components (`c8ca1253`, 2026-06-15)
- **admin** — enhance admin console layout and styling (`3f7c5ab2`, 2026-06-15)
- **web** — enhance public portfolio pages and showcase components (`c7d0ed58`, 2026-06-13)
- **admin** — add portfolio media panel and project bridge UI (`03d3d8c6`, 2026-06-13)
- **admin** — enhance media management clients and page wiring (`5656329c`, 2026-06-12)
- **admin** — add media detail drawer, storage browser, and dialogs (`00d3d76c`, 2026-06-12)
- **api-client** — expand media admin and share client methods (`b5b670ec`, 2026-06-12)
- **admin** — add media types, hooks, and shared UI primitives (`9c8d48a6`, 2026-06-12)
- **web** — add progress timeline view and project hub progress tab (`c7bb528a`, 2026-06-12)
- **web** — add live document panels and quote payment document actions (`3c9fa9a2`, 2026-06-12)
- **admin** — add duplicate-from-template project wizard (`821d7ef4`, 2026-06-12)
- **admin** — refactor project detail into tabbed delivery and progress panels (`f2bb1d07`, 2026-06-12)
- **admin** — add live document panels and version browsing (`b0810630`, 2026-06-12)
- **api-client** — regenerate client for template wizard and admin document APIs (`3546935c`, 2026-06-12)
- **utils** — add shared progress entry helpers and document icon (`81cddcd2`, 2026-06-12)
- **landing** — refresh blog, contact, and homepage web-app links (`a634f506`, 2026-06-11)
- **admin** — wire notifications, portfolio, system ops, and layout polish (`f8bb41fa`, 2026-06-11)
- **admin** — improve quote templates, pipeline tabs, and INR quote forms (`3b1edb48`, 2026-06-11)
- **admin** — add project payments hub and disputes section (`e0ed5589`, 2026-06-11)
- **admin** — add floating chat dock, direct messages, and inbox context rail (`0d040e71`, 2026-06-11)
- **web** — update dashboard shell, quotes, settings, and public blog feeds (`360a7810`, 2026-06-11)
- **web** — enhance project hub deliverables, milestones, and status panels (`93960e32`, 2026-06-11)
- **web** — align payments with INR Razorpay checkout and milestone mapping (`3928ff1d`, 2026-06-11)
- **web** — add floating chat dock and inbox context rail (`3d5ea2d5`, 2026-06-11)
- **constants** — standardize INR currency and expand shared platform maps (`66c1b64f`, 2026-06-11)
- **api-client** — regenerate gateway OpenAPI client after route remediation (`5a7f63b4`, 2026-06-11)
- **theme** — add scrollbar styles and update imports across applications (`df582106`, 2026-06-09)
- update AdminConsoleLayout sidebar header branding and design for improved responsiveness (`c4e7eb7c`, 2026-06-09)
- **notifications** — add admin inbox, shared UI registry, and realtime unread sync (`c1ec77da`, 2026-06-08)
- **documents** — add invoices, document verification, and API client integration (`5b2bdde3`, 2026-06-08)
- **assets** — add new icons and logos for landing and admin applications (`7c7857cb`, 2026-06-08)
- **landing** — enhance styling and layout for editorial sections (`b4a2b8c8`, 2026-06-07)
- **web** — surface payment-gated milestone states in hub and admin (`4b077839`, 2026-06-02)
- **deploy** — add K3s overlays, cert-manager, and deploy automation (`dd1a2a10`, 2026-06-01)
- **deploy** — standardize production images on GHCR and add K3s/CD pipeline (`1ac8995e`, 2026-06-01)
- **web** — adopt Orval hooks for quotes, payments, and projects (`933bb271`, 2026-06-01)
- **web** — realign studio product copy and add frontend CI (`f0f7bc11`, 2026-06-01)

### Fixed

- resolve TypeScript build failures across admin and web (`9f2ef825`, 2026-06-13)
- **api-client** — align portfolio media service paths with OpenAPI contract (`28027831`, 2026-06-13)
- **web** — update media library and share modal for share purpose (`fdb2543d`, 2026-06-12)
- **web** — improve client API view helpers for document URLs (`d4ae4b96`, 2026-06-12)
- **api-client** — remove stale project templates service paths (`c9b9605f`, 2026-06-11)
- **ui** — swap favicon by OS theme for Chrome-compatible icons (`2874fed9`, 2026-06-09)
- **build** — restore production builds and CI type-check (`ae9fe22b`, 2026-06-08)
- **web** — show blog cover images and improve post SEO metadata (`18c35446`, 2026-06-05)
- **web** — finish studio copy realignment and refresh OpenAPI client (`d166af24`, 2026-06-01)

### Changed

- **api-client** — regenerate models and update OpenAPI documentation (`dea54eea`, 2026-06-15)
- **api-client** — regenerate client and update models based on OpenAPI spec (`52400e1f`, 2026-06-13)
- **api-client** — regenerate client from synced portfolio OpenAPI spec (`c907b65e`, 2026-06-13)
- **openapi** — sync gateway spec and regenerate portfolio API client (`481ec487`, 2026-06-13)
- **openapi** — sync gateway spec and regenerate admin media client (`054d8067`, 2026-06-12)
- **openapi** — sync gateway spec and regenerate admin API client (`89569db4`, 2026-06-12)
- **docker** — align dev compose with backend service updates (`b3642f9e`, 2026-06-12)
- **layouts** — remove static favicon links and inject via JS for hydration compatibility (`22a53c5f`, 2026-06-09)
- **deploy** — standardize API host, Caddy proxy, and Infisical env flow (`e9480f93`, 2026-06-03)
- **ci** — publish production images only on release (`f682393e`, 2026-06-02)
- relax gitignore for private repo disaster recovery (`630ca193`, 2026-06-01)
- **config** — consolidate env files at repo root for Infisical (`23e66414`, 2026-06-01)

### Documentation

- add frontend implementation audit reference (`3bd258c1`, 2026-06-11)
- **readme** — add frontend beginner guide and runbook references (`1c493201`, 2026-06-02)
- reorganize guides and standardize markdown format (`7819ca7a`, 2026-06-01)
- add master implementation tracker as single source of truth (`a3814b12`, 2026-06-01)

### Tests

- **ci** — expand CI coverage and harden requests/auth flows (`9be6df30`, 2026-06-01)

---

## 2026-05

_80 commits_

### Added

- **web** — migrate client portal to TailAdmin design system (`7022067c`, 2026-05-31)
- **admin** — unify console UI theming, layout, and status components (`30d8255d`, 2026-05-31)
- **admin** — add user and project pipeline hub views (`f3e0ea48`, 2026-05-31)
- **admin** — migrate console to Gentelella UI and add pipeline hub (`bee7cd4a`, 2026-05-30)
- **web** — unify public routes and add visual regression coverage (`5e8c6b02`, 2026-05-30)
- **blog** — rebuild listing and article layouts with sidebar navigation (`b184f244`, 2026-05-30)
- **portfolio** — enhance portfolio timeline and content security policy integration (`ce611a60`, 2026-05-29)
- **api-client** — update API client and hooks for enhanced functionality (`58e4f9df`, 2026-05-29)
- **api-client** — normalize pulled spec and regenerate client (`eefbc39d`, 2026-05-29)
- **api-client** — regenerate from merged OpenAPI and align contract tooling (`0b4e197e`, 2026-05-29)
- **web,admin,ui** — ship shared UI upgrade, telemetry, and mocked e2e coverage (`6d33e468`, 2026-05-28)
- **api-client** — enhance authentication and blog features (`a5199568`, 2026-05-26)
- **admin,web** — content management and public blog experience (`4310828d`, 2026-05-26)
- implement global theme toggle and animated background components across admin portal pages (`e0966f48`, 2026-05-26)
- remove obsolete demo assets and documentation while updating analytics client integration. (`1bcecc8a`, 2026-05-25)
- standardize dashboard UI components and introduce unified design system (`75ce753c`, 2026-05-24)
- **admin,media** — portfolio admin UI, presigned downloads, and API drift checks (`048cce52`, 2026-05-24)
- **messaging** — enhance file message handling and upload functionality (`f4004960`, 2026-05-24)
- **admin** — enhance media management with tabbed interface and new components (`5f9c11fc`, 2026-05-24)
- **media** — admin quarantine UI, chunked upload client, and public share pages (`7ef070cc`, 2026-05-23)
- **web,admin** — integrate @radix-ui/react-tooltip and update form components (`cded5dc4`, 2026-05-23)
- **web,admin** — add field-help package and wire contextual form tooltips (`3175a46b`, 2026-05-23)
- **web,admin** — milestone gates, paise display, deliverable review, and admin ops console (`42c81855`, 2026-05-22)
- **web** — Razorpay checkout UX, test-payment docs, and payment console polish (`47ba2335`, 2026-05-22)
- **web,admin** — payments console, checkout flows, and API client gap fixes (`906925a1`, 2026-05-21)
- **web,admin** — regenerate Orval client from full OpenAPI and wire gap-analysis UI flows (`49bfcec8`, 2026-05-21)
- **admin** — add requests and quotes console with realtime sync and 2FA fixes (`6b39cf08`, 2026-05-21)
- **admin** — integrate Playwright for end-to-end testing and enhance user management features (`ad442e39`, 2026-05-20)
- **web,admin,landing** — standardize env files and add production compose (`44ef434d`, 2026-05-17)
- **web,admin** — 2FA login, Razorpay checkout, auth BFF, and feature gaps (`e56f3e6e`, 2026-05-17)
- **dashboard** — use aggregated BFF summary and simplify admin overview (`2f295590`, 2026-05-16)
- **web** — premium client auth, dashboard shell, and account UX (`eb7ec83c`, 2026-05-16)
- **admin** — overhaul operator console with Tremor dashboards and theming (`529a7799`, 2026-05-15)
- **messaging** — add admin and client chat threads with realtime updates (`9da2b14a`, 2026-05-15)
- enhance dashboard functionality with new messaging and notifications components (`df2d72ff`, 2026-05-14)
- enhance admin dashboard components and improve data handling (`3f40b4bb`, 2026-05-14)
- enhance admin dashboard with new routes and client components (`05c5d820`, 2026-05-14)
- implement logout functionality and enhance API client for session management (`ca3fa94c`, 2026-05-14)
- add multi-subdomain Nginx configuration and standardize dev environment URLs for web, admin, and landing apps (`6db97b8f`, 2026-05-13)
- enhance admin application with new features and dependencies (`fd9fb7bf`, 2026-05-13)
- enhance WebSocket integration with authenticated socket provider (`d048f154`, 2026-05-12)
- add Docker support for development environment and Nginx configuration (`c1575e69`, 2026-05-12)
- implement AdminWireframeSections component for dashboard pages (`898c5058`, 2026-05-12)
- implement dark mode support with theme provider and toggle component (`27a46969`, 2026-05-12)
- update Nestlancer frontend structure and configurations (`e5b3dc0a`, 2026-05-11)
- initialize Nestlancer frontend monorepo structure with essential configurations (`dfa37844`, 2026-05-11)
- add foundational documentation for Nestlancer frontend implementation (`215929cd`, 2026-05-11)
- enhance wireframe documentation with new sections for media management, payments disputes, system configuration, user account security, and payment history (`4e738eb9`, 2026-05-10)
- expand architecture documentation and add new web page assumptions (`fa6e31c5`, 2026-05-10)
- add dockerized development environment with multi-service support and npm scripts (`72599d58`, 2026-05-09)
- enhance admin and landing applications with new features and configurations (`d93ccc47`, 2026-05-09)
- Phase 13 — Testing, performance & deployment config (`e7436fc3`, 2026-05-08)
- implement Phase 12 progress tracking and admin webhooks management (`f8542638`, 2026-05-08)
- implement Phase 10-11 public platform features and admin dashboard foundation (`02cf93d9`, 2026-05-08)
- implement Phase 8-9 payments/media and profile/portfolio/settings modules (`bea39e9e`, 2026-05-08)
- implement Phase 6-7 requests/quotes workflows and realtime messaging/notifications (`50a80217`, 2026-05-08)
- implement Phase 3-5 auth flow, dashboard shell, and projects module (`8c3f4a3c`, 2026-05-08)
- implement Phase 1 (foundation) and Phase 2 (API layer) (`2d5ab454`, 2026-05-08)

### Fixed

- **payments** — admin refund fixes, client refund UI, and debug logging (`20c165c6`, 2026-05-31)
- **web** — client view recording, engagement UI, and API client sync (`41bebe48`, 2026-05-31)
- **security** — keep secrets out of URLs for client and admin auth (`d07d6bcb`, 2026-05-31)
- **admin** — correct data display and harden API verification (`bfc78efb`, 2026-05-31)
- **api-client** — sync OpenAPI mirror and skip prettier on contract JSON (`17aaf1d7`, 2026-05-29)
- **utils** — guard optional IP parse segments for strict TypeScript (`f1e851b1`, 2026-05-23)
- **api-client** — regenerate OpenAPI client after Swagger documentation tag change (`a49c48b2`, 2026-05-15)
- resolve phase 1-12 implementation gaps and admin app structure (`efa12e13`, 2026-05-08)

### Changed

- **commitlint** — update configuration and Husky hooks (`2518791c`, 2026-05-29)
- **api-client** — regenerate from gateway merged OpenAPI spec (`71566980`, 2026-05-29)
- **admin** — streamline dependencies and integrate @nestlancer/ui components (`71c4ebbb`, 2026-05-27)
- overhaul dashboard and admin top navigation headers with consistent accent gradients and enhanced layout components (`4f32896d`, 2026-05-25)
- centralize auth UI copy in a new constants module and improve cross-portal login redirection toasts (`bbd70401`, 2026-05-14)
- remove portfolio pages and update middleware configuration (`216f50d4`, 2026-05-12)
- remove codebase and associated configuration files (`5ed38168`, 2026-05-09)
- rename pipeline to tasks in turbo.json for clarity (`36a77ca8`, 2026-05-08)
- update development ports and add TypeScript environment files (`7efaedaf`, 2026-05-08)
- Initialize Nestlancer frontend monorepo with Next.js 14, TypeScript, and Tailwind CSS. Set up project structure, environment variables, ESLint, Prettier, and CI/CD workflows. Add admin and landing … (`64b01951`, 2026-05-08)

### Documentation

- add theme design system and update wireframe documentation to reference Google Stitch patterns (`e6fafeba`, 2026-05-12)
- refactor wireframe documentation by splitting individual pages into separate markdown files (`70c0d58c`, 2026-05-10)
- add architectural documentation for Nestlancer frontend (`0db797ab`, 2026-05-09)

### Tests

- **admin** — add API contract verification and live page E2E coverage (`67fda45c`, 2026-05-31)

---
