<div align="center">

# System Configuration

### **Google Stitch** — Visual system: [`theme.md`](../theme.md). **Surface:** Admin (operations console). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

</div>

---

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  System Configuration                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ GLOBAL SETTINGS ──────────────────────────────────────────────────────┐  │
│  │  Key              Value                           [Edit]               │  │
│  │  MAX_UPLOAD_SIZE  50MB                           [Edit]               │  │
│  │  DEFAULT_LANG     en                              [Edit]               │  │
│  │  ...                                                                   │  │
│  │  Edit: key: [MAX_UPLOAD_SIZE] value: [50MB] [Save]                     │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ FEATURE FLAGS ───────────────────────────────────────────────────────┐  │
│  │  Flag                  Enabled?   Action                               │  │
│  │  enable_2fa            [✔]         [Disable]                           │  │
│  │  dark_mode             [ ]         [Enable]                            │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ MAINTENANCE MODE ───────────────────────────────────────────────────┐   │
│  │  Enabled: [ ]   Message: [Upgrading database...]                      │   │
│  │  Estimated End: [2026-05-10T02:00:00Z]                                │   │
│  │  [Toggle Maintenance]                                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ BACKGROUND JOBS ─────────────────────────────────────────────────────┐  │
│  │  Data Binding: GET /system/jobs                                        │  │
│  │  Job ID        Queue              Status    Created        Actions      │  │
│  │  job_123       email-notify       FAILED    2026-05-10     [Retry]     │  │
│  │  job_456       report-gen         RUNNING   2026-05-10     [Cancel]    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ CACHE ───────────────────────────────────────────────────────────────┐  │
│  │  Clear pattern: [user_profile_*  ] [Clear]  [Clear All Cache]          │  │
│  │  Clear specific key: [mykey] [Clear]                                   │  │
│  │  Data Binding: POST /system/cache/clear/:key or /system/cache/clear    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ EMAIL TEMPLATES ─────────────────────────────────────────────────────┐  │
│  │  Data Binding: GET /system/email-templates                             │  │
│  │  Template ID       Subject            Action                           │  │
│  │  welcome_email     Welcome to Nest!   [Edit] [Preview] [TestSend]      │  │
│  │  Edit: subject [Welcome to Nestlancer!], body (HTML/Handlebars)        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ ANNOUNCEMENTS ───────────────────────────────────────────────────────┐  │
│  │  Title: [Scheduled Maintenance]   Type: [INFO ▼] (INFO/WARN/CRITICAL)  │  │
│  │  Message: [System will be down...]  Dismissable: [✔]                  │  │
│  │  Scheduled For: [2026-05-10T00:00Z]  Expires At: [2026-05-11T00:00Z]  │  │
│  │  [Send Announcement] (POST /system/announcements)                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ SYSTEM LOGS ─────────────────────────────────────────────────────────┐  │
│  │  Data Binding: GET /system/logs | GET /system/logs/download          │  │
│  │  Level: [error ▼] Service: [auth-service ▼] From: [...] To: [...]     │  │
│  │  [View Logs] [Download Logs]                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

---

---

<div align="center">

**System Configuration** — UI wireframe specification

</div>
