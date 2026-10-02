<div align="center">

# Contact

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

- **Submit (public):** `POST /api/v1/contact` _or_ `POST /api/v1/contact/inquiries` — both exist; the product should pick one contract and keep the wireframe fields aligned with that DTO.
- **Ops (not public):** `GET/PATCH/DELETE /api/v1/contact/inquiries/...` and `POST .../respond` are **bearer**-protected (admin/staff).

---

## ✨ Modern UI notes (2026)

- **Split layout:** Left column — headline, short promise, direct email or response-time expectation; right — form on elevated card with **soft shadow** (Framer-style).
- **Micro-interactions:** Subject changes optional helper text; success state inline **toast + confetti-off** (subtle).
- **Trust:** Link to Privacy near submit; Turnstile unobtrusive.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo] … nav …                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─ LEFT (brand / story) ────────────────┬─ RIGHT (form card, glass or solid) ───────┐ │
│  │  Let’s talk                            │  ┌────────────────────────────────────┐  │ │
│  │  (1-line value)                        │  │ Name *                             │  │ │
│  │  Avg. reply: < 24h (example)          │  │ [................................] │  │ │
│  │  [mailto] optional                     │  │ Email *                            │  │ │
│  │                                        │  │ [................................] │  │ │
│  │                                        │  │ Subject * [GENERAL ▼] …           │  │ │
│  │                                        │  │ Message * (10–5000 chars)         │  │ │
│  │                                        │  │ [...............................] │  │ │
│  │                                        │  │ [...............................] │  │ │
│  │                                        │  │ Turnstile                         │  │ │
│  │                                        │  │ [ Send message ]                  │  │ │
│  │                                        │  └────────────────────────────────────┘  │ │
│  └────────────────────────────────────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Contact** — UI wireframe specification

</div>
