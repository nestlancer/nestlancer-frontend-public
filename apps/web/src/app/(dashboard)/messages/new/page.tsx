import { redirect } from 'next/navigation';

export default function NewMessagePage() {
  redirect('/messages/new/direct');
}
