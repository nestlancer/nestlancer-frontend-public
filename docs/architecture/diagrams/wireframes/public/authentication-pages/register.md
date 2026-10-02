<div align="center">

# Register

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

- **Create account:** `POST /api/v1/auth/register`
- **Email availability (inline):** `GET /api/v1/auth/check-email` (see `check-email-availability.md`)
- **After signup:** user completes `POST /api/v1/auth/verify-email` via link/token; resend: `POST /api/v1/auth/resend-verification`
- **CSRF:** `GET /api/v1/auth/csrf-token` when required by the stack

Field names must match the gateway DTO (first/last name, phone E.164, etc. — confirm against generated client types).

---

## ✨ Modern UI notes (2026)

- **Progress:** Stepper “Account → Verify email” if split flow.
- **Password:** Strength meter + requirements checklist (8–64 chars pattern as product rule).
- **Legal:** Terms checkbox with link; marketing opt-in **unchecked by default**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                                [Sign in →]    │
├───────────────────────────────┬─────────────────────────────────────────────────────────┤
│  Join Nestlancer              │  ┌─ Create account ────────────────────────────────────┐ │
│  (benefits bullets)            │  │ First *        Last *                              │ │
│                                │  │ [...........]  [...........]                       │ │
│                                │  │ Email *  (+ inline availability ✓/✗)             │ │
│                                │  │ [..............................................]  │ │
│                                │  │ Phone (E.164) optional                             │ │
│                                │  │ [..............................................]  │ │
│                                │  │ Password *  [strength meter]                       │ │
│                                │  │ [..............................................]  │ │
│                                │  │ ☑ Terms *   ☐ Marketing                          │ │
│                                │  │ Turnstile                                          │ │
│                                │  │ [ Create account ]                                 │ │
│                                │  └────────────────────────────────────────────────────┘ │
└───────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Register** — UI wireframe specification

</div>
