/** When the client may pay this installment (matches OpenAPI PaymentScheduleInstallmentDtoDueTrigger). */
export type PaymentScheduleDueTrigger = 'on_accept' | 'on_prior_approved' | 'on_date';

export type PaymentScheduleInstallmentType = 'advance' | 'milestone' | 'final' | 'fullPayment';

/** Stored installment shape (server response; amounts in paise). */
export type PaymentScheduleInstallment = {
  label: string;
  amountPaise: number;
  percentage?: number;
  dueTrigger: PaymentScheduleDueTrigger;
  dueDate?: string;
  type?: PaymentScheduleInstallmentType;
  order?: number;
};

/** Built-in presets — matches OpenAPI CreateQuoteDtoSchedulePreset. */
export type PaymentSchedulePresetId =
  | '50-50'
  | '30-70'
  | '30-40-30'
  | '25-25-25-25'
  | '100-upfront';

export type PaymentSchedulePresetDefinition = {
  id: PaymentSchedulePresetId;
  label: string;
  description: string;
  installments: Array<{
    label: string;
    percentage: number;
    dueTrigger: PaymentScheduleDueTrigger;
    type?: PaymentScheduleInstallmentType;
  }>;
};

/**
 * API request installment row (CreateQuoteDto.paymentSchedule).
 * Use `amount` (major currency) and/or `percentage` — not amountPaise.
 */
export type PaymentScheduleInstallmentInput = {
  label: string;
  percentage?: number;
  amount?: number;
  dueTrigger?: PaymentScheduleDueTrigger;
  dueDate?: string;
};

/** Payload helpers for quote create/update. */
export type PaymentSchedulePayload = {
  schedulePreset?: PaymentSchedulePresetId;
  paymentSchedule?: PaymentScheduleInstallmentInput[];
};
