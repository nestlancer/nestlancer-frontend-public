export const analyticsEvents = {
  commandPaletteOpened: 'command_palette_opened',
  commandPaletteItemSelected: 'command_palette_item_selected',
  requestSearchSubmitted: 'request_search_submitted',
  paymentCheckoutStarted: 'payment_checkout_started',
  paymentCheckoutCompleted: 'payment_checkout_completed',
  paymentCheckoutFailed: 'payment_checkout_failed',
} as const;

export type AnalyticsEventName = (typeof analyticsEvents)[keyof typeof analyticsEvents];
