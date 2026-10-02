<div align="center">

# 2FA Verification

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

- **Complete login 2FA:** `POST /api/v1/auth/verify-2fa` (request body matches auth service — typically temporary session id + TOTP or backup code; confirm with DTO).
- **Enabling 2FA on account** (settings, not this screen): `POST /api/v1/users/2fa/enable`, `POST /api/v1/users/2fa/verify`, etc. (bearer) — separate from login verification.

---

## ✨ Modern UI notes (2026)

- **OTP input:** 6 separate boxes or single field with auto-advance; paste-friendly.
- **Method toggle:** “Authenticator app” vs “Backup code” as **segmented control**.
- **Help:** “Lost device?” → support / recovery flow (product policy).

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                    ┌─ Two-step verification ────────────────┐                           │
│                    │ [ Authenticator | Backup code ]        │                           │
│                    │ Enter 6-digit code                     │                           │
│                    │ [ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]    │                           │
│                    │ [ Verify & continue ]                  │                           │
│                    │ [← Use a different account]            │                           │
│                    └────────────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**2FA Verification** — UI wireframe specification

</div>
