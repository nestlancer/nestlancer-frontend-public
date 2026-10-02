import { redirect } from 'next/navigation';

import { routes } from '@nestlancer/constants';

/** Sessions live under Security — keep the documented /settings/sessions path working. */
export default function SettingsSessionsPage() {
  redirect(routes.settingsSecurity);
}
