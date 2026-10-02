'use client';

import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button } from '@nestlancer/ui';

import { PageHeader } from '@/components/admin/AdminDataViews';
import { UserSearchCombobox, type UserOption } from '@/components/admin/UserSearchCombobox';
import { apiServices } from '@/lib/axios';

export function AdminNewDirectClient() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  const start = useMutation({
    mutationFn: (peerUserId: string) => apiServices.messaging.createDirectThread(peerUserId),
    onSuccess: (thread) => {
      toast.success('Conversation opened');
      router.push(`/messages/thread/${thread.id}`);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not start conversation')),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Operations"
        title="Message client"
        description="Start or resume a direct conversation with a client. Existing threads are reopened automatically."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/messages">Back to messages</Link>
          </Button>
        }
      />
      <div className="ge-card max-w-lg space-y-5 rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="space-y-1.5 text-sm">
          <FormFieldLabel
            fieldKey="messages.directPeer"
            label="Client"
            htmlFor="messages-direct-peer"
          >
            Client
          </FormFieldLabel>
          <UserSearchCombobox
            id="messages-direct-peer"
            name="peerUserId"
            mode="single"
            value={selectedUser?.id}
            displayName={selectedUser?.name}
            onChange={(_id, user) => setSelectedUser(user)}
            roleFilter="USER"
            placeholder="Search clients by name or email…"
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" asChild>
            <Link href="/messages">Cancel</Link>
          </Button>
          <Button
            type="button"
            disabled={!selectedUser || start.isPending}
            onClick={() => {
              if (selectedUser) start.mutate(selectedUser.id);
            }}
          >
            {start.isPending ? 'Opening…' : 'Open conversation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
