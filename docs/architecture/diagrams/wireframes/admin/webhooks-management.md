<div align="center">

# Webhooks Management

### **Google Stitch** — Visual system: [`theme.md`](../theme.md). **Surface:** Admin (operations console). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

</div>

---

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Webhooks                                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ WEBHOOKS LIST ────────────────────────────────────────────────────────┐  │
│  │  ID      URL                    Events          Status   Actions        │  │
│  │  wh_001  https://hooks.slack... payment.success  active   [Edit] [Test] │  │
│  │  wh_002  https://api.example... user.created     disabled [Enable]      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  [Create Webhook] (name, URL, events, headers, secret, retry policy)         │
│                                                                              │
│  Webhook Detail:                                                             │
│  ┌─ DELIVERIES ──────────────────────────────────────────────────────────┐  │
│  │  Time               Status    Response   Actions                       │  │
│  │  2026-05-10 10:00   DELIVERED 200 OK     [Retry]                       │  │
│  │  2026-05-10 10:05   FAILED    500         [Retry]                       │  │
│  │  Page: [1] Limit: [20]  Filter status: [All ▼]                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  Stats: success rate 95%, 3 failures.                                        │
│  [Enable] [Disable] [Regenerate Secret]                                       │
│                                                                              │
│  Available Events: payment.success, user.created, project.updated, ...        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

---

---

<div align="center">

**Webhooks Management** — UI wireframe specification

</div>
