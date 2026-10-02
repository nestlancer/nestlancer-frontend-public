<div align="center">

# Portfolio Listing

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

| Data            | Endpoint                                                                  |
| :-------------- | :------------------------------------------------------------------------ |
| Published items | `GET /api/v1/portfolio`                                                   |
| Featured only   | `GET /api/v1/portfolio/featured` (toggle “Featured only” should hit this) |
| Filters         | `GET /api/v1/portfolio/categories`, `GET /api/v1/portfolio/tags`          |
| Search          | `GET /api/v1/portfolio/search`                                            |
| Detail          | `GET /api/v1/portfolio/{idOrSlug}`                                        |
| Like            | `POST /api/v1/portfolio/{id}/like` — **Bearer** required in spec          |

---

## ✨ Modern UI notes (2026)

- **Discovery:** Masonry or **2×2 bento** with one spotlight tile; filters in **drawer on mobile**, inline on desktop.
- **Cards:** Video hover preview (optional), gradient border on featured, like heart ghosted until login.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Portfolio   [Search ………]   [Filters ≡]                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  Category [All ▼]  Tags [chips…]  ☐ Featured only  → uses /portfolio/featured           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ SPOTLIGHT (2×2 span) │ │  Card    │ │  Card    │ │  Card    │                     │
│  │ hover: subtle lift   │ │  ♥*      │ │  ♥*      │ │  ♥*      │                     │
│  └──────────────────────┘ └──────────┘ └──────────┘ └──────────┘                     │
│  *Like requires signed-in user per gateway spec                                         │
│  Pagination / infinite scroll                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Portfolio Listing** — UI wireframe specification

</div>
