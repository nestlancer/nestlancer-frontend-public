import { redirect } from 'next/navigation';

import { routes } from '@nestlancer/constants';

/** Short alias for document HMAC verify (NL-BUG-UI-015 /verify 404). */
export default function VerifyAliasPage() {
  redirect(routes.verifyDocument);
}
