<div align="center">

# Web Push testing

</div>

---

## 📖 Table of Contents

- [Prerequisites](#prerequisites)
- [Flow](#flow)
- [API](#api)
- [Settings](#settings)

---

## Prerequisites

- `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` in repo root `.env.development` (matches backend VAPID public key)
- HTTPS or `localhost` (browsers require secure context for push)
- Gateway running with notifications + push endpoints

---

## Flow

1. Sign in to the web app as a client (`USER`).
2. Allow notifications when prompted (`PushRegistration` in `AppProviders`).
3. Confirm subscription: DevTools → Application → Service Workers / Push.
4. Trigger a notification from admin (e.g. quote sent) and verify browser push.

---

## API

- `POST /api/v1/push-subscription` — register
- `DELETE /api/v1/push-subscription` — remove

Component: `apps/web/src/components/push/PushRegistration.tsx`

---

## Settings

Use **Settings → Notifications** to align in-app preferences with push delivery categories.

---

<div align="center">

**Web Push testing** — Nestlancer guide

</div>
