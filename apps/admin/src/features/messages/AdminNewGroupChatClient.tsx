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

export function AdminNewGroupChatClient() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);

  const create = useMutation({
    mutationFn: () =>
      apiServices.messaging.createGroupThread({
        title: title.trim() || undefined,
        clientUserIds: selectedUsers.map((u) => u.id),
      }),
    onSuccess: (thread) => {
      toast.success('Group created');
      router.push(`/messages/thread/${thread.id}`);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create group')),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Operations"
        title="New group chat"
        description="Search and add at least two client users to the group."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/messages">Back to messages</Link>
          </Button>
        }
      />
      <div className="ge-card max-w-lg space-y-5 rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="space-y-1.5 text-sm">
          <FormFieldLabel
            fieldKey="messages.groupTitle"
            label="Title"
            htmlFor="messages-group-title"
          >
            Title (optional)
          </FormFieldLabel>
          <input
            id="messages-group-title"
            name="title"
            className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Launch war room"
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <FormFieldLabel
            fieldKey="messages.memberIds"
            label="Client users"
            htmlFor="messages-group-members"
          >
            Client users
          </FormFieldLabel>
          <UserSearchCombobox
            id="messages-group-members"
            name="clientUserIds"
            mode="multi"
            values={selectedUsers}
            onChange={setSelectedUsers}
            roleFilter="USER"
            placeholder="Add clients to group…"
          />
          <p className="text-xs text-muted-foreground">Select at least two clients.</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" asChild>
            <Link href="/messages">Cancel</Link>
          </Button>
          <Button
            type="button"
            disabled={create.isPending || selectedUsers.length < 2}
            onClick={() => create.mutate()}
          >
            {create.isPending ? 'Creating…' : 'Create group'}
          </Button>
        </div>
      </div>
    </div>
  );
}
