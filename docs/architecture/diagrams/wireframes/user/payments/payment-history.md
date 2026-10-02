<div align="center">

# Payment History

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** User (authenticated client app). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Payments                                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  Filter: Status [All ▼]  Project: [All ▼]   Page: [1] Limit: [20]           │
│                                                                              │
│  ┌─ PAYMENT LIST ───────────────────────────────────────────────────────┐   │
│  │  ID        Project       Amount   Status     Date       Actions       │   │
│  │  pay_001   CRM Redesign  ₹5,000   COMPLETED  May 01    [Receipt]     │   │
│  │  pay_002   Mobile App    ₹2,500   PENDING    May 10    [Cancel]      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ INVOICES ───────────────────────────────────────────────────────────┐   │
│  │  Data Binding: GET /invoices | GET /invoices/:id/download            │   │
│  │  Invoice ID    Date          Amount      Status     Actions          │   │
│  │  inv_123       May 01        ₹5,000      PAID       [Download PDF]   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Stats: Total Spent ₹7,500, Pending ₹2,500                                   │
│                                                                              │
│  [New Payment] – redirects to project/milestone selection to initiate          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

---

<div align="center">

**Payment History** — UI wireframe specification

</div>
