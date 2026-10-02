<div align="center">

# Legal / Static Pages

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

No dedicated legal-document path in the gateway file — these pages are typically **static frontend routes** (Markdown/MDX or CMS). Keep content versioned in repo or CMS; link footer to each route.

---

## ✨ Modern UI notes (2026)

- **Reading:** Max-width measure (~65ch), comfortable line-height; **sticky mini-TOC** (anchors) on desktop in a left rail.
- **Chrome:** “Last updated” pill + optional “Print / Save PDF”.
- **Trust:** Cookie banner deep-link if required by region.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Terms of Service / Privacy / Cookies                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ TOC ─────┐  ┌─ MAIN PROSE (rich text) ─────────────────────────────────────────────┐ │
│ │ §1 …     │  │  H1 page title                                                     │ │
│ │ §2 …     │  │  Intro paragraph                                                   │ │
│ │ …        │  │  Section headings + body                                           │ │
│ │ (sticky) │  │  …                                                                 │ │
│ └──────────┘  │  Last updated: [date]     [Print]                                   │ │
│               └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Legal / Static Pages** — UI wireframe specification

</div>
