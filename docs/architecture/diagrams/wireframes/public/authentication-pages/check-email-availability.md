<div align="center">

# Check Email Availability (inline)

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

- **Availability check:** `GET /api/v1/auth/check-email` — the published gateway snippet shows **no `parameters` array**; confirm the real query/body contract in the live spec or generated **OpenAPI client** (likely `email` query).

Debounce calls (≥300ms) while typing; disable submit on register until status is **available**.

---

## ✨ Modern UI notes (2026)

- Inline **pill status** under field (green “Good to go” / amber “Checking…” / red “Already registered”).
- Do not block paste; show icon only (no noisy modals).

```
┌─ EMAIL FIELD (embedded in register) ───────────────────────────────────────────────────┐
│  Email *                                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐                  │
│  │ newuser@example.com                                              │                  │
│  └──────────────────────────────────────────────────────────────────┘                  │
│  ● Available  /  ⟳ Checking…  /  ✕ Already in use — [Sign in instead]                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Check Email Availability (inline)** — UI wireframe specification

</div>
