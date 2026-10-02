<div align="center">

# Post Detail

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Public (marketing, portfolio, blog, auth, legal). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

---

## 📡 Gateway API (`swagger-docs/openapi-gateway.json`)

| Action                | Endpoint                                      | Auth                                            |
| :-------------------- | :-------------------------------------------- | :---------------------------------------------- |
| Load post             | `GET /api/v1/blog/posts/{slug}`               | Public                                          |
| Related               | `GET /api/v1/blog/posts/{slug}/related`       | Public                                          |
| View analytics        | `POST /api/v1/blog/posts/{slug}/view`         | Public (fire once / session)                    |
| Comments list         | `GET /api/v1/blog/posts/{slug}/comments`      | Public                                          |
| Add comment           | `POST /api/v1/blog/posts/{slug}/comments`     | **Bearer**                                      |
| Edit / delete comment | `PATCH` / `DELETE` `.../comments/{commentId}` | **Bearer**                                      |
| Like post             | `POST /api/v1/blog/posts/{slug}/like`         | **Bearer**                                      |
| Bookmark              | `POST /api/v1/blog/posts/{slug}/bookmark`     | **Bearer** (list: `GET /api/v1/blog/bookmarks`) |

---

## ✨ Modern UI notes (2026)

- **Reading:** Progress bar top; **TOC** sticky in right rail (desktop); generous typography scale.
- **Header:** Author **avatar card**, reading time, share sheet (copy link, LinkedIn, X).
- **Engagement:** Like / bookmark as icon toggles with count; disabled + tooltip when logged out.
- **Comments:** Thread with **inline reply** affordance; report as overflow menu.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Blog   [← Back]                              [Share ▼]  [❤ Like*]  [🔖 Save*]  (*auth) │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌─ ARTICLE ─────────────────────────────────────┬─ TOC (sticky) ───┐ │
│ │ Author card  │ │ H1 title                                                   │ On… │ │
│ │ avatar name  │ │ By … · date · category · N min read                      │ this…│ │
│ │ role / bio   │ │ Tags: [chip] [chip]                                        │ page │ │
│ └──────────────┘ ├────────────────────────────────────────────────────────────┴──────┘ │
│                  │ Markdown / rich content (code blocks, callouts)                    │
│                  └────────────────────────────────────────────────────────────────────│
│  ┌─ RELATED (from /related) ──────────────────────────────────────────────────────────┐ │
│  │  3 horizontal cards (scroll-snap on mobile)                                        │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ COMMENTS ─────────────────────────────────────────────────────────────────────────┐ │
│  │  If guest: [Log in to comment]                                                     │ │
│  │  If user: composer + markdown hint + [Post]                                       │ │
│  │  Thread: avatar · body · time · [Reply] [⋯ report]                                 │ │
│  │  [Load more]                                                                       │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Post Detail** — UI wireframe specification

</div>
