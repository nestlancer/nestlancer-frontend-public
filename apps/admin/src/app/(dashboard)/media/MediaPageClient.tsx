'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AdminMediaStorageBrowser } from '@/features/media/AdminMediaStorageBrowser';
import { AdminMediaAnalyticsClient } from '@/features/media/AdminMediaAnalyticsClient';
import { AdminMediaQuarantineClient } from '@/features/media/AdminMediaQuarantineClient';
import { GePageHeader } from '@/components/admin/AdminGentelellaUI';
import { AdminTabBar } from '@/components/admin/AdminPageChrome';

const TABS = ['Storage', 'Quarantine', 'Analytics'] as const;
type Tab = (typeof TABS)[number];

function tabFromParam(value: string | null): Tab {
  if (value === 'quarantine') return 'Quarantine';
  if (value === 'analytics') return 'Analytics';
  return 'Storage';
}

function tabToParam(tab: Tab): string | null {
  if (tab === 'Quarantine') return 'quarantine';
  if (tab === 'Analytics') return 'analytics';
  return null;
}

export default function AdminMediaPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => tabFromParam(searchParams.get('tab')), [searchParams]);
  const tabIndex = TABS.indexOf(activeTab);

  const setActiveTab = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams(searchParams.toString());
      const tabParam = tabToParam(tab);
      if (tabParam) params.set('tab', tabParam);
      else params.delete('tab');
      if (tab !== 'Storage') {
        params.delete('visibility');
        params.delete('uploaderId');
        params.delete('fileType');
        params.delete('contextType');
        params.delete('mediaId');
      }
      const q = params.toString();
      router.replace(q ? `/media?${q}` : '/media');
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-6">
      <GePageHeader
        pretitle="Content"
        title="Media Library"
        description="Browse public and private storage, preview assets, and manage quarantine and analytics."
      />

      <AdminTabBar
        tabs={TABS.map((tab) => ({ label: tab }))}
        activeIndex={tabIndex >= 0 ? tabIndex : 0}
        onChange={(i) => setActiveTab(TABS[i] ?? 'Storage')}
      />

      {activeTab === 'Storage' && <AdminMediaStorageBrowser />}
      {activeTab === 'Quarantine' && <AdminMediaQuarantineClient />}
      {activeTab === 'Analytics' && <AdminMediaAnalyticsClient />}
    </div>
  );
}
