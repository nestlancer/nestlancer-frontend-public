<div align="center">

# Login

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

- **Submit credentials:** `POST /api/v1/auth/login`
- **After success:** use `POST /api/v1/auth/refresh` when access token expires; `POST /api/v1/auth/logout` to end session (bearer).
- **2FA path:** If the API returns a challenge, complete with `POST /api/v1/auth/verify-2fa` (see `2fa-verification.md`).
- **CSRF (if app uses cookie-based CSRF):** `GET /api/v1/auth/csrf-token`
- **OAuth / social login:** _Not present in this gateway file_ — wireframe stays **email + password** unless the spec is extended.

---

## ✨ Modern UI notes (2026)

- **Split panel:** Brand story + testimonial left; form card right (stacked on mobile).
- **Password:** Show/hide toggle; optional passkey CTA only if product adds WebAuthn later.
- **Motion:** Focus ring on email; subtle card elevation on hover.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                          [Create account →]     │
├───────────────────────────────┬─────────────────────────────────────────────────────────┤
│  “Ship faster with vetted      │  ┌─ Sign in ────────────────────────────────────────┐ │
│   talent.” (social proof)     │  │ Email *                                              │ │
│  [optional art / gradient]    │  │ [..............................................]  │ │
│                               │  │ Password *                          [Show]          │ │
│                               │  │ [..............................................]  │ │
│                               │  │ ☐ Remember me          [Forgot password?]          │ │
│                               │  │ [ Sign in ]                                         │ │
│                               │  └────────────────────────────────────────────────────┘ │
└───────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Login** — UI wireframe specification

</div>
