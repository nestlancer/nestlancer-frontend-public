'use client';

import { WebPanel } from '@/components/web/WebPanel';
import { MessageThreadClient } from '@/features/messaging/MessageThreadClient';

export function ProjectHubMessagesTab({ projectId }: { projectId: string }) {
  return (
    <WebPanel padding="none" className="overflow-hidden">
      <MessageThreadClient projectId={projectId} layout="embedded" />
    </WebPanel>
  );
}
