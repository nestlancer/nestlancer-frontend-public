export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus | string;
  projectId?: string;
  createdAt: string;
  /** True when installment is due under milestone hub / create-intent rules (NL-PAY-007). */
  canPay?: boolean;
  project?: {
    id?: string;
    title?: string;
    name?: string;
  } | null;
  milestone?: {
    id?: string;
    name?: string;
  } | null;
}
