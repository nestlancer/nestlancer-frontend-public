<div align="center">

# Razorpay test payments (dev)

</div>

---

## 📖 Table of Contents

- [Which option to choose in the checkout popup?](#which-option-to-choose-in-the-checkout-popup)
- [Option 1: Test card (recommended)](#option-1-test-card-recommended)
- [Option 2: UPI on desktop vs mobile (important)](#option-2-upi-on-desktop-vs-mobile-important)
- [Other test cards (optional)](#other-test-cards-optional)
- [End-to-end flow in Nestlancer](#end-to-end-flow-in-nestlancer)
- [What payment unlocks in dev](#what-payment-unlocks-in-dev)
- [Quick checklist](#quick-checklist)
- [Troubleshooting](#troubleshooting)
- [Dev URLs](#dev-urls)

---

## Which option to choose in the checkout popup?

| Option                   | Best for testing?     | Notes                                                                                 |
| :----------------------- | :-------------------- | :------------------------------------------------------------------------------------ |
| **Card**                 | **Yes — recommended** | Fastest on desktop; enter test card, then click **Success** on Razorpay’s test screen |
| **UPI**                  | Yes                   | Use `success@razorpay`; good to mimic UPI flow                                        |
| **Scan QR**              | Optional              | Same as UPI in test mode; often slower on desktop                                     |
| **Netbanking / Wallets** | Optional              | Also show a test **Success** / **Failure** page in test mode                          |

**Recommendation:** use **Card** first.

---

## Option 1: Test card (recommended)

In the Razorpay modal, choose **Card** and enter:

| Field           | Value                                 |
| :-------------- | :------------------------------------ |
| **Card number** | `4111 1111 1111 1111` (Visa)          |
|                 | or `5267 3181 8797 5449` (Mastercard) |
| **Expiry**      | Any **future** date (e.g. `12/30`)    |
| **CVV**         | Any 3 digits (e.g. `123`)             |
| **Name**        | Any name                              |

Razorpay then shows a **test payment page** (not a real bank). Click:

- **Success** → payment completes in Nestlancer (use this to unblock testing)
- **Failure** → only when testing failed-payment handling

After **Success**, the app calls `POST /api/v1/payments/confirm`. You should see **“Payment completed successfully”** and payment status **Completed** on `/payments`.

---

## Option 2: UPI on desktop vs mobile (important)

Razorpay and **NPCI do not allow typing a UPI ID on desktop browsers**. This is a platform rule, not a Nestlancer bug.

| Device                                      | UPI in Razorpay checkout                   | UPI ID text field                                           |
| :------------------------------------------ | :----------------------------------------- | :---------------------------------------------------------- |
| **Desktop browser** (Chrome, Firefox, etc.) | **QR code only** — scan with phone UPI app | **Not available** — Collect flow is ignored                 |
| **Mobile browser** (phone)                  | UPI Intent / Collect                       | **Available** — use **Pay with UPI ID** on the payment page |

Official references:

- [UPI Collect migration](https://razorpay.com/docs/announcements/upi-collect-migration/custom-integration/) — Collect (VPA entry) deprecated on web desktop
- [UPI Intent](https://razorpay.com/docs/payments/payment-methods/upi/upi-intent/) — Intent not supported on desktop web

### Pay with UPI on desktop (what actually works)

1. Click **Proceed to secure checkout**
2. Choose **UPI**
3. **Scan the QR code** with Google Pay, PhonePe, or Paytm on your phone
4. Approve the payment on the phone

There is no setting in our app or Razorpay Dashboard that enables a UPI ID input box on desktop.

### Pay with UPI ID typing (mobile only)

Open the same payment URL on your **phone** (not desktop). The **Pay with UPI ID** section appears and opens Razorpay with a VPA field.

| UPI ID (test)      | Result                                  |
| :----------------- | :-------------------------------------- |
| `success@razorpay` | Payment succeeds                        |
| `failure@razorpay` | Payment fails (error-flow testing only) |

On the Razorpay test screen, click **Success**.

### Optional: Razorpay Payment Configuration ID

Helps method order in the main modal; **does not** add UPI ID field on desktop.

1. [Razorpay Dashboard](https://dashboard.razorpay.com) → **Accounts & Settings** → **Payment Configuration**
2. Under **UPI**, enable **UPI ID/Number** (for mobile / supported flows)
3. Set `RAZORPAY_CHECKOUT_CONFIG_ID` (backend) and `NEXT_PUBLIC_RAZORPAY_CHECKOUT_CONFIG_ID` (frontend)

---

## Other test cards (optional)

| Use case                 | Card number           |
| :----------------------- | :-------------------- |
| Domestic Visa            | `4111 1111 1111 1111` |
| Domestic Mastercard      | `5267 3181 8797 5449` |
| International Mastercard | `5555 5555 5555 4444` |

Always use a **future** expiry and any **CVV** in test mode.

---

## End-to-end flow in Nestlancer

1. Open a project → **Pay now** on a milestone, or go to `/payments/[id]` → **Proceed to secure checkout**.
2. Razorpay modal opens (UPI, Card, Netbanking, Wallets).
3. Pay with test card or `success@razorpay`.
4. On Razorpay’s test page, click **Success**.
5. App confirms payment → toast + **Completed** on `/payments`.

---

## What payment unlocks in dev

Completing a milestone payment:

- Sets that **payment** row to `COMPLETED` in the database.
- Emits a `PAYMENT_COMPLETED` outbox event from the payments service.

It does **not** always move the **project** from `PENDING_PAYMENT` to `ACTIVE` automatically. If the project still looks “not started” after a successful payment, that can be expected in dev until project-status automation is wired.

You can still verify:

- Payments list and detail UI
- Receipt / invoice links (when available)
- Progress, messaging, and other flows on projects that are already **ACTIVE**

### Workarounds to test the rest of the product

1. **Admin** — set project status to `ACTIVE` after payment.
2. Use a project that is already **ACTIVE** and pay only to test billing.
3. **Database (dev only)** — e.g.:

```sql
UPDATE "Project"
SET status = 'ACTIVE'
WHERE id = '<your-project-id>';
```

---

## Quick checklist

- [ ] Test keys only (`rzp_test_...`), not live keys
- [ ] Card `4111 1111 1111 1111` **or** UPI `success@razorpay`
- [ ] Click **Success** on Razorpay’s test page (not Failure)
- [ ] Toast: “Payment completed successfully”
- [ ] `/payments` shows status **Completed**
- [ ] If project blocked, set **ACTIVE** in admin or DB (dev)

---

## Troubleshooting

| Symptom                                  | What to check                                                                                   |
| :--------------------------------------- | :---------------------------------------------------------------------------------------------- |
| Popup does not open                      | `NEXT_PUBLIC_RAZORPAY_KEY_ID` in frontend Docker / `.env.development`                           |
| UPI shows QR only on desktop             | **Expected.** Use QR + phone app, **Card**, or open payment page on **mobile** for UPI ID field |
| “Payment intent did not return order id” | Backend `create-intent` / Razorpay order (receipt must be ≤ 40 chars)                           |
| Success in Razorpay but app error        | Browser Network → `POST /payments/confirm` (401, signature, 500)                                |
| Card “invalid” in popup                  | Live keys by mistake; use test keys only                                                        |
| `Failed to create Razorpay order`        | Backend `RAZORPAY_KEY_SECRET`, network to Razorpay API                                          |

---

## Dev URLs

| App           | URL                                       |
| :------------ | :---------------------------------------- |
| Web (client)  | `https://dev-web.nestlancer.com`          |
| API / WS      | `https://dev.nestlancer.com`              |
| Payments page | `https://dev-web.nestlancer.com/payments` |

---

<div align="center">

**Razorpay test payments (dev)** — Nestlancer guide

</div>
