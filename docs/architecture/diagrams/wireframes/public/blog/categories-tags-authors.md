<div align="center">

# Categories / Tags / Authors (public list views)

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

| Page       | List                          | Detail                                        |
| :--------- | :---------------------------- | :-------------------------------------------- |
| Categories | `GET /api/v1/blog/categories` | `GET /api/v1/blog/categories/{idOrSlug}`      |
| Tags       | `GET /api/v1/blog/tags`       | `GET /api/v1/blog/tags/{idOrSlug}`            |
| Authors    | `GET /api/v1/blog/authors`    | `GET /api/v1/blog/authors/{id}` (author UUID) |

Detail pages drill into posts filtered by that entity (client-side or follow links from list payload).

---

## ✨ Modern UI notes (2026)

- **Directory aesthetic:** Large first-letter or color dot per row; **post count** as pill.
- **Authors:** Card grid with avatar, headline role, “Latest article” teaser (Behance-style curation).

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Blog · Categories                         [Search…]                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─ DIRECTORY LIST ───────────────────────────────────────────────────────────────────┐ │
│  │  ◉  Web Development                                      12 posts   [Explore →]    │ │
│  │  ◉  Mobile Apps                                           8 posts   [Explore →]    │ │
│  │  ◉  Design                                                5 posts   [Explore →]    │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Tags:** same pattern with `#` prefix chips in list cells.

**Authors:** responsive card grid — `(avatar | name + bio snippet | [View posts])`.

---

---

<div align="center">

**Categories / Tags / Authors (public list views)** — UI wireframe specification

</div>
