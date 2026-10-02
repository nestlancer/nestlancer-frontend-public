<div align="center">

# Preferences Tab

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** User (authenticated client app). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Account Settings                                                             │
│  [Profile] [Security] [Preferences] [Activity Log]                            │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ NOTIFICATIONS ───────────────────────────────────────────────────────┐   │
│  │  Email Digest Frequency:  [Weekly ▼]  (daily / weekly / never)        │   │
│  │  Push Notifications:                                                    │   │
│  │    [✔] Messages        [✔] Project Updates                            │   │
│  │  In‑App Notifications:                                                  │   │
│  │    [✔] General Alerts  [✔] Mention Activity                            │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ PRIVACY ─────────────────────────────────────────────────────────────┐   │
│  │  Profile Visibility:   [Public ▼] (Public / Private / Connections)     │   │
│  │  [ ] Show email on public profile                                      │   │
│  │  [ ] Show phone on public profile                                      │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ PUSH DEVICES (optional, can be integrated) ──────────────────────────┐   │
│  │  Registered Devices:                                                    │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │ ● Chrome on Windows  (token: fcm_...123)  [Remove]               │  │   │
│  │  │ ● Android App       (token: fcm_...456)  [Remove]               │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  │  [Register New Device] – opens modal: token, deviceId, platform.        │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [Save Preferences]                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Preferences Tab** — UI wireframe specification

</div>
