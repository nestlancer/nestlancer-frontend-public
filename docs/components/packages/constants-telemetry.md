<div align="center">

# Nestlancer frontend telemetry contract

### Lightweight analytics events emitted from web/admin clients. Events are dispatched as browser `CustomEvent('nestlancer:telemetry')` and logged in development via `trackEvent()` in each app.

</div>

---

## 📖 Table of Contents

- [Event catalog](#event-catalog)
- [Listening in the browser](#listening-in-the-browser)
- [Feature flags (rollout)](#feature-flags-rollout)
- [Query invalidation map](#query-invalidation-map)
- [Adding a new event](#adding-a-new-event)

---

## Event catalog

| Event key                       | Constant                                     | When fired                         | Payload                                                 |
| :------------------------------ | :------------------------------------------- | :--------------------------------- | :------------------------------------------------------ |
| `command_palette_opened`        | `analyticsEvents.commandPaletteOpened`       | Cmd/Ctrl+K or palette UI open      | `{ app: 'web' \| 'admin', source: 'shortcut' \| 'ui' }` |
| `command_palette_item_selected` | `analyticsEvents.commandPaletteItemSelected` | User selects a palette item        | `{ app, itemId, target }`                               |
| `request_search_submitted`      | `analyticsEvents.requestSearchSubmitted`     | Debounced `?q=` search on Work Hub | `{ query, page, statusFilter, view }`                   |
| `payment_checkout_started`      | `analyticsEvents.paymentCheckoutStarted`     | Razorpay flow begins               | `{ projectId, milestoneId, amount, mode }`              |
| `payment_checkout_completed`    | `analyticsEvents.paymentCheckoutCompleted`   | Payment confirm succeeds           | `{ projectId, milestoneId, paymentIntentId }`           |
| `payment_checkout_failed`       | `analyticsEvents.paymentCheckoutFailed`      | Start, gateway, or confirm failure | `{ projectId, milestoneId, stage, message }`            |

---

## Listening in the browser

```ts
window.addEventListener('nestlancer:telemetry', (e: Event) => {
  const { name, payload } = (e as CustomEvent).detail;
  // forward to PostHog / Segment / Datadog RUM
});
```

---

## Feature flags (rollout)

See `src/feature-flags.ts`. Environment variables:

| Flag                       | Env var                                          | Default |
| :------------------------- | :----------------------------------------------- | :------ |
| Web command palette        | `NEXT_PUBLIC_FEATURE_COMMAND_PALETTE_WEB`        | on      |
| Admin command palette      | `NEXT_PUBLIC_FEATURE_COMMAND_PALETTE_ADMIN`      | on      |
| Project hub contract strip | `NEXT_PUBLIC_FEATURE_PROJECT_HUB_CONTRACT_STRIP` | on      |
| Landing hero revamp        | `NEXT_PUBLIC_FEATURE_LANDING_HERO_REVAMP`        | on      |

Set to `false`, `0`, or `off` to disable without redeploying logic (requires app restart for Next.js `NEXT_PUBLIC_*`).

---

## Query invalidation map

See `src/invalidation-map.ts` for TanStack Query keys to invalidate per mutation action.

---

## Adding a new event

1. Add to `src/analytics-events.ts`.
2. Call `trackEvent(analyticsEvents.yourEvent, { ... })` from the app `lib/telemetry.ts` helper.
3. Document the payload in this file.
4. Avoid duplicate fires on React Strict Mode re-renders (use mutation success or debounced effects, not render).

---

<div align="center">

**Nestlancer frontend telemetry contract** — Nestlancer backend component documentation

</div>
