<div align="center">

# Blog Analytics Admin

### **Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Admin (operations console). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

</div>

---

Dashboard for administrators to track blog performance and engagement (`admin/blog/analytics`).

---

## 📐 Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  Blog Analytics                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ OVERVIEW METRICS ─────────────────────────────────────────────────────┐  │
│  │  Total Views: 15,402  |  Total Comments: 342  |  Total Bookmarks: 890  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ ENGAGEMENT CHART ─────────────────────────────────────────────────────┐  │
│  │  [ Bar chart showing views/comments over the last 30 days ]            │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ TOP POSTS ────────────────────────────────────────────────────────────┐  │
│  │  Rank  Post Title                              Views    Comments       │  │
│  │  1     How to use NestJS with React            4,500    120            │  │
│  │  2     The Future of Freelancing               3,200    85             │  │
│  │  3     Understanding TypeScript Generics       2,100    40             │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Interactive Elements

- Time range selector `{Last 30 Days}` (updates charts).

---

## Data Bindings

- Overview Metrics & Chart: `GET /admin/blog/analytics/engagement`
- Top Posts List: `GET /admin/blog/analytics/top-posts`

---

<div align="center">

**Blog Analytics Admin** — UI wireframe specification

</div>
