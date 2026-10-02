<div align="center">

# Notification Templates Admin

### **Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Admin (operations console). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

</div>

---

This page allows administrators to manage push and in-app notification templates (`admin/notifications/templates`).

---

## 📐 Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  Notification Templates                                          [+ New]      │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ TEMPLATES LIST ───────────────────────────────────────────────────────┐  │
│  │  ID   Type      Title                     Status         Actions       │  │
│  │  1    Push      New Message Received      Active         [Edit] [Del]  │  │
│  │  2    In-App    Payment Confirmed         Active         [Edit] [Del]  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ TEMPLATE EDITOR ──────────────────────────────────────────────────────┐  │
│  │  Type: ( ) Push   (x) In-App                                           │  │
│  │  Title: [Payment Confirmed                                  ]          │  │
│  │  Body:                                                                 │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  │ Your payment for {{project.name}} has been confirmed.            │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │
│  │                                                                        │  │
│  │  Action Link: [/projects/{{project.id}}/payments            ]          │  │
│  │                                                                        │  │
│  │  [Save Template]  [Cancel]                                             │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Interactive Elements

- `[+ New]`: Clears editor to create a new template (triggers `POST /admin/notifications/templates`).
- `[Edit]`: Loads template details into the editor.
- `[Del]`: Deletes the template (triggers `DELETE /admin/notifications/templates/:id`).
- `[Save Template]`: Saves the new or updated template (triggers `PATCH` or `POST`).

---

## Data Bindings

- List: `GET /admin/notifications/templates`
- Editor fields map to NotificationTemplate DTO (`title`, `body`, `actionUrl`, `type`).

---

<div align="center">

**Notification Templates Admin** — UI wireframe specification

</div>
