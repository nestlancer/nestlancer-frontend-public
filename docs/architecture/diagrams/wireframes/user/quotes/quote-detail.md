<div align="center">

# Quote Detail (with actions)

</div>

---

**Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** User (authenticated client app). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Quote #123                                   Status: Pending / Valid Until   │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ PAYMENT BREAKDOWN ────────────────────────────────────────────────────┐  │
│  │  Item                   Qty    Unit Price    Total                       │  │
│  │  Frontend UI Implementation  1    $2,500    $2,500                       │  │
│  │  Backend API Development     1    $4,000    $4,000                       │  │
│  │  Subtotal: $6,500  Tax (10%): $650  Total: $7,150                       │  │
│  │  Installments: Advance ($2,000), Milestone 1 ($3,150), Final ($2,000)    │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  [Accept Quote] – modal:                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ [✔] I agree to terms and conditions                                  │   │
│  │ Full Legal Name (e-signature): John Doe                              │   │
│  │ Signature Date: [2026-05-10]                                         │   │
│  │ Notes: Looking forward to working together!                          │   │
│  │ [Accept]                                                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [Decline Quote] – modal:                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Reason: [budgetConstraints ▼] (budget/timeline/scope/other)          │   │
│  │ Feedback: Budget higher than quarterly allocation.                   │   │
│  │ [✔] Request revised quote                                            │   │
│  │ [Decline]                                                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [Request Changes] – modal:                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Change 1: Area [budget ▼]  Request: Reduce total by 10%...           │   │
│  │ [+ Add Change]                                                       │   │
│  │ Additional Notes: ...                                                │   │
│  │ [Submit Change Request]                                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

---

---

<div align="center">

**Quote Detail (with actions)** — UI wireframe specification

</div>
