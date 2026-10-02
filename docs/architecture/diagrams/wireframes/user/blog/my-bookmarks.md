<div align="center">

# My Bookmarks

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** User (authenticated client app). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.
User dashboard view displaying saved/bookmarked blog posts (`user/bookmarks`).

---

## 📐 Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  My Bookmarks                                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ BOOKMARKED POSTS ─────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  [Image Thumbnail]  How to use NestJS with React                       │  │
│  │                     Saved on: 2026-05-01                               │  │
│  │                     [Read Post]  [Remove Bookmark]                     │  │
│  │                                                                        │  │
│  │  [Image Thumbnail]  Understanding TypeScript Generics                  │  │
│  │                     Saved on: 2026-04-20                               │  │
│  │                     [Read Post]  [Remove Bookmark]                     │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Interactive Elements

- `[Read Post]`: Navigates to `/blog/:slug`.
- `[Remove Bookmark]`: Triggers `DELETE /posts/:slug/bookmark` or `DELETE /bookmarks` and removes item from list.

---

## Data Bindings

- Bookmarks List: `GET /bookmarks`

---

<div align="center">

**My Bookmarks** — UI wireframe specification

</div>
