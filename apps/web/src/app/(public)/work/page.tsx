import { redirect } from 'next/navigation';

import { routes } from '@nestlancer/constants';

export default function PublicProjectsPage() {
  redirect(routes.portfolio);
}
