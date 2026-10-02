<div align="center">

# Payments Admin

### **Google Stitch** — Visual system: [`theme.md`](../theme.md). **Surface:** Admin (operations console). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

</div>

---

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Payments Admin                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│  Filter: Status [All ▼]  Project: [All ▼]  Page: [1] Limit: [20]             │
│                                                                              │
│  ┌─ PAYMENTS TABLE ───────────────────────────────────────────────────────┐  │
│  │  ID      User/Project  Amount  Status    Date       Actions            │  │
│  │  pay_001 John (Proj A) $500    COMPLETED 2026-05-01 [Details] [Refund] │  │
│  │  pay_002 Jane (Proj B) $250    PENDING   2026-05-10 [Verify] [Cancel]  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Tabs: [Payments] [Milestones] [Disputes] [Revenue Reports] [Settings]        │
│                                                                              │
│  Payment Detail: timeline, transactions, [Process Refund], [Verify]          │
│  Refund modal: amount (optional, full otherwise), reason.                     │
│                                                                              │
│  Milestones Admin: create bulk per project, update, mark complete, release    │
│  payment, request payment. List with filters.                                 │
│                                                                              │
│  ┌─ DISPUTES MANAGEMENT (GET /admin/payments/disputes) ───────────────────┐  │
│  │  ID      Payment ID   User      Reason        Status     Actions       │  │
│  │  dsp_123 pay_001      John      Not Delivered OPEN       [Respond]     │  │
│  │  dsp_124 pay_002      Jane      Unauthorized  RESOLVED   [Details]     │  │
│  │                                                                        │  │
│  │  Dispute Actions: [Resolve Dispute] (POST /disputes/:id/resolve)       │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ RECONCILIATION ───────────────────────────────────────────────────────┐  │
│  │  Data Binding: GET /admin/payments/reconciliation                      │  │
│  │  Unreconciled Transactions: 45                                         │  │
│  │  [Reconcile Payments] (POST /admin/payments/reconcile)                 │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Revenue Reports: export, from/to date, groupBy.                              │
│  Manual Payment Entry: form for creating manual payment records.             │
│  Settings: supported methods, platform fees.                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

---

---

<div align="center">

**Payments Admin** — UI wireframe specification

</div>
