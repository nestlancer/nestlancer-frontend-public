<div align="center">

# Media Admin

### **Google Stitch** — Visual system: [`theme.md`](../theme.md). **Surface:** Admin (operations console). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

</div>

---

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Media Admin                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Filter: Type [All ▼]  Status [All ▼]  User: [All ▼]  Page: [1]             │
│                                                                              │
│  ┌─ ALL MEDIA GRID ───────────────────────────────────────────────────────┐  │
│  │  (grid or table similar to user media library, with owner column)      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ QUARANTINE QUEUE ─────────────────────────────────────────────────────┐  │
│  │  Data Binding: GET /admin/media/quarantine                             │  │
│  │  File Name       Owner       Flag Reason        Actions                │  │
│  │  sus_file.exe    user_42     Malware Scan       [Release] [Delete]     │  │
│  │  nsfw_img.jpg    user_11     NSFW Detected      [Release] [Delete]     │  │
│  │                                                                        │  │
│  │  Actions: POST /quarantine/:id/release | DELETE /quarantine/:id        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  [Storage Analytics] [Usage]                                                  │
│  Actions on file: [Reprocess] [Delete] [Run Cleanup]                         │
│  [Update Settings] – allowed MIME types, upload limits.                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

---

---

<div align="center">

**Media Admin** — UI wireframe specification

</div>
