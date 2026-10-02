import { MessageSquare } from '@nestlancer/ui/icons';
import { routes } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';

import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';

export function MessagesEmptyState() {
  return (
    <div className="relative flex min-h-[50vh] flex-1 flex-col items-center justify-center px-6 py-16 text-center lg:min-h-0">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ta-brand-50 text-ta-brand-600 ring-1 ring-ta-brand-500/15 dark:bg-ta-brand-500/[0.12] dark:text-ta-brand-400">
        <MessageSquare className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        Select a conversation
      </h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Choose a thread from the inbox to read and reply. Project chats and direct messages live
        here.
      </p>
      <Button className={`mt-6 ${webPrimaryButtonClass}`} asChild>
        <a href={routes.messageNewDirect}>Message support</a>
      </Button>
    </div>
  );
}
