import { redirect } from 'next/navigation';

import { routes } from '@nestlancer/constants';

/** Billing lives at /payments — keep the documented /settings/billing path working. */
export default function SettingsBillingPage() {
  redirect(routes.payments);
}
