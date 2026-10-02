# Nestlancer Frontend Implementation Audit

> Backend reference: `../nestlancer-backend-api/docs/FEATURE-INVENTORY.md`  
> Generated: 2026-06-10 | Re-audited: 2026-06-10 | **Post-remediation: 2026-06-10**  
> Method: code audit of **85 routes**, features, `packages/api-client`, middleware, e2e tests  
> Parity report: `../../FEATURE-PARITY-ANALYSIS-REPORT.md`

---

## Summary

| Metric                             | Before |    After |
| ---------------------------------- | -----: | -------: |
| **Total backend features audited** |    144 |      144 |
| **✅ Fully implemented**           |     97 | **~118** |
| **⚠️ Partial**                     |     27 |  **~14** |
| **❌ Missing**                     |      9 |   **~5** |
| **🔀 Wrong app**                   |      2 |    **0** |
| **🐛 Incorrect**                   |      3 |    **0** |

**Remediation:** Phases 0–5 complete per [FEATURE-PARITY-FIX-PLAN.md](../../FEATURE-PARITY-FIX-PLAN.md). All P1 gaps closed. Open: OAuth, Orval adoption, pin/unpin messages, announcements/maintenance UI, extended E2E.

### App route counts

| App            | `page.tsx` routes |                         Feature modules | E2E specs |
| -------------- | ----------------: | --------------------------------------: | --------: |
| `apps/web`     |                44 |  140+ files in `apps/web/src/features/` |         5 |
| `apps/admin`   |                30 | 50+ files in `apps/admin/src/features/` |         7 |
| `apps/landing` |                 6 |            minimal marketing components |   1 smoke |

### API client wiring

| Layer                     | Path                                                        | Usage                                                          |
| ------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| Facade services           | `packages/api-client/src/services/*.service.ts`             | Primary — both apps call `apiServices.*`                       |
| Orval react-query hooks   | `packages/api-client/src/generated/react-query/`            | Partial — web hooks for requests/quotes/projects/payments only |
| Orval generated (partial) | `push-subscriptions`, `notification-preferences` (channels) | Facades wired; Orval hooks still mostly unused (P2-007)        |
| Direct gateway fetch      | `apps/web/src/lib/gateway-fetch.ts`                         | SSR public pages (portfolio, work, homepage)                   |

### WebSocket usage

| Hook                         | Wired in                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `useNotificationsRealtime`   | `apps/web/src/components/sync/RequestsQuotesRealtimeSync.tsx`, `apps/admin/src/components/sync/RequestsQuotesRealtimeSync.tsx` |
| `useMessagingRoom`           | Web + admin message thread clients                                                                                             |
| `usePresence`                | `apps/web/src/features/messaging/MessageThreadClient.tsx`                                                                      |
| `useProjectProgressRealtime` | `apps/web/src/features/progress/ProgressTimelineClient.tsx`                                                                    |
| `WebSocketProvider`          | `AppProviders.tsx`, `AdminProviders.tsx`                                                                                       |

---

## Problems by Severity

### P0 — Critical

_None._ Core flows functional.

### P1 — High

_All resolved (2026-06-10)._

| ID     | Resolution                                                               |
| ------ | ------------------------------------------------------------------------ |
| P1-001 | ✅ `apps/admin/src/middleware.ts` — `/pipeline`, `/notifications`        |
| P1-002 | ✅ `apps/web/src/middleware.ts` — `/invoices`                            |
| P1-003 | ✅ `AdminNotificationsClient.tsx` — Send/Broadcast/Segment/Delivery tabs |
| P1-004 | ✅ `AdminDisputesSection.tsx` in `PaymentsClient.tsx`                    |
| P1-005 | ✅ Landing redirects via `webAppUrl()`                                   |
| P1-006 | ✅ `push.service.ts` → `/push-subscription`; gateway route added         |

### P2 — Medium (open: 3)

| ID     | Issue                                             | Status                                                        |
| ------ | ------------------------------------------------- | ------------------------------------------------------------- |
| P2-001 | OAuth/social login missing                        | ⏳ Open                                                       |
| P2-002 | Admin quote templates, resend, duplicate, history | ✅ `AdminQuoteTemplatesPanel`, `QuoteDetailClient`            |
| P2-003 | Email template preview/test                       | ✅ `SystemClient.tsx`                                         |
| P2-004 | Web activity log settings tab                     | ✅ `/settings/activity`, `SettingsActivityClient`             |
| P2-005 | Web push endpoint + VAPID                         | ✅ Fixed endpoint; VAPID env still required for delivery      |
| P2-006 | Admin `/notifications` in E2E                     | ✅ `admin-pages.live.spec.ts`                                 |
| P2-007 | Orval hooks mostly unused                         | ⏳ Open                                                       |
| P2-008 | Landing homepage placeholders                     | ⏳ Open (redirects done)                                      |
| P2-009 | `routes.invoiceDetail` drift                      | ✅ → `/payments/invoice/:id`                                  |
| P2-010 | Notification channel preferences                  | ✅ `SettingsNotificationsClient` + `notifications.service.ts` |

### P3 — Low (open: ~6)

| ID     | Issue                                       | Status                                      |
| ------ | ------------------------------------------- | ------------------------------------------- |
| P3-001 | Duplicate marketing web + landing           | ⚠️ Mitigated by redirects                   |
| P3-002 | `logoutAll` / `checkEmail`                  | ✅ `SettingsSecurityClient`, `RegisterForm` |
| P3-003 | Webhook delivery history                    | ✅ `IntegrationsClient.tsx` drawer          |
| P3-004 | Blog tag merge / authors / revision restore | ✅ `ContentClient` Taxonomy tab             |
| P3-005 | System broadcast to project thread          | ✅ `AdminProjectThreadClient.tsx`           |
| —      | Message pin/unpin                           | ⏳ Open                                     |
| —      | RSS feed page (metadata only)               | ⚠️ `blog/layout.tsx` alternates             |
| —      | Extended E2E coverage                       | ⏳ Open                                     |

---

## Detailed Findings

### Auth

#### [BE-AUTH-001] User Registration

- **Backend ref:** §1.1
- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `apps/web/src/app/(auth)/register/page.tsx` → `features/auth/components/RegisterForm.tsx`
- **API:** `apiServices.auth.register`
- **Issues:** none

#### [BE-AUTH-002] Login

- **Backend ref:** §1.2
- **Expected app:** web + admin
- **Status:** ✅ Implemented
- **Location:** `apps/web/src/app/(auth)/login/page.tsx` → `LoginForm.tsx`; `apps/admin/src/app/(auth)/login/page.tsx` → `useAdminLogin.ts`
- **API:** `apiServices.auth.login` → BFF `POST /api/auth/login`
- **Role alignment:** ✅ Web blocks ADMIN; admin blocks non-admin
- **Issues:** none

#### [BE-AUTH-003] Token Refresh

- **Expected app:** web + admin
- **Status:** ✅ Implemented
- **Location:** `SessionBootstrap.tsx`, `AdminSessionBootstrap.tsx`
- **API:** BFF `POST /api/auth/refresh`

#### [BE-AUTH-004] Logout

- **Expected app:** web + admin
- **Status:** ✅ Implemented
- **Location:** `NavbarUserMenu.tsx`, `AdminUserMenu.tsx`
- **API:** `auth.logout`

#### [BE-AUTH-005] Logout All

- **Expected app:** web (settings)
- **Status:** ✅ Implemented
- **Location:** `SettingsSecurityClient.tsx` — logout all sessions button
- **API:** `auth.logoutAll`

#### [BE-AUTH-006] Two-Factor Verification

- **Expected app:** web + admin
- **Status:** ✅ Implemented
- **Location:** `TwoFactorChallengeForm.tsx`; `SettingsSecurityClient.tsx`
- **API:** `auth.verify2FA`, `users.enable2FA`, `disable2FA`, `regenerateBackupCodes`

#### [BE-AUTH-007] Email Verification

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `apps/web/src/app/(auth)/verify-email/page.tsx` → `VerifyEmailClient.tsx`
- **API:** `auth.verifyEmail`, `auth.resendVerification`

#### [BE-AUTH-008] Password Reset

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `forgot-password/page.tsx`, `reset-password/page.tsx`
- **API:** `auth.forgotPassword`, `auth.resetPassword`

#### [BE-AUTH-009] Email Availability Check

- **Expected app:** web (register)
- **Status:** ✅ Implemented
- **Location:** `RegisterForm.tsx` — debounced availability check on blur
- **API:** `auth.checkEmail` with Turnstile token

---

### Users

#### [BE-USERS-001] Profile CRUD

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `profile/page.tsx` → `ProfileViewClient.tsx`; `profile/edit/page.tsx` → `ProfileEditClient.tsx`
- **API:** `users.getProfile`, `updateProfile`, `uploadAvatar`, `removeAvatar`

#### [BE-USERS-002] Avatar Management

- **Expected app:** web
- **Status:** ✅ Implemented (via profile edit)
- **API:** `users.uploadAvatar`, `removeAvatar`

#### [BE-USERS-003] User Preferences

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `settings/account/page.tsx` → `SettingsAccountClient.tsx`
- **API:** `users.getPreferences`, `updatePreferences`

#### [BE-USERS-004] Password Change

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `settings/security/page.tsx` → `SettingsSecurityClient.tsx`
- **API:** `users.changePassword`

#### [BE-USERS-005] Two-Factor Management

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `SettingsSecurityClient.tsx`
- **API:** 2FA enable/verify/disable/regenerate

#### [BE-USERS-006] Session Management

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `SettingsSecurityClient.tsx`
- **API:** `listSessions`, `deleteSession`, `terminateOtherSessions`

#### [BE-USERS-007] Account Deletion

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `SettingsAccountClient.tsx`
- **API:** `requestAccountDeletion`, `cancelDeletion`

#### [BE-USERS-008] Activity Log

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `settings/activity/page.tsx` → `SettingsActivityClient.tsx`
- **API:** `users.getActivityLog`

#### [BE-USERS-009] Data Export (GDPR)

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `SettingsAccountClient.tsx`
- **API:** `requestDataExport`, `downloadDataExport`

#### [BE-USERS-010] Dashboard Summary

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `dashboard/page.tsx` → `DashboardOverview.tsx`
- **API:** `users.getDashboardSummary`

#### [BE-USERS-011] Admin User Management

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `users/page.tsx` → `UsersListClient.tsx`; `users/[id]/page.tsx` → `UserDetailClient.tsx`
- **API:** `admin.listUsers`, `changeUserRole`, `bulkUserOperations`, `startImpersonation`, etc.
- **E2E:** `admin-users.live.spec.ts`

#### [BE-USERS-012] Admin Security Operations

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `UserDetailClient.tsx` — force reset, terminate sessions
- **API:** admin security endpoints

#### [BE-USERS-013] Admin Audit Logs

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `audit/page.tsx` → `AuditClient.tsx`
- **API:** audit logs, security stats

---

### Requests

#### [BE-REQ-001] Create Request

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `requests/new/page.tsx` → `NewRequestClient.tsx`
- **API:** `features/requests/hooks/useRequestsApi.ts`
- **WS:** `RequestsQuotesRealtimeSync.tsx`

#### [BE-REQ-002] List/Read/Stats

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `requests/page.tsx` → `RequestsListClient.tsx`; `requests/[id]/page.tsx` → `RequestDetailClient.tsx`

#### [BE-REQ-003] Update/Delete Draft

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `RequestDetailClient.tsx`

#### [BE-REQ-004] Submit Request

- **Expected app:** web
- **Status:** ✅ Implemented
- **API:** submit mutation in `useRequestsApi.ts`

#### [BE-REQ-005] Status Tracking

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `RequestDetailClient.tsx` — status timeline

#### [BE-REQ-006] Attachments

- **Expected app:** web
- **Status:** ✅ Implemented
- **API:** attachment upload/list/delete in requests hooks

#### [BE-REQ-007] Linked Quotes

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `RequestDetailClient.tsx` — linked quotes section

#### [BE-REQ-008] Admin Request Ops

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `RequestsClient.tsx`, `RequestDetailClient.tsx`, `AdminCreateQuoteForm.tsx`
- **API:** assign, notes, create quote, send quote

---

### Quotes

#### [BE-QUOTE-001] Client Quote View

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `quotes/page.tsx` → `QuotesListClient.tsx`; `quotes/[id]/page.tsx` → `QuoteDetailClient.tsx`
- **API:** `features/quotes/hooks/useQuotesApi.ts`

#### [BE-QUOTE-002] Quote Actions

- **Expected app:** web
- **Status:** ✅ Implemented
- **API:** accept, decline, requestChanges

#### [BE-QUOTE-003] Quote PDF

- **Expected app:** web
- **Status:** ✅ Implemented
- **API:** `quotes.getPdfDownloadUrl`

#### [BE-QUOTE-004] Quote Documents

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `DocumentVersionsCard.tsx` in quote detail

#### [BE-QUOTE-005] Admin Quote CRUD

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `QuotesClient.tsx`, `QuoteDetailClient.tsx`, `AdminEditQuoteForm.tsx`

#### [BE-QUOTE-006] Admin Quote Workflow

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `QuoteDetailClient.tsx` — resend, duplicate, revision history
- **API:** `resendQuote`, `duplicateAdminQuote`, `getAdminQuoteHistory`

#### [BE-QUOTE-007] Quote Templates

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminQuoteTemplatesPanel.tsx` in `QuotesClient.tsx`
- **API:** `getAdminQuoteTemplates`, `createAdminQuoteTemplate`

---

### Projects

#### [BE-PROJ-001] Client Projects

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `projects/page.tsx` → `ProjectsListClient.tsx`; `projects/[id]/page.tsx` → `ProjectDetailClient.tsx`
- **WS:** `useProjectProgressRealtime`

#### [BE-PROJ-002] Project Sub-resources

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** Hub tabs — milestones, deliverables, payments, messages, files

#### [BE-PROJ-003] Client Actions

- **Expected app:** web
- **Status:** ✅ Implemented
- **API:** approve, request-revision, feedback

#### [BE-PROJ-004] Project Messaging

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** Project hub messages tab + `messages/` routes

#### [BE-PROJ-005] Public Showcase

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `apps/web/src/app/(public)/work/page.tsx`

#### [BE-PROJ-006] Admin Project CRUD

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `ProjectsClient.tsx`, `AdminProjectDetailClient.tsx`

#### [BE-PROJ-007] Admin Team

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminProjectOpsSection.tsx` — assign/remove admin user

#### [BE-PROJ-008] Admin Lifecycle

- **Expected app:** admin
- **Status:** ✅ Implemented
- **API:** archive, duplicate, extend, export

#### [BE-PROJ-009] Admin Analytics

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminProjectDetailClient.tsx` — project + progress analytics panels

#### [BE-PROJ-010] Admin Milestones

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminProjectOpsSection.tsx`

---

### Progress

#### [BE-PROG-001] Progress Timeline

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `ProgressTimelineClient.tsx`
- **WS:** `useProjectProgressRealtime`

#### [BE-PROG-002] Progress Entry

- **Expected app:** web
- **Status:** ✅ Implemented
- **API:** `requestProjectChanges`

#### [BE-PROG-003] Milestone Approvals

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `ProjectHubMilestonesTab.tsx`

#### [BE-PROG-004] Deliverable Reviews

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `ProjectHubDeliverablesTab.tsx`

#### [BE-PROG-005] Admin Progress

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminProjectOpsSection.tsx` — edit/delete progress entries

#### [BE-PROG-006] Admin Deliverables

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminProjectOpsSection.tsx`

#### [BE-PROG-007] Admin Milestones

- **Expected app:** admin
- **Status:** ✅ Implemented

---

### Payments

#### [BE-PAY-001] Payment Intent / Checkout

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `PaymentCheckoutPanel.tsx`, `usePaymentCheckout.ts`
- **E2E:** `payment-checkout.mocked.spec.ts`

#### [BE-PAY-002] Payment Queries

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `PaymentsListClient.tsx`, `PaymentDetailClient.tsx`

#### [BE-PAY-003] Payment Milestones

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** Project hub payments tab

#### [BE-PAY-004] Payment Documents

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `DocumentVersionsCard.tsx` in payment detail

#### [BE-PAY-005] Disputes (user)

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `PaymentDetailClient.tsx` — `fileDispute`

#### [BE-PAY-006] Cancel Payment

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `PaymentDetailClient.tsx` — prominent cancel in sidebar

#### [BE-PAY-007] Payment Methods

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `payments/methods/page.tsx` → `PaymentMethodsClient.tsx`

#### [BE-PAY-008] Invoices

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `invoices/page.tsx` → `InvoicesListClient.tsx`
- **Middleware:** ✅ protected in `middleware.ts`

#### [BE-PAY-009] Razorpay Webhook

- **Expected app:** none (backend only)
- **Status:** N/A

#### [BE-PAY-010] Admin Payments

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `PaymentsClient.tsx`

#### [BE-PAY-011] Admin Milestone Payments

- **Expected app:** admin
- **Status:** ✅ Implemented
- **API:** mark-complete, request-payment, release

#### [BE-PAY-012] Admin Disputes

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminDisputesSection.tsx` in `PaymentsClient.tsx`
- **API:** `listPaymentDisputes`, `respondDispute`

#### [BE-PAY-013] Admin Revenue

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AnalyticsClient.tsx` — revenue export action
- **API:** `exportRevenue`

---

### Messaging

#### [BE-MSG-001] Send Messages

- **Expected app:** web + admin
- **Status:** ✅ Implemented
- **Location:** `MessageThreadClient.tsx`, `AdminProjectThreadClient.tsx`
- **WS:** `useMessagingRoom`

#### [BE-MSG-002] Read Messages

- **Expected app:** web + admin
- **Status:** ✅ Implemented

#### [BE-MSG-003] Message CRUD

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `MessageThreadClient.tsx` — edit/delete on own messages

#### [BE-MSG-004] Reactions

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `MessageThreadClient.tsx` — emoji react buttons

#### [BE-MSG-005] Read Receipts

- **Expected app:** web + admin
- **Status:** ✅ Implemented (implicit via thread read)

#### [BE-MSG-006] Pin/Unpin

- **Expected app:** web + admin
- **Status:** ❌ Missing

#### [BE-MSG-007] Attachments

- **Expected app:** web + admin
- **Status:** ✅ Implemented
- **API:** media upload in message compose

#### [BE-MSG-008] Thread Replies

- **Expected app:** web + admin
- **Status:** ✅ Implemented

#### [BE-MSG-009] Conversations

- **Expected app:** web + admin
- **Status:** ✅ Implemented
- **Location:** `ConversationsListPanel.tsx`, `AdminMessagesInboxClient.tsx`

#### [BE-MSG-010] Chat Threads

- **Expected app:** web + admin
- **Status:** ✅ Implemented
- **Location:** `messages/thread/[threadId]/page.tsx`; admin group chat

#### [BE-MSG-011] Message Threads

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `MessageThreadClient.tsx` — replies panel + `replyInThread`

#### [BE-MSG-012] Admin Messaging

- **Expected app:** admin
- **Status:** ✅ Implemented

#### [BE-MSG-013] Admin Flagged Messages

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `moderation/page.tsx` → `ModerationClient.tsx`

#### [BE-MSG-014] System Broadcast to Project

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminProjectThreadClient.tsx` — system broadcast panel
- **API:** `broadcastSystemMessage`

---

### Notifications

#### [BE-NOTIF-001] In-App Notifications

- **Expected app:** web + admin
- **Status:** ✅ Implemented
- **Location:** `notifications/page.tsx`; `DashboardNotificationLink.tsx`
- **WS:** `useNotificationsRealtime`

#### [BE-NOTIF-002] Notification Actions

- **Expected app:** web + admin
- **Status:** ✅ Implemented

#### [BE-NOTIF-003] Preferences

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `settings/notifications/page.tsx`

#### [BE-NOTIF-004] Push (FCM-style)

- **Expected app:** web (native mobile)
- **Status:** ⚠️ Partial — stub only; Web Push uses separate path
- **API:** `/push/register` acknowledge-only stub

#### [BE-NOTIF-005] Web Push Subscriptions

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `PushRegistration.tsx` → `push.service.ts`
- **API:** `POST/DELETE /push-subscription` (GW-001 ✅)

#### [BE-NOTIF-011] Notification Channels

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `SettingsNotificationsClient.tsx` — per-channel display + prefs
- **API:** `notifications.getChannels`, `patchChannelPreference` (GW-002 ✅)

#### [BE-NOTIF-008] Admin Broadcast/Segment

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminNotificationsClient.tsx` — operator tabs (Send/Broadcast/Segment/Delivery)
- **API:** `sendNotification`, `broadcastNotification`, `sendNotificationToSegment`

#### [BE-NOTIF-009] Admin Templates

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `SystemClient.tsx` — notification templates CRUD

---

### Media

#### [BE-MEDIA-001] Media Library

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `settings/files/page.tsx` → `MediaLibraryClient.tsx`

#### [BE-MEDIA-002] Upload Flows

- **Expected app:** web + admin
- **Status:** ✅ Implemented
- **API:** `useMediaUpload.ts` — presigned + chunked

#### [BE-MEDIA-003] Download

- **Expected app:** web + admin
- **Status:** ✅ Implemented

#### [BE-MEDIA-004] File Ops

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `MediaLibraryClient.tsx` — copy, move, regenerate-thumbnail actions

#### [BE-MEDIA-005] Sharing

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `MediaLibraryClient.tsx` — share links

#### [BE-MEDIA-006] Public Share Access

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `share/[token]/page.tsx`

#### [BE-MEDIA-007] Storage Stats

- **Expected app:** web
- **Status:** ✅ Implemented

#### [BE-MEDIA-008] Admin Media

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminMediaAllFilesClient.tsx`, `AdminMediaQuarantineClient.tsx`, `AdminMediaAnalyticsClient.tsx`

---

### Portfolio

#### [BE-PORT-001] Public Portfolio

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `portfolio/page.tsx`, `portfolio/[id]/page.tsx`
- **API:** SSR `fetchGatewayJson('/portfolio/timeline')`; `portfolio.like`

#### [BE-PORT-002] Admin Portfolio CRUD

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminPortfolioClient.tsx`, `AdminPortfolioEditorClient.tsx`

#### [BE-PORT-003] Admin Media on Items

- **Expected app:** admin
- **Status:** ✅ Implemented (in editor)

#### [BE-PORT-004] Admin Bulk/Reorder

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminPortfolioClient.tsx` — up/down reorder controls

#### [BE-PORT-005] Admin Analytics

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminPortfolioClient.tsx` — global + per-item analytics panels

#### [BE-PORT-006] Admin Categories

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AdminPortfolioClient.tsx` — categories section

#### [BE-PORT-001] Landing Portfolio

- **Expected app:** landing
- **Status:** ✅ Redirect
- **Location:** `apps/landing` redirects to web `/portfolio`

---

### Blog

#### [BE-BLOG-001] Public Posts

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `blog/page.tsx`, `blog/[slug]/page.tsx`

#### [BE-BLOG-002] Public Taxonomy

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `blog/category/[slug]/page.tsx`, `blog/tag/[slug]/page.tsx`

#### [BE-BLOG-003] RSS Feed

- **Expected app:** web
- **Status:** ⚠️ Partial
- **Location:** `blog/layout.tsx` — `<link rel="alternate">` to gateway RSS; no dedicated feed page

#### [BE-BLOG-011] Atom Feed

- **Expected app:** web
- **Status:** ⚠️ Partial
- **Location:** `blog/layout.tsx` — Atom alternate link; gateway `GET /blog/feed/atom` (GW-003 ✅)

#### [BE-BLOG-004] Comments

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `BlogPostInteractionsClient.tsx`

#### [BE-BLOG-005] Post Interactions

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** likes, bookmarks; `blog/bookmarks/page.tsx`

#### [BE-BLOG-006] Admin Posts CMS

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `ContentClient.tsx`, `AdminBlogPostEditorClient.tsx`

#### [BE-BLOG-007] Admin Comments

- **Expected app:** admin
- **Status:** ✅ Implemented (in content moderation)

#### [BE-BLOG-008] Admin Taxonomy

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `ContentClient.tsx` — Taxonomy tab (merge tags, authors, revision restore)

#### [BE-BLOG-009] Admin Analytics

- **Expected app:** admin
- **Status:** ⚠️ Partial
- **Location:** `AnalyticsClient.tsx` — blog section

#### [BE-BLOG-001] Landing Blog

- **Expected app:** landing
- **Status:** ✅ Redirect
- **Location:** `apps/landing/src/app/blog/page.tsx` → web app blog

---

### Contact

#### [BE-CONTACT-001] Public Submission

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `contact/page.tsx` → `ContactFormClient.tsx`
- **API:** `contact.createInquiry`

#### [BE-CONTACT-002] Admin Inbox

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `contact/page.tsx` → `ContactClient.tsx`

#### [BE-CONTACT-003] Landing Contact

- **Expected app:** landing
- **Status:** ✅ Redirect — `contact/page.tsx` → web app contact (Option A)

---

### Admin Platform

#### [BE-ADMIN-001] Dashboard

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `DashboardClient.tsx`, `AnalyticsClient.tsx`

#### [BE-ADMIN-002] System Config

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `SystemClient.tsx`

#### [BE-ADMIN-003] Cache Management

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `SystemClient.tsx` — cache clear (global + by key); GW-004 ✅

#### [BE-ADMIN-004] Background Jobs

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `SystemClient.tsx` — jobs panel

#### [BE-ADMIN-005] System Logs

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `SystemClient.tsx` — log download; GW-007 ✅

#### [BE-ADMIN-006] Announcements

- **Expected app:** admin
- **Status:** ❌ Missing UI
- **API:** Gateway proxied (GW-005 ✅); no admin UI panel yet

#### [BE-ADMIN-013] Maintenance Mode

- **Expected app:** admin
- **Status:** ❌ Missing UI
- **API:** Gateway proxied (GW-006 ✅); no admin UI panel yet

#### [BE-ADMIN-007] Email Templates

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `SystemClient.tsx` — preview + test send

#### [BE-ADMIN-008] Audit Trail

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `AuditClient.tsx`

#### [BE-ADMIN-009] Impersonation

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `UserDetailClient.tsx`, `AuditClient.tsx`

#### [BE-ADMIN-010] Outgoing Webhooks

- **Expected app:** admin
- **Status:** ✅ Implemented
- **Location:** `IntegrationsClient.tsx` — delivery history drawer per webhook

#### [BE-ADMIN-011] Document Verification

- **Expected app:** web
- **Status:** ✅ Implemented
- **Location:** `verify-document/page.tsx` → `DocumentVerifyClient.tsx`

---

### Health / Webhooks / Docs (backend-only)

| ID                | Frontend Status | Notes                                                                          |
| ----------------- | --------------- | ------------------------------------------------------------------------------ |
| BE-WH-001–006     | N/A             | Inbound webhooks — no UI needed; Stripe (BE-WH-004) is scaffold-only           |
| BE-HEALTH-001–005 | ✅ Mostly       | `SystemClient.tsx` — health + collapsible debug diagnostics (`getHealthDebug`) |
| BE-DOCS-001       | N/A             | OpenAPI aggregation at `/docs-specs` — developer tooling only                  |

---

## Route Inventory (85 pages)

### `apps/web` (44)

| Area      | Routes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public    | `/`, `/about`, `/contact`, `/blog`, `/blog/[slug]`, `/blog/bookmarks`, `/portfolio`, `/portfolio/[id]`, `/work`, `/verify-document`, `/terms`, `/privacy`                                                                                                                                                                                                                                                                                                                                 |
| Auth      | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`                                                                                                                                                                                                                                                                                                                                                                                                             |
| Dashboard | `/dashboard`, `/requests`, `/requests/new`, `/requests/[id]`, `/quotes`, `/quotes/[id]`, `/projects`, `/projects/new`, `/projects/[id]`, `/messages`, `/messages/[conversationId]`, `/messages/thread/[threadId]`, `/messages/new/direct`, `/payments`, `/payments/[id]`, `/payments/methods`, `/payments/invoice/[id]`, `/invoices`, `/notifications`, `/profile`, `/profile/edit`, `/settings`, `/settings/account`, `/settings/security`, `/settings/notifications`, `/settings/files` |
| Share     | `/share/[token]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### `apps/admin` (30)

| Area       | Routes                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public     | `/`, `/login`                                                                                                                                                                                                                                                                                                                                                                                                       |
| Operations | `/dashboard`, `/pipeline`, `/pipeline/users`, `/pipeline/users/[id]`, `/pipeline/projects`, `/pipeline/projects/[id]`, `/contact`, `/notifications`, `/requests`, `/requests/[id]`, `/quotes`, `/quotes/[id]`, `/projects`, `/projects/[id]`, `/payments`, `/users`, `/users/[id]`, `/messages`, `/messages/project/[projectId]`, `/messages/thread/[threadId]`, `/messages/new-group`, `/moderation`, `/analytics` |
| Content    | `/content`, `/content/posts/new`, `/content/posts/[id]/edit`, `/portfolio`, `/portfolio/new`, `/portfolio/[id]/edit`, `/media`                                                                                                                                                                                                                                                                                      |
| System     | `/system`, `/integrations`, `/audit`                                                                                                                                                                                                                                                                                                                                                                                |

### `apps/landing` (6)

`/`, `/about`, `/pricing`, `/blog`, `/blog/[slug]`, `/contact`

---

## Architecture Notes

| Topic                | Detail                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Dual API pattern** | Most features use `apiServices.*` facades; only requests/quotes/projects/payments use Orval react-query hooks in web |
| **UI styling**       | Web dashboard uses TailAdmin classes; admin uses Gentelella-style chrome; shared primitives from `@nestlancer/ui`    |
| **Forms**            | Single-page forms (no multi-step wizards); `NewRequestClient` is one page with sections                              |
| **Polling**          | Media processing status, 60s session verify, 60s WS invalidation fallback in `RequestsQuotesRealtimeSync`            |
| **Route constants**  | `routes.invoiceDetail` aligned to `/payments/invoice/:id` (P2-009 ✅)                                                |

---

## Role Alignment Summary

| Surface              | Expected        | Enforcement                                                   |
| -------------------- | --------------- | ------------------------------------------------------------- |
| `apps/web` dashboard | USER (client)   | Login rejects ADMIN; middleware cookie gate; `WebAuthGuard`   |
| `apps/admin` console | ADMIN           | Login rejects non-admin; partial middleware; `AdminAuthGuard` |
| Public routes        | unauthenticated | `@nestlancer/auth` public prefixes                            |
| Group chat creation  | admin only      | ✅ `AdminNewGroupChatClient.tsx` only                         |

---

## E2E Coverage

| Flow                                                          | Spec                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------- |
| Web smoke                                                     | `apps/web/tests/e2e/smoke.spec.ts`                   |
| Web login 2FA                                                 | `apps/web/tests/e2e/login-2fa.mocked.spec.ts`        |
| Web requests                                                  | `apps/web/tests/e2e/requests-list.mocked.spec.ts`    |
| Web payment checkout                                          | `apps/web/tests/e2e/payment-checkout.mocked.spec.ts` |
| Web public visual                                             | `apps/web/tests/e2e/public-pages.visual.spec.ts`     |
| Admin smoke + 19 routes (incl. `/pipeline`, `/notifications`) | `apps/admin/tests/e2e/admin-pages.live.spec.ts`      |
| Admin pipeline                                                | `apps/admin/tests/e2e/pipeline.live.spec.ts`         |
| Admin users                                                   | `apps/admin/tests/e2e/admin-users.*.spec.ts`         |
| Landing smoke                                                 | `apps/landing/tests/e2e/smoke.spec.ts`               |

**Covered (smoke):** admin `/notifications`, `/pipeline`; landing `/blog` redirect.

**Not covered:** web messages WS, admin disputes respond flow, live Razorpay checkout, landing homepage API depth.

---

_End of FRONTEND-IMPLEMENTATION-AUDIT.md_
