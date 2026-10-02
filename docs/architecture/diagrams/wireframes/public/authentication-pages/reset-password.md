<div align="center">

# Reset Password

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

- **Apply new password:** `POST /api/v1/auth/reset-password` (body includes reset token + new password per server DTO — confirm with API client types).

---

## ✨ Modern UI notes (2026)

- **Prefer magic link UX:** token carried in **URL query** from email; form shows **only** new password + confirm (no raw token field for users). If the API expects token in body, prefill hidden field from query.
- Success → auto route to login with toast.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                    ┌─ Choose a new password ────────────────────┐                       │
│                    │ (token from email link — hidden field)     │                       │
│                    │ New password *     [strength]              │                       │
│                    │ [......................................]  │                       │
│                    │ Confirm *                                  │                       │
│                    │ [......................................]  │                       │
│                    │ [ Update password ]                        │                       │
│                    └────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Reset Password** — UI wireframe specification

</div>
