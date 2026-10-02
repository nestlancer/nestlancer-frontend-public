import { Inbox } from '@nestlancer/ui/icons';

import { routes } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';

import { EmptyState } from '@/components/common/EmptyState';

export function MessagesInboxPlaceholder() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center lg:min-h-[calc(100vh-12rem)]">
      <EmptyState
        className="max-w-md border-border/60 bg-card/40"
        title="Choose a conversation"
        description="Pick a thread from the list to read and reply. Project chats and direct messages with your team stay in one place."
        action={
          <Button variant="outline" className="rounded-xl" asChild>
            <a href={routes.messageNewDirect}>Message support</a>
          </Button>
        }
      />
      <div className="pointer-events-none hidden lg:flex absolute inset-0 items-center justify-center opacity-[0.07]">
        <Inbox className="h-48 w-48 text-primary" aria-hidden />
      </div>
    </div>
  );
}
