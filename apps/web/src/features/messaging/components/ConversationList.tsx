import type { Conversation } from '@nestlancer/types';
import { Card } from '@nestlancer/ui';

export function ConversationList({ items }: { items: Conversation[] }) {
  return (
    <ul className="space-y-2" aria-label="Conversations">
      {items.map((c) => (
        <li key={c.id}>
          <Card className="p-4 text-sm">{c.title ?? c.id}</Card>
        </li>
      ))}
    </ul>
  );
}
