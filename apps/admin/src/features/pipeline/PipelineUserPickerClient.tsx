'use client';

import { useRouter } from 'next/navigation';

import { GeCard, GeCardHeader, GePageHeader } from '@/components/admin/AdminGentelellaUI';
import { UserSearchCombobox } from '@/components/admin/UserSearchCombobox';

import { PipelineHubTabs } from './PipelineHubTabs';

export function PipelineUserPickerClient() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <PipelineHubTabs />

      <GePageHeader
        pretitle="Operations · User pipeline"
        title="User hub"
        description="Select a client to open their 360° pipeline dashboard — requests, quotes, projects, payments, and trust in one view."
      />

      <GeCard flush>
        <GeCardHeader title="Select user" subtitle="Search by name or email" />
        <div className="ge-card-body max-w-md">
          <UserSearchCombobox
            onChange={(id) => {
              if (id) router.push(`/pipeline/users/${id}`);
            }}
            placeholder="Search users…"
          />
        </div>
      </GeCard>
    </div>
  );
}
