<div align="center">

# Post Listing

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

| Data        | Endpoint                                                                       |
| :---------- | :----------------------------------------------------------------------------- |
| Post list   | `GET /api/v1/blog/posts`                                                       |
| Search      | `GET /api/v1/blog/posts/search`                                                |
| Categories  | `GET /api/v1/blog/categories`, detail `GET /api/v1/blog/categories/{idOrSlug}` |
| Tags        | `GET /api/v1/blog/tags`, detail `GET /api/v1/blog/tags/{idOrSlug}`             |
| Authors     | `GET /api/v1/blog/authors`, profile `GET /api/v1/blog/authors/{id}`            |
| Syndication | **`GET /api/v1/blog/feed/rss` only** — no Atom route in this gateway file      |

---

## ✨ Modern UI notes (2026)

- **Magazine index:** One **hero post** (full-width image + overlay title) then 2-column card grid.
- **Filters:** Sticky chip bar (categories / tags); author as **combobox**; search debounced with empty-state illustration.
- **RSS:** Icon links to `/api/v1/blog/feed/rss` (or proxied `/blog/rss`).

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Blog   [Search ……………………] 🔍    [Subscribe RSS]                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  Chips: [All] [Web] [Mobile] …   Tags: #react #nestjs …   Author: [All authors ▼]       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─ HERO FEATURED POST (full bleed image, title bottom-left) ─────────────────────────┐ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐               │
│  │ Card + thumb  │ │ Card          │ │ Card          │ │ Card          │               │
│  │ title excerpt │ │               │ │               │ │               │               │
│  │ meta + read   │ │               │ │               │ │               │               │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘               │
│  … skeleton rows while loading …                                                        │
│  Pagination: [⟨] [1] [2] [3] [⟩]   or “Load more” infinite                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Post Listing** — UI wireframe specification

</div>
