<div align="center">

# Email Verification

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

- **Confirm email:** `POST /api/v1/auth/verify-email` (token from email link in body per DTO)
- **Resend link:** `POST /api/v1/auth/resend-verification`

---

## ✨ Modern UI notes (2026)

- **Primary path:** deep-link landing auto-submits token; show **success illustration** + “Continue to app”.
- **Fallback:** manual token field only if link broken; rate-limit resend with countdown.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                    ┌─ Verify email ─────────────────────────────┐                       │
│                    │ Check your inbox for the link.             │                       │
│                    │ [ Open mail app ] (deep link mobile)       │                       │
│                    │ — or paste token —                         │                       │
│                    │ [......................................]  │                       │
│                    │ [ Verify ]    [ Resend ] (cooldown 60s)    │                       │
│                    └────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Email Verification** — UI wireframe specification

</div>
