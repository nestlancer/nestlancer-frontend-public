<div align="center">

# System Health & Debug

### **Google Stitch** — Visual system: [`theme.md`](../theme.md). **Surface:** Admin (operations console). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

</div>

---

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  System Health                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ AGGREGATED HEALTH ────────────────────────────────────────────────────┐  │
│  │  Database: ✅    Cache: ✅    Queue: ✅   Storage: ✅   WebSocket: ✅    │  │
│  │  Microservices:   auth ✅   users ✅  projects ✅  payments ✅  ...     │  │
│  │  External: Razorpay ✅   SendGrid ✅   Cloudflare ✅                    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  [Detailed Diagnostics] – per-component breakdown with response times.        │
│  [Liveness] [Readiness] (probes)                                              │
│  [System Metrics] – CPU, memory, etc.                                        │
│  [Feature Flag Health] [Registry Health]                                     │
│                                                                              │
│  ┌─ ADMIN DEBUG ──────────────────────────────────────────────────────────┐  │
│  │  [Get Debug Info] – environment, deep-trace logs (admin only)          │  │
│  │  Output: (JSON/code block)                                             │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

This completes Part 3 — all Admin Pages. All three parts together provide comprehensive wireframe coverage for the entire Nestlancer platform based on the Swagger API and webpage list.
Would you like me to produce any specific section in more detail, or move on to another aspect (e.g., mobile views, user flow diagrams)?

---

---

<div align="center">

**System Health & Debug** — UI wireframe specification

</div>
