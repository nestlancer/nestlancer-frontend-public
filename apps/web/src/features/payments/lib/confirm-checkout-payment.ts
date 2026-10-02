export type CheckoutConfirmPayload = {
  paymentIntentId: string;
  externalPaymentId: string;
  signature: string;
};

/**
 * POST /payments/confirm is a payment write.
 * One attempt only — a lost response is recovered by polling payment status,
 * not by replaying the confirm call.
 */
export async function confirmCheckoutPayment(
  confirmFn: (payload: CheckoutConfirmPayload) => Promise<unknown>,
  payload: CheckoutConfirmPayload,
  session: {
    hasAccessToken: () => boolean;
    refreshSession: () => Promise<unknown>;
  }
): Promise<void> {
  if (!session.hasAccessToken()) {
    await session.refreshSession();
  }
  await confirmFn(payload);
}
