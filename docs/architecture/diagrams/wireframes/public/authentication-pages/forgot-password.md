<div align="center">

# Forgot Password

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

- **Request reset email:** `POST /api/v1/auth/forgot-password`
- **CSRF:** `GET /api/v1/auth/csrf-token` if the deployment uses CSRF headers on POST

---

## ✨ Modern UI notes (2026)

- Single-field focus; after submit show **neutral success copy** (do not confirm whether email exists).
- Illustration or soft gradient panel optional.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                    ┌─ Reset access ─────────────────────────────┐                       │
│                    │ We’ll email a secure link if the account   │                       │
│                    │ exists.                                    │                       │
│                    │ Email *                                    │                       │
│                    │ [......................................]  │                       │
│                    │ Turnstile                                  │                       │
│                    │ [ Send reset link ]                        │                       │
│                    │ [← Back to sign in]                        │                       │
│                    └────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Forgot Password** — UI wireframe specification

</div>
