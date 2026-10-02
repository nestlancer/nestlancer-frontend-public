<div align="center">

# Nestlancer Web Application – Page Wireframe Inventory

</div>

---

## 📖 Table of Contents

- [1. Public Pages (No Authentication Required)](#1-public-pages-no-authentication-required)
- [2. Authenticated User Pages (All Roles)](#2-authenticated-user-pages-all-roles)
- [3. Admin Pages (Authenticated, Admin/Moderator Roles)](#3-admin-pages-authenticated-adminmoderator-roles)

---

## 1. Public Pages (No Authentication Required)

- **Homepage**
  - Hero section, featured portfolio items/projects, service categories, CTAs for login/registration, links to blog, portfolio, contact.
- **Authentication**
  - _Login_ – email, password, “remember me”, links to register/forgot password.
  - _Register_ – first name, last name, email, password, phone, accept terms, marketing consent, Cloudflare Turnstile.
  - _Forgot Password_ – email input + Turnstile.
  - _Reset Password_ – token (from email), new password, confirm password.
  - _Email Verification_ – token from link or manual input.
  - _2FA Verification_ – authentication session ID, 6‑digit TOTP code or backup code, method selector.
  - _Check Email Availability_ – real‑time validation (page‑embedded).
- **Blog**
  - _Post Listing_ – published posts with search, filters by category/tag/author, pagination.
  - _Post Detail_ – full content, like, bookmark, share, related posts, comment section (with replies, report, like), view tracker.
  - _Categories_ – list all, view posts by category.
  - _Tags_ – list all, view posts by tag.
  - _Authors_ – list all, author profile with posts.
  - _Feeds_ – RSS & Atom syndication links.
- **Portfolio**
  - _Portfolio Listing_ – published items with search, category/tag filters, featured filter.
  - _Portfolio Detail_ – description, media gallery, project/client info, like toggle (authenticated).
- **Contact**
  - _Contact Form_ – name, email, subject (GENERAL/SUPPORT/SALES/BILLING/PARTNERSHIP), message, Turnstile.
- **Legal / Static**
  - Terms of Service, Privacy Policy, Cookie Policy.

---

## 2. Authenticated User Pages (All Roles)

### 2.1 Dashboard

- **User Dashboard Home**
  - Summary cards: active projects, unread messages, pending quotes, notifications; recent activity feed.

### 2.2 Account Settings

- **Profile**
  - View/Edit: first name, last name, phone, timezone, language, country.
  - Upload / Remove avatar.
- **Security**
  - Change password (current, new, confirm).
  - Two‑Factor Authentication (2FA): enable (with password confirmation), verify setup, disable (with password + code), view 2FA status, backup codes (show / regenerate).
- **Preferences**
  - _Notifications_ – email digest frequency, push notification toggles (messages, project updates), in‑app preferences.
  - _Privacy_ – profile visibility (public/private/connections), show email/phone on public profile.
- **Push Devices** _(can be integrated into notification settings)_
  - Manage push subscriptions: register device (token, platform), remove device.
- **Activity Log**
  - Paginated list of personal account activity.
- **Data Export (GDPR)**
  - Request export, download available export files.
- **Delete Account**
  - Request deletion (reason, feedback), cancel pending deletion.

### 2.3 Projects

- **My Projects List** – cards with status/progress, quick actions.
- **Project Detail** – multi‑tab workspace:
  - _Overview_ – project info, timeline, team.
  - _Messages_ – real‑time chat (send message, file attachments, reactions, pin, thread replies), search within conversation.
  - _Progress_ – timeline of updates, filter by type, create progress entry.
  - _Milestones_ – list, status, approve/request revision.
  - _Deliverables_ – list, download, approve/reject.
  - _Payments_ – associated payments list.
  - _Feedback_ – submit quality/communication ratings and testimonial; view received feedback.
  - _Actions_ – Approve project (with rating, feedback, testimonial), Request Revision (area, priority, description, due date).

### 2.4 Project Requests (Proposals)

- **My Requests List** – drafts, submitted, etc.
- **Create New Request** – multi‑step form: title, description, category, budget (min/max, currency, flexible), timeline (start, deadline, flexible), specific requirements, technical preferences (technologies, hosting, integrations), attachments.
- **Request Detail** – edit, delete, submit for review, view status timeline, received quotes.
- **Attachments** – upload (multipart), list, delete.

### 2.5 Quotes

- **My Quotes List** – received quotes with status.
- **Quote Detail** – payment breakdown, accept (e‑signature: name/date, accept terms), decline (reason, feedback), request changes (multiple area/request items), download PDF.

### 2.6 Payments

- **Payment History** – list with status/project filters.
- **Payment Detail** – status, receipt, invoice, file dispute, cancel pending.
- **Payment Methods** – saved cards/UPI/wallets, add new, remove, set default, update nickname.
- **Initiate Payment** – create intent, confirm with provider signature.
- **Project Payments** – view payments and milestones for a specific project.

### 2.7 Messaging

- **Conversation List** – all chat threads, unread count.
- **Conversation View** – message history, send/edit/delete own messages, emoji reactions, pin, thread replies, search within a conversation.
- **Project‑specific Chat** – accessible from project detail (see 2.3).

### 2.8 Notifications

- **Notification List** – filter by type (info/success/warning/error), unread‑only; mark individual/all as read, mark selected as read, soft‑delete, clear all read.
- **Notification Preferences** – per‑channel toggles (in‑app, email, push), quiet hours.
- **Push Devices** – register/unregister web push subscription (already listed under Account Settings for completeness; can be placed here).

### 2.9 Media Library

- **Media Grid** – filter by file type (image, document, archive, video) and processing status; pagination.
- **Media Detail** – preview, metadata, download, copy/move, regenerate thumbnail, version history, delete.
- **Share** – create/revoke share links, list shared media.
- **Upload** – direct upload, chunked upload resume, request presigned URL, confirm upload.
- **Storage Stats** – usage and limits.

---

## 3. Admin Pages (Authenticated, Admin/Moderator Roles)

### 3.1 Admin Dashboard

- **Overview** – KPI cards (users, projects, revenue, active jobs), charts (revenue, user growth), recent activity feed, system alerts.
- **Revenue Analytics** – breakdown by period or custom date range.
- **User Metrics** – acquisition, retention, status distribution.
- **Project Metrics** – creation, status, categories.
- **System Performance** – server response times, resource usage.
- **Payments/Revenue** – accessible directly from dashboard (detailed in Payments Admin).

### 3.2 User Management

- **Users List** – search, filter by status/role, pagination.
- **User Detail** – profile, status, role, sessions, activity log, export data, force password reset, admin password reset, terminate sessions, restore deleted user.
- **Change Role / Status** – inline or dedicated modal.
- **Bulk Operations** – select multiple users for suspend/activate/delete/reset password, with reason.
- **User Audit Logs / Security Stats** – login attempts, 2FA usage (often shown inside user detail or a separate tab).

### 3.3 Audit Logs (System‑wide)

- **Audit Log Explorer** – global paginated list, filter by: user ID, resource type, action, date range; sortable.
- **User Audit Trail** – filtered logs for a specific user.
- **Resource Trail** – logs for a specific resource type + ID.
- **Export** – background export to CSV/JSON with same filters.

### 3.4 Blog Management

- **Posts** – list all statuses (draft, published, scheduled, archived), search, pagination.
- **Post Editor** – create/edit: title, slug, excerpt, markdown/HTML body, featured image, category, tags, SEO metadata, series, comment settings.
- **Post Actions** – publish, unpublish, schedule, feature/unfeature, pin/unpin, duplicate, archive, delete.
- **Import / Export** – batch import/export posts (JSON/CSV).
- **Post Revisions** – view history, restore previous version.
- **Blog Settings** – defaults, moderation rules, pagination.
- **Comments Moderation** – tabs for all / pending / reported; approve, reject, mark spam, pin/unpin, admin reply, delete.
- **Categories** – CRUD.
- **Tags** – CRUD, merge tags.
- **Authors** – list, view/edit author associations.
- **Analytics** – general overview, top posts by period, engagement metrics, per‑post analytics.

### 3.5 Contact Inquiries

- **Inquiries List** – filter by status (NEW/READ/RESPONDED/ARCHIVED/SPAM), pagination.
- **Inquiry Detail** – view message, change status, respond via email, mark as spam, delete.

### 3.6 Portfolio Admin

- **All Items** – list with analytics, create/edit (markdown/HTML, client info, project details, links, SEO), publish/unpublish, archive, toggle featured, duplicate, privacy settings.
- **Reorder** – drag‑and‑drop or numeric ordering.
- **Bulk Update** – apply actions to multiple items (publish, archive, delete, feature/unfeature).
- **Media Management** – add/remove/reorder images/video per item.
- **Categories** – CRUD, reassign on delete.
- **Analytics** – global and per‑item views/likes/engagement.

### 3.7 System Configuration

- **Global Config** – view/edit key‑value settings (e.g., MAX_UPLOAD_SIZE).
- **Feature Flags** – list all, toggle enable/disable.
- **Maintenance Mode** – toggle on/off, custom message, estimated end time.
- **Background Jobs** – list (status, queue), retry, cancel.
- **Cache Management** – clear all by pattern, clear specific key.
- **Email Templates** – list, edit subject/HTML body (Handlebars), preview, send test.
- **Announcements** – create (info/warning/critical), set dismissable, schedule, expiration.
- **System Logs** – view by level/service/date range, download logs archive.

### 3.8 Impersonation

- **Start Impersonation** – enter user ID, reason, optional ticket ID.
- **Active Sessions** – list all ongoing impersonations, terminate specific session.

### 3.9 Webhooks Management

- **Webhooks List** – create new (name, URL, events, headers, secret, retry policy), edit, delete.
- **Webhook Detail** – view deliveries (filter by status, paginated), retry failed delivery, statistics, test send, enable/disable, regenerate secret.
- **Available Events** – list of subscribable events.

### 3.10 Payments Admin

- **All Payments** – list, filter by status/project, pagination.
- **Payment Stats / Reconciliation / Revenue Reports** (with exportable data).
- **Payment Detail** – full timeline, transactions, process refund, verify.
- **Milestones Management** – create bulk per project, list, update, mark complete, release payment, request payment.
- **Disputes** – list, detail, respond, resolve.
- **Manual Payment Entry**.
- **Payment Settings** – supported methods, platform fee configuration.

### 3.11 Messages Admin

- **All Messages** – search, filter.
- **Flagged Messages Queue** – review and un‑flag.
- **Broadcast System Message** – inject into project chat.
- **Conversations Overview** – all active threads.
- **Messaging Analytics / Stats**.

### 3.12 Notifications Admin

- **All Notifications** – global list with filters.
- **Notification Stats / Delivery Report**.
- **Send Notification** – targeted to specific users, broadcast to all, or segmented by role/activity.
- **Templates** – CRUD (name, event type, channel configuration).
- **Resend** individual notification, clear notifications for a user.

### 3.13 Media Admin

- **All Media** – global list, filter by file type/status, user filter.
- **Quarantined Media** – review flagged files, release or permanently purge.
- **Storage Analytics / Usage** – global stats.
- **Actions** – reprocess any file, run orphan cleanup.
- **Media Settings** – allowed MIME types, upload size limits.

### 3.14 Quotes Admin

- **All Quotes** – list with filters.
- **Create Quote** – from a request, define payment breakdown, timeline, terms.
- **Quote Detail** – edit, delete, duplicate, send/resend, revise, view history.
- **Templates** – CRUD for reusable quote blueprints.
- **Global Stats**.

### 3.15 Requests Admin

- **All Requests** – list, filter by status (draft, submitted, under review, etc.).
- **Request Detail** – edit, update status (assign to review, reject, convert to project), assign to staff.
- **Internal Notes** – view/add private admin notes.
- **Create Quote** – directly from a request.
- **Request Stats**.

### 3.16 Projects Admin

- **All Projects** – list, create manually (title, client, quote).
- **Project Detail** – edit metadata, override status (with reason), manage team, batch create milestones, extend deadline, archive, duplicate, export.
- **Project Stats / Analytics**.

### 3.17 Progress & Milestones Admin

- **Progress Entries** – per project: list, create (type: update, milestone complete, deliverable upload, status change, internal note), edit, delete.
- **Milestones** – create, update, mark complete.
- **Deliverables** – upload, update metadata, delete.
- **Full Timeline & Analytics** – admin view of all project activity.

### 3.18 System Health & Debug

- **Aggregated Health** – all microservices, database, cache, queue, storage, websocket.
- **Detailed Diagnostics** – per‑component status.
- **Liveness / Readiness Probes** (for DevOps).
- **Debug Info** – system environment, deep‑trace logs (admin only).

---

<div align="center">

**Nestlancer Web Application – Page Wireframe Inventory** — Nestlancer guide

</div>
