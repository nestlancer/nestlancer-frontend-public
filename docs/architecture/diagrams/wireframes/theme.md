<div align="center">

# Nestlancer — Google Stitch theme

</div>

---

Use this file as the **global visual system** when turning wireframes in this folder into high-fidelity UI in [Google Stitch](https://stitch.withgoogle.com). Each page markdown supplies **Anatomy** (layout); this file supplies **Vibe**, **tokens**, and **component styling** (see Stitch’s 3-layer prompt model: Anatomy · Vibe · Content).

---

## Pattern language (from reference platforms)

Distilled traits to mimic—not copy any single brand:

| Source                              | What to borrow                                                                                                                                                                                                                                        |
| :---------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Webflow](https://webflow.com/)     | Marketing sites that feel **custom and editorial**: strong typographic heroes, CMS-driven content blocks, **bento-style feature grids** (variable card sizes, one hero tile), social proof rows, crisp section rhythm, performance-conscious imagery. |
| [Dribbble](https://dribbble.com/)   | **Shot-style hierarchy**: bold thumbnails, tight metadata (likes/views as optional micro-labels), filter chips, playful hover states, portfolio-forward cards, saturated accent on neutral base.                                                      |
| [Framer](https://www.framer.com/)   | **Motion-first polish**: scroll-linked reveals, subtle parallax, gradient or shader accents used sparingly, dark-mode landing alternatives, AI-generated layout variety within a strict grid, “single canvas” consistency.                            |
| [Behance](https://www.behance.net/) | **Case-study spacing**: generous margins, gallery grids, editorial captions, “curated project” feel for portfolio and blog visuals, clear hire/work CTAs.                                                                                             |

---

## Product vibe (Nestlancer)

**One-liner vibe:** Trustworthy **creative marketplace** — confident, modern, slightly warm; never cheap or gamified.

**Adjectives:** Professional, clear, inviting, craft-oriented, fast-scanning (lists, dashboards, payments).

**Avoid:** Neon crypto aesthetic, cluttered job-board noise, pure brutalism for admin tools, illegible display fonts in dense tables.

---

## Surfaces (apply the right shell)

| Surface    | Use for                                         | Layout bias                                                                    |
| :--------- | :---------------------------------------------- | :----------------------------------------------------------------------------- |
| **Public** | Homepage, blog, portfolio, contact, legal, auth | Marketing: wide hero, bento features, generous whitespace, sticky nav          |
| **User**   | Dashboard, projects, quotes, payments, messages | **App shell**: sidebar or top nav, max-width content, card KPIs, feed patterns |
| **Admin**  | All `/admin` tools                              | Dense **data UI**: tables, filters, badges, inline actions; calmer accent use  |

---

## Color tokens (suggested — tune in Stitch Theme sidebar)

**Light (default public + user)**

| Token                   | Role                   | Suggested hex                                                         |
| :---------------------- | :--------------------- | :-------------------------------------------------------------------- |
| `--color-bg`            | Page background        | `#FAFAF8` (warm off-white)                                            |
| `--color-surface`       | Cards, panels          | `#FFFFFF`                                                             |
| `--color-surface-muted` | Secondary panels       | `#F3F2EF`                                                             |
| `--color-border`        | Hairlines              | `#E6E4DF`                                                             |
| `--color-text`          | Primary text           | `#14120F`                                                             |
| `--color-text-muted`    | Secondary              | `#5C5854`                                                             |
| `--color-accent`        | Primary actions, links | `#0D6E6E` (teal) or `#2563EB` (blue) — pick one family per generation |
| `--color-accent-muted`  | Chips, hover           | tint at ~15% opacity of accent                                        |
| `--color-success`       | Paid, confirmed        | `#15803D`                                                             |
| `--color-warning`       | Pending                | `#CA8A04`                                                             |
| `--color-danger`        | Errors, destructive    | `#B91C1C`                                                             |

**Dark (optional marketing + user preference)**

| Token                | Suggested hex |
| :------------------- | :------------ |
| `--color-bg`         | `#0C0C0E`     |
| `--color-surface`    | `#16161A`     |
| `--color-border`     | `#2A2A30`     |
| `--color-text`       | `#F4F4F5`     |
| `--color-text-muted` | `#A1A1AA`     |

**Admin:** Prefer **light** admin for legibility; accent only for primary buttons and status badges.

---

## Typography

- **Display / marketing H1:** Distinctive but readable (e.g. Fraunces, Newsreader, or Clash Display) — **not** Inter-only for heroes.
- **UI / body:** Neutral grotesk (e.g. Inter, Geist, DM Sans) for forms, tables, chat.
- **Scale:** H1 2.5–3.5rem public hero; H2 section; body 1rem/1.5 line-height; **tabular figures** for money and IDs in admin/user financial views.

---

## Shape, elevation, motion

- **Radius:** `12px` cards, `8px` inputs/buttons, `999px` pills; admin tables may use `8px` row cards or sharp tables with rounded container only.
- **Shadow:** Restrained — `0 1px 2px rgba(0,0,0,0.06)` cards; lift on hover for clickable tiles (Framer/Dribbble energy).
- **Motion:** 200–320ms ease-out; stagger children on hero/feature sections; **no** excessive bounce on admin.

---

## Components (cross-page)

- **Nav (public):** Logo left, primary CTA right (`Post a request`), secondary ghost buttons.
- **Nav (user):** Account menu + notifications; project context breadcrumbs on detail pages.
- **Cards:** Image top or icon corner, title, one-line meta, single primary action.
- **Tables (admin):** Sticky header, zebra optional, row hover, status pill column, kebab actions.
- **Auth:** Centered card **or** split hero (brand left / form right) like modern SaaS logins.
- **Empty states:** Illustration or icon + one sentence + primary CTA.

---

## Imagery

- Photography: diverse professionals, natural light, shallow depth (Behance case-study quality).
- Illustrations: simple geometric or line style consistent across empty states—not mixed 3D and flat randomly.

---

---

## Copy-paste prompts for Stitch

**Master vibe (append page-specific anatomy from any wireframe file):**

```text
Anatomy: [paste ASCII/layout description from the wireframe markdown]
Vibe: Nestlancer freelance marketplace — Webflow-grade marketing clarity, Framer-smooth motion (subtle), Dribbble-bold portfolio cards, Behance editorial spacing. Professional creative trust, warm off-white light theme, optional dark hero variant. Single accent color used consistently; restrained shadows; 12px card radius.
Content: Nestlancer product (projects, quotes, payments in INR where shown, messaging, blog, portfolio). Respect all labels and sections from the wireframe.
```

**Public homepage / landing accent:**

```text
Add a bento-style feature grid below the hero: one large tile (value prop video or image), mixed smaller tiles for categories; include social proof strip (logos or metrics). Sticky CTA on scroll on mobile.
```

**User dashboard:**

```text
App shell with sidebar navigation icons + labels; KPI summary row as four equal cards; activity feed as timeline with avatars; calm density — not a Bloomberg terminal.
```

**Admin dashboard:**

```text
Data-dense admin: KPI row, two charts side by side, activity table, system alerts banner; WCAG-friendly contrast; minimal decoration; status badges with semantic colors.
```

---

## References

- [Stitch — llms / agent guidance](https://stitch.withgoogle.com/llms.txt)
- [Stitch prompt guide (Google AI Developers)](https://discuss.ai.google.dev/t/stitch-prompt-guide/83844)
- Inspiration scan: [Webflow](https://webflow.com/), [Dribbble](https://dribbble.com/), [Framer](https://www.framer.com/), [Behance](https://www.behance.net/)

---

<div align="center">

**Nestlancer — Google Stitch theme** — UI wireframe specification

</div>
