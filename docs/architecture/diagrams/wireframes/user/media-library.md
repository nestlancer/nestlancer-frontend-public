<div align="center">

# Media Library

### **Google Stitch** — Visual system: [`theme.md`](../theme.md). **Surface:** User (authenticated client app). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

</div>

---

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Media Library                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│  Filter: Type [All ▼]  Status [All ▼]  Page: [1] Limit: [20] Sort: [Newest] │
│                                                                              │
│  ┌─ MEDIA GRID ──────────────────────────────────────────────────────────┐  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                 │  │
│  │  │ thumb│ │thumb │ │thumb │ │thumb │                                 │  │
│  │  │ .png │ │ .jpg │ │ .pdf │ │ .doc │                                 │  │
│  │  │Ready │ │Ready │ │Ready │ │Failed│                                 │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  Selected file actions: [Download] [Edit Metadata] [Delete] [Copy] [Move]    │
│                                                                              │
│  ┌─ UPLOAD SECTION ──────────────────────────────────────────────────────┐  │
│  │  [Request Upload] – enter filename, mime, size, fileType, projectId, etc.│
│  │  [Direct Upload] – file picker + type + projectId                      │  │
│  │  [Confirm Upload] – uploadId after direct upload                       │  │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Storage Usage: 2.1 GB of 10 GB (21%)                                       │
│                                                                              │
│  Media Detail (click on file):                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  File: screenshot.png · Size: 1.2 MB · Type: IMAGE · Status: READY   │   │
│  │  Uploaded: 2026-05-01                                                 │   │
│  │  [Download] [Regenerate Thumbnail] [View Versions] [Share]            │   │
│  │  Metadata: filename, description, custom fields [Edit]                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ VERSION HISTORY (GET /media/:id/versions) ───────────────────────────┐  │
│  │  v2  screenshot_edit.png  May 10  [Restore]                           │  │
│  │  v1  screenshot.png       May 01  [Restore]                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ SHARE SETTINGS (POST /media/:id/share) ──────────────────────────────┐  │
│  │  Share modal: expiresInSeconds, passwordProtected, allowedEmails      │  │
│  │  [Create Share Link]  (list shared links with [Revoke] action)        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

That concludes Part 2 — all authenticated user pages.  
Shall I proceed with **Part 3 (Admin Pages)** now?
Part 3 — Admin Pages. These wireframes cover all administrative interfaces from the webpage list.

---

---

---

<div align="center">

**Media Library** — UI wireframe specification

</div>
