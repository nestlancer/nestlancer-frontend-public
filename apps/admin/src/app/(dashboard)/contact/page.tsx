import type { Metadata } from 'next';
import { ContactClient } from '@/features/contact/ContactClient';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return <ContactClient />;
}
