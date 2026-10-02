<div align="center">

# Homepage

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

| Section                | Suggested endpoints                                                                                                                                                                                                        |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Featured work          | `GET /api/v1/portfolio/featured`                                                                                                                                                                                           |
| Portfolio strip / grid | `GET /api/v1/portfolio`, `GET /api/v1/portfolio/search`, filters from `GET /api/v1/portfolio/categories`, `GET /api/v1/portfolio/tags`                                                                                     |
| Blog highlights        | `GET /api/v1/blog/posts` (and/or `GET /api/v1/blog/posts/search`)                                                                                                                                                          |
| **Spec note**          | `GET /api/v1/projects/public` is described as “portfolio discovery” but is tagged with **bearer** security in the gateway spec. Prefer **portfolio** routes above for anonymous marketing until the contract is clarified. |

Auth CTAs use `POST /api/v1/auth/login` / `POST /api/v1/auth/register` (no OAuth routes in this OpenAPI file).

---

## ✨ Modern UI notes (2026)

- **Hero:** Split layout — left: headline + subcopy + dual CTAs (`Post a request`, `Browse portfolio`); right: **product frame** (dashboard mock, video loop, or bento preview) with subtle mesh gradient behind (not generic stock hero).
- **Social proof:** Logo strip + optional metric (“X projects shipped”) below fold.
- **Features:** **Bento grid** (one large tile, mixed small tiles) for “why Nestlancer” instead of uniform 3-column rows.
- **Motion:** Stagger hero lines and bento tiles on load; sticky **thumb-zone** primary CTA on mobile.
- **Nav:** Minimal top bar (4 links max + Login + primary Register).

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo]  How it works   Portfolio   Blog   Contact              [Login]  [Register]     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─ HERO (split) ───────────────────────────────┬─ VISUAL / PRODUCT FRAME ─────────────┐  │
│  │  Hire vetted talent — without the noise.    │  ┌──────────────────────────────┐  │  │
│  │  (short benefit subcopy, max 2 lines)       │  │  Browser chrome + UI mock /  │  │  │
│  │  [Post a request]  [Browse portfolio]       │  │  short loop video / bento    │  │  │
│  │  Trust row: ★★★★★  “Used by teams at …”     │  │  preview (gradient mesh bg)  │  │  │
│  └─────────────────────────────────────────────┴──────────────────────────────────┘  │
│  ┌─ LOGO STRIP (grayscale, scroll optional) ─────────────────────────────────────────┐  │
│  │  [Client] [Client] [Client] [Client] [Client]                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ BENTO “WHY NESTLANCER” ──────────────────────────────────────────────────────────┐  │
│  │  ┌────────────────────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │
│  │  │ LARGE: Quotes → pay →      │ │  Card    │ │  Card    │ │  Card    │           │  │
│  │  │ delivery in one flow       │ │  (icon)  │ │  (icon)  │ │  (icon)  │           │  │
│  │  └────────────────────────────┘ └──────────┘ └──────────┘ └──────────┘           │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ CATEGORIES (horizontal scroll chips on mobile) ───────────────────────────────────┐  │
│  │  [Web] [Mobile] [Design] [Marketing] [Data] [More…]                                │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ FEATURED PORTFOLIO (from /portfolio/featured) ───────────────────────────────────┐  │
│  │  Asymmetric cards: one wide + two tall + mosaic hover lift                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ BLOG HIGHLIGHTS ──────────────────────────────────────────────────────────────────┐  │
│  │  Editorial row: large featured post + 2 compact cards                                │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ CTA BAND (full-bleed subtle gradient) ───────────────────────────────────────────┐  │
│  │  Ready to ship?   [Post your first request]                                        │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│  Footer: About · Blog · Portfolio · Contact · Terms · Privacy · Cookies · RSS (blog)   │
│  [Mobile sticky bar: Post a request — primary, thumb-height]                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Homepage** — UI wireframe specification

</div>
