<div align="center">

# Portfolio Detail

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

- **Detail:** `GET /api/v1/portfolio/{idOrSlug}` (`idOrSlug` = UUID or URL slug).
- **Like:** `POST /api/v1/portfolio/{id}/like` — **Bearer** (UUID in path; UI should use portfolio item `id` from detail payload).

---

## ✨ Modern UI notes (2026)

- **Gallery:** Full-bleed hero image with **thumb filmstrip**; lightbox on click.
- **Specs:** Tech stack as **pills**; external links as icon buttons with tooltips.
- **Narrative:** Long description in **narrow column** with pull-quote or stat callout mid-scroll.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [← Portfolio]     Title · category pills                         [♥ Like] (auth only)  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─ HERO MEDIA ────────────────────────────────────────────────────────────────────────┐ │
│  │  Full-width image / video                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│  [thumb] [thumb] [thumb] [thumb] …                                                      │
│  ┌─ META ROW ─────────────────────────────────────────────────────────────────────────┐ │
│  │  Client · timeline · role   |   [Live site ↗]  [Repo ↗]  [Case study PDF]          │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ STACK ────────────────────────────────────────────────────────────────────────────┐ │
│  │  [React] [Node] [PostgreSQL] …                                                     │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ CASE STUDY BODY (markdown/HTML) ──────────────────────────────────────────────────┐ │
│  │  Pull-quote | stat callout | image breaks                                           │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ NEXT / RELATED (optional client block from same tags) ────────────────────────────┐ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Portfolio Detail** — UI wireframe specification

</div>
