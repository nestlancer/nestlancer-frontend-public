'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@nestlancer/api-client';
import { getFieldHelp } from '@nestlancer/field-help';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ErrorState,
  Input,
  SkeletonTable,
  Switch,
  Textarea,
  cn,
  toast,
} from '@nestlancer/ui';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { DebugApiSection } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminMetricStrip,
  AdminTabBar,
  adminTableHeadRowClass,
  adminTableRowClass,
  adminTableShellClass,
  adminTableTdClass,
  adminTableTdMutedClass,
  adminTableThClass,
} from '@/components/admin/AdminPageChrome';
import { SliceFaultBanner } from '@/components/admin/AdminCharts';
import {
  extractFeatureFlagRows,
  FeatureFlagList,
  SettingsRow,
  SettingsSection,
} from '@/components/admin/AdminSettingsSections';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRows, rowId } from '@/lib/admin-response';
import { humanizeKey, type KpiItem } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

import { toEmailPreviewDocument } from './email-preview-html';

const SLICE_NAMES = [
  'Health',
  'Config',
  'Features',
  'Jobs',
  'Email templates',
  'Notifications',
] as const;

type SystemTab = 'health' | 'config' | 'features' | 'jobs' | 'templates' | 'operations';
type TemplatePane = 'email' | 'notifications';

const SYSTEM_TABS: { id: SystemTab; label: string }[] = [
  { id: 'health', label: 'Health' },
  { id: 'config', label: 'Config' },
  { id: 'features', label: 'Features' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'templates', label: 'Templates' },
  { id: 'operations', label: 'Operations' },
];

function parseSystemTab(raw: string | null): SystemTab {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'logs') return 'operations';
  if (SYSTEM_TABS.some((t) => t.id === value)) return value as SystemTab;
  return 'health';
}

function parseTemplatePane(raw: string | null): TemplatePane {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'notifications' || value === 'notification') return 'notifications';
  return 'email';
}

/** Keys managed by Operations / derived history — show read-only in Config. */
const READ_ONLY_CONFIG_KEYS = new Set([
  'MAINTENANCE_MODE',
  'system.maintenance',
  'system.announcements',
]);

function parseConfigValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    trimmed === 'true' ||
    trimmed === 'false' ||
    trimmed === 'null' ||
    /^-?\d+(\.\d+)?$/.test(trimmed)
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return raw;
    }
  }
  return raw;
}

function configGroupLabel(key: string): string {
  if (key.startsWith('system.')) return 'System';
  if (key.startsWith('request.')) return 'Requests';
  if (key === 'MAINTENANCE_MODE' || key.includes('maintenance')) return 'Maintenance';
  return 'Other';
}

function configLabel(key: string): string {
  const leaf = key.includes('.') ? key.slice(key.lastIndexOf('.') + 1) : key;
  return humanizeKey(leaf.replace(/_/g, ' '));
}

function statusBadgeColor(status: string): 'emerald' | 'amber' | 'red' | 'blue' | 'slate' {
  const s = status.toUpperCase();
  if (s.includes('COMPLET') || s.includes('SUCCESS') || s === 'ACTIVE') return 'emerald';
  if (s.includes('PEND') || s.includes('QUEUE') || s.includes('WAIT')) return 'amber';
  if (s.includes('FAIL') || s.includes('ERROR') || s.includes('CANCEL')) return 'red';
  if (s.includes('RUN') || s.includes('PROCESS')) return 'blue';
  return 'slate';
}

function toDatetimeLocal(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function matchesQuery(haystack: string, query: string): boolean {
  if (!query.trim()) return true;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

export function SystemClient() {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTabState] = useState<SystemTab>(() =>
    parseSystemTab(searchParams.get('tab'))
  );

  const setActiveTab = useCallback(
    (tab: SystemTab) => {
      setActiveTabState(tab);
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'health') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const fromUrl = parseSystemTab(searchParams.get('tab'));
    setActiveTabState((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [searchParams]);
  const [configEdits, setConfigEdits] = useState<Record<string, string>>({});
  const [configSearch, setConfigSearch] = useState('');
  const [flagOverrides, setFlagOverrides] = useState<Record<string, boolean>>({});
  const [featureSearch, setFeatureSearch] = useState('');
  const [templatePane, setTemplatePaneState] = useState<TemplatePane>(() =>
    parseTemplatePane(searchParams.get('pane'))
  );
  const setTemplatePane = useCallback(
    (pane: TemplatePane) => {
      setTemplatePaneState(pane);
      const params = new URLSearchParams(searchParams.toString());
      if (pane === 'email') {
        params.delete('pane');
      } else {
        params.set('pane', pane);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );
  useEffect(() => {
    const fromUrl = parseTemplatePane(searchParams.get('pane'));
    setTemplatePaneState((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [searchParams]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [notifPage, setNotifPage] = useState(0);
  const NOTIF_PAGE_SIZE = 12;

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [emailPreviewDirty, setEmailPreviewDirty] = useState(false);
  const [editingNotifId, setEditingNotifId] = useState<string | null>(null);
  const [editingNotifLabel, setEditingNotifLabel] = useState('');
  const [notifName, setNotifName] = useState('');
  const [notifEventType, setNotifEventType] = useState('');
  const [notifTitleTemplate, setNotifTitleTemplate] = useState('');
  const [notifMessageTemplate, setNotifMessageTemplate] = useState('');
  const [notifChannelsJson, setNotifChannelsJson] = useState('["IN_APP"]');
  const [showNewNotif, setShowNewNotif] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [testEmailTo, setTestEmailTo] = useState('');
  const [cacheKey, setCacheKey] = useState('');
  const [showHealthDebug, setShowHealthDebug] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');
  const [announcementDismissable, setAnnouncementDismissable] = useState(true);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceEstimatedEnd, setMaintenanceEstimatedEnd] = useState('');
  const [maintenanceHydrated, setMaintenanceHydrated] = useState(false);
  const [liveMaintenanceEnabled, setLiveMaintenanceEnabled] = useState(false);
  const [liveMaintenanceMessage, setLiveMaintenanceMessage] = useState('');
  const [liveMaintenanceEstimatedEnd, setLiveMaintenanceEstimatedEnd] = useState('');

  const results = useQueries({
    queries: [
      { queryKey: adminKeys.health(), queryFn: () => apiServices.admin.health() },
      { queryKey: adminKeys.systemConfig(), queryFn: () => apiServices.admin.getSystemConfig() },
      {
        queryKey: adminKeys.systemFeatures(),
        queryFn: () => apiServices.admin.getSystemFeatures(),
      },
      { queryKey: adminKeys.systemJobs(), queryFn: () => apiServices.admin.getSystemJobs() },
      {
        queryKey: adminKeys.emailTemplates(),
        queryFn: () => apiServices.admin.getEmailTemplates(),
      },
      {
        queryKey: [...adminKeys.root, 'notification-templates'],
        queryFn: () => apiServices.admin.getNotificationTemplates(),
      },
    ],
  });

  const updateConfigM = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const resultsLocal = [];
      for (const [key, raw] of Object.entries(body)) {
        resultsLocal.push(
          await apiServices.admin.updateSystemConfig({ key, value: parseConfigValue(raw) })
        );
      }
      return resultsLocal;
    },
    onSuccess: () => {
      toast.success('Config updated.');
      setConfigEdits({});
      void qc.invalidateQueries({ queryKey: adminKeys.systemConfig() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update config')),
  });

  const toggleFlagM = useMutation({
    mutationFn: ({ flag, enabled }: { flag: string; enabled: boolean }) =>
      apiServices.admin.patchSystemFeature(flag, { enabled }),
    onSuccess: (_data, vars) => {
      toast.success('Feature flag updated.');
      setFlagOverrides((prev) => {
        const next = { ...prev };
        delete next[vars.flag];
        return next;
      });
      void qc.invalidateQueries({ queryKey: adminKeys.systemFeatures() });
    },
    onError: (e, vars) => {
      setFlagOverrides((prev) => {
        const next = { ...prev };
        delete next[vars.flag];
        return next;
      });
      toast.error(getApiErrorMessage(e, 'Could not update flag'));
      void qc.invalidateQueries({ queryKey: adminKeys.systemFeatures() });
    },
  });

  const healthDebugQ = useQuery({
    queryKey: [...adminKeys.root, 'health-debug'],
    queryFn: () => apiServices.admin.getHealthDebug(),
    enabled: showHealthDebug,
  });

  const retryJobM = useMutation({
    mutationFn: (id: string) => apiServices.admin.retrySystemJob(id),
    onSuccess: () => {
      toast.success('Job retried.');
      void qc.invalidateQueries({ queryKey: adminKeys.systemJobs() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not retry job')),
  });

  const cancelJobM = useMutation({
    mutationFn: (id: string) => apiServices.admin.cancelSystemJob(id),
    onSuccess: () => {
      toast.success('Job cancelled.');
      void qc.invalidateQueries({ queryKey: adminKeys.systemJobs() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not cancel job')),
  });

  const closeEmailDialog = () => {
    setEditingTemplateId(null);
    setEditingTemplateName('');
    setTemplateSubject('');
    setTemplateBody('');
    setPreviewHtml('');
    setPreviewSubject('');
    setEmailPreviewDirty(false);
  };

  const closeNotifEditor = () => {
    setEditingNotifId(null);
    setEditingNotifLabel('');
  };

  const updateTemplateM = useMutation({
    mutationFn: (id: string) =>
      apiServices.admin.updateEmailTemplate(id, { subject: templateSubject, body: templateBody }),
    onSuccess: (_data, id) => {
      toast.success('Template updated.');
      setEmailPreviewDirty(false);
      void qc.invalidateQueries({ queryKey: adminKeys.emailTemplates() });
      void apiServices.admin.previewEmailTemplate(id).then((data) => {
        const rec = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
        setPreviewHtml(String(rec.html ?? rec.body ?? rec.preview ?? ''));
        setPreviewSubject(String(rec.subject ?? templateSubject));
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update template')),
  });

  const updateNotifM = useMutation({
    mutationFn: (id: string) =>
      apiServices.admin.updateNotificationTemplate(id, {
        name: notifName,
        eventType: notifEventType,
        titleTemplate: notifTitleTemplate,
        messageTemplate: notifMessageTemplate,
        channels: JSON.parse(notifChannelsJson || '["IN_APP"]'),
      }),
    onSuccess: () => {
      toast.success('Notification template updated.');
      closeNotifEditor();
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'notification-templates'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update notification template')),
  });

  const createNotifM = useMutation({
    mutationFn: () =>
      apiServices.admin.createNotificationTemplate({
        name: notifName,
        eventType: notifEventType,
        titleTemplate: notifTitleTemplate || notifName,
        messageTemplate: notifMessageTemplate,
        channels: JSON.parse(notifChannelsJson || '["IN_APP"]'),
      }),
    onSuccess: () => {
      toast.success('Notification template created.');
      setShowNewNotif(false);
      setNotifName('');
      setNotifEventType('');
      setNotifTitleTemplate('');
      setNotifMessageTemplate('');
      setNotifChannelsJson('["IN_APP"]');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'notification-templates'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create notification template')),
  });

  const deleteNotifM = useMutation({
    mutationFn: (id: string) => apiServices.admin.deleteNotificationTemplate(id),
    onSuccess: () => {
      toast.success('Notification template deleted.');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'notification-templates'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete notification template')),
  });

  const previewTemplateM = useMutation({
    mutationFn: (id: string) => apiServices.admin.previewEmailTemplate(id),
    onSuccess: (data) => {
      const rec = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
      setPreviewHtml(String(rec.html ?? rec.body ?? rec.preview ?? JSON.stringify(data, null, 2)));
      setPreviewSubject(String(rec.subject ?? ''));
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not preview template')),
  });

  const sendTestEmailM = useMutation({
    mutationFn: ({ id, to }: { id: string; to: string }) =>
      apiServices.admin.sendTestEmail(id, { email: to, to }),
    onSuccess: () => toast.success('Test email sent.'),
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not send test email')),
  });

  const clearCacheM = useMutation({
    mutationFn: () => apiServices.admin.clearSystemCache({}),
    onSuccess: () => toast.success('Cache cleared.'),
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not clear cache')),
  });

  const clearCacheKeyM = useMutation({
    mutationFn: (key: string) => apiServices.admin.clearSystemCacheKey(key, {}),
    onSuccess: () => {
      toast.success('Cache key cleared.');
      setCacheKey('');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not clear cache key')),
  });

  const downloadLogsM = useMutation({
    mutationFn: () => apiServices.admin.downloadSystemLogs(),
    onSuccess: async ({ downloadUrl, filename, contentBase64, mimeType }) => {
      let blob: Blob;
      if (contentBase64) {
        const binary = atob(contentBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        blob = new Blob([bytes], { type: mimeType || 'text/csv' });
      } else if (downloadUrl) {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error(`Download failed (${response.status})`);
        blob = await response.blob();
      } else {
        throw new Error('No downloadable log payload');
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Logs download started.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not download logs')),
  });

  const sendAnnouncementM = useMutation({
    mutationFn: () =>
      apiServices.admin.sendSystemAnnouncement({
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        type: announcementType,
        dismissable: announcementDismissable,
      }),
    onSuccess: () => {
      toast.success('Announcement sent.');
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      void qc.invalidateQueries({ queryKey: adminKeys.systemConfig() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not send announcement')),
  });

  const toggleMaintenanceM = useMutation({
    mutationFn: () => {
      let estimatedEnd: string | undefined;
      if (maintenanceEstimatedEnd.trim()) {
        const parsed = new Date(maintenanceEstimatedEnd.trim());
        if (Number.isNaN(parsed.getTime())) throw new Error('Invalid estimated end date/time');
        estimatedEnd = parsed.toISOString();
      }
      return apiServices.admin.toggleMaintenanceMode({
        enabled: maintenanceEnabled,
        message: maintenanceMessage.trim() || undefined,
        estimatedEnd,
      });
    },
    onSuccess: () => {
      toast.success(
        maintenanceEnabled ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.'
      );
      setLiveMaintenanceEnabled(maintenanceEnabled);
      setLiveMaintenanceMessage(maintenanceMessage.trim());
      setLiveMaintenanceEstimatedEnd(maintenanceEstimatedEnd);
      setMaintenanceHydrated(false);
      void qc.invalidateQueries({ queryKey: adminKeys.systemConfig() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not toggle maintenance mode')),
  });

  const loading = results.some((r) => r.isPending && r.data === undefined);
  const sliceFaults: [string, unknown][] = [];
  results.forEach((r, i) => {
    if (r.error) sliceFaults.push([SLICE_NAMES[i]!, r.error]);
  });

  const health = results[0].data;
  const healthRec =
    health && typeof health === 'object' && !Array.isArray(health)
      ? (health as Record<string, unknown>)
      : null;

  const configData = results[1].data;
  const configRec =
    configData && typeof configData === 'object' && !Array.isArray(configData)
      ? (configData as Record<string, unknown>)
      : null;

  const configRows = useMemo(() => {
    if (!configRec) return [] as { key: string; value: string; group: string; label: string }[];
    return Object.entries(configRec).map(([key, value]) => ({
      key,
      label: configLabel(key),
      group: configGroupLabel(key),
      value: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
    }));
  }, [configRec]);

  const filteredConfigRows = useMemo(() => {
    return configRows.filter((row) =>
      matchesQuery(`${row.key} ${row.label} ${row.group}`, configSearch)
    );
  }, [configRows, configSearch]);

  const editableConfigRows = useMemo(
    () => filteredConfigRows.filter((row) => !READ_ONLY_CONFIG_KEYS.has(row.key)),
    [filteredConfigRows]
  );

  const managedConfigCount = useMemo(
    () => filteredConfigRows.filter((row) => READ_ONLY_CONFIG_KEYS.has(row.key)).length,
    [filteredConfigRows]
  );

  const groupedConfig = useMemo(() => {
    const map = new Map<string, typeof editableConfigRows>();
    for (const row of editableConfigRows) {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    }
    const order = ['System', 'Requests', 'Other', 'Maintenance'];
    return Array.from(map.entries()).sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a[0].localeCompare(b[0]);
    });
  }, [editableConfigRows]);

  const featuresData = results[2]?.data;
  const featureFlags = useMemo(() => extractFeatureFlagRows(featuresData), [featuresData]);
  const filteredFlags = useMemo(
    () =>
      featureFlags.filter((f) =>
        matchesQuery(`${f.key} ${f.label} ${f.description ?? ''}`, featureSearch)
      ),
    [featureFlags, featureSearch]
  );
  const enabledFlagCount = featureFlags.filter((f) => flagOverrides[f.key] ?? f.enabled).length;

  const jobRows = pickAdminRows(results[3].data);
  const emailRows = pickAdminRows(results[4].data);
  const notificationRows = pickAdminRows(results[5].data);

  const filteredEmailRows = useMemo(
    () =>
      emailRows.filter((row) =>
        matchesQuery(`${row.name ?? ''} ${row.subject ?? ''} ${row.key ?? ''}`, templateSearch)
      ),
    [emailRows, templateSearch]
  );

  const filteredNotifRows = useMemo(
    () =>
      notificationRows.filter((row) =>
        matchesQuery(
          `${row.name ?? ''} ${row.eventType ?? ''} ${row.titleTemplate ?? ''}`,
          templateSearch
        )
      ),
    [notificationRows, templateSearch]
  );

  const pagedNotifRows = filteredNotifRows.slice(
    notifPage * NOTIF_PAGE_SIZE,
    notifPage * NOTIF_PAGE_SIZE + NOTIF_PAGE_SIZE
  );
  const notifPageCount = Math.max(1, Math.ceil(filteredNotifRows.length / NOTIF_PAGE_SIZE));

  useEffect(() => {
    setNotifPage(0);
  }, [templateSearch, templatePane]);

  useEffect(() => {
    if (maintenanceHydrated || !configRec) return;
    const raw = configRec.MAINTENANCE_MODE ?? configRec['system.maintenance'];
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const m = raw as Record<string, unknown>;
      const enabled = Boolean(m.enabled);
      const message = typeof m.message === 'string' ? m.message : '';
      const end =
        (typeof m.estimatedEnd === 'string' && m.estimatedEnd) ||
        (typeof m.estimatedEndTime === 'string' && m.estimatedEndTime) ||
        '';
      const endLocal = end ? toDatetimeLocal(end) : '';
      setMaintenanceEnabled(enabled);
      setMaintenanceMessage(message);
      setMaintenanceEstimatedEnd(endLocal);
      setLiveMaintenanceEnabled(enabled);
      setLiveMaintenanceMessage(message);
      setLiveMaintenanceEstimatedEnd(endLocal);
    }
    setMaintenanceHydrated(true);
  }, [configRec, maintenanceHydrated]);

  const maintenanceDirty =
    maintenanceEnabled !== liveMaintenanceEnabled ||
    maintenanceMessage.trim() !== liveMaintenanceMessage.trim() ||
    maintenanceEstimatedEnd !== liveMaintenanceEstimatedEnd;

  const maintenanceApplyLabel = !maintenanceDirty
    ? 'No changes to apply'
    : maintenanceEnabled === liveMaintenanceEnabled
      ? 'Update maintenance settings'
      : maintenanceEnabled
        ? 'Enable maintenance mode'
        : 'Disable maintenance mode';

  const overviewMetrics: KpiItem[] = useMemo(
    () => [
      {
        label: 'Service',
        value: typeof healthRec?.ok === 'boolean' ? (healthRec.ok ? 'Healthy' : 'Down') : 'Unknown',
        hint: typeof healthRec?.service === 'string' ? String(healthRec.service) : 'admin',
      },
      {
        label: 'Config keys',
        value: String(configRows.length),
        hint: pendingConfigLabel(configEdits),
      },
      {
        label: 'Feature flags',
        value: `${enabledFlagCount}/${featureFlags.length || 0}`,
        hint: 'Enabled / total',
      },
      {
        label: 'Templates',
        value: String(emailRows.length + notificationRows.length),
        hint: `${emailRows.length} email · ${notificationRows.length} notification`,
      },
    ],
    [
      healthRec,
      configRows.length,
      configEdits,
      enabledFlagCount,
      featureFlags.length,
      emailRows.length,
      notificationRows.length,
    ]
  );

  const debugPayloads = {
    health: results[0].data,
    systemConfig: results[1].data,
    featureFlags: results[2].data,
    jobs: results[3].data,
    emailTemplates: results[4].data,
    notificationTemplates: results[5].data,
  } as Record<string, unknown>;

  const pendingConfigEdits = Object.keys(configEdits).length > 0;
  const tabBadges: Record<SystemTab, number | undefined> = {
    health: undefined,
    config: configRows.length || undefined,
    features: featureFlags.length || undefined,
    jobs: jobRows.length || undefined,
    templates: emailRows.length + notificationRows.length || undefined,
    operations: liveMaintenanceEnabled ? 1 : undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="System"
        title="System Configuration"
        description="Runtime health, platform settings, feature flags, jobs, templates, and operator controls."
      />

      {!loading ? <AdminMetricStrip items={overviewMetrics} max={4} /> : null}

      <AdminTabBar
        tabs={SYSTEM_TABS.map((tab) => ({
          label: tab.label,
          badge: tabBadges[tab.id],
        }))}
        activeIndex={Math.max(
          0,
          SYSTEM_TABS.findIndex((t) => t.id === activeTab)
        )}
        onChange={(index) => setActiveTab(SYSTEM_TABS[index]?.id ?? 'health')}
      />

      <div className="space-y-6">
        {loading ? <SkeletonTable rows={6} cols={3} /> : null}
        {sliceFaults.length === SLICE_NAMES.length ? (
          <ErrorState
            message={getApiErrorMessage(sliceFaults[0]?.[1], 'Could not load system data')}
            onRetry={() => {
              results.forEach((r) => void r.refetch());
            }}
          />
        ) : null}
        <SliceFaultBanner faults={sliceFaults} />

        {/* ── Health ───────────────────────────────────────── */}
        {activeTab === 'health' && !loading ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  {
                    label: 'Gateway',
                    value:
                      typeof healthRec?.ok === 'boolean'
                        ? healthRec.ok
                          ? 'Reachable'
                          : 'Unreachable'
                        : 'Unknown',
                    tone:
                      typeof healthRec?.ok === 'boolean'
                        ? healthRec.ok
                          ? 'emerald'
                          : 'red'
                        : 'slate',
                    hint: 'Admin health probe',
                  },
                  {
                    label: 'Service',
                    value:
                      typeof healthRec?.service === 'string' ? String(healthRec.service) : 'admin',
                    tone: 'blue' as const,
                    hint: 'Responding identity',
                  },
                  {
                    label: 'Maintenance',
                    value: liveMaintenanceEnabled ? 'Active' : 'Off',
                    tone: liveMaintenanceEnabled ? ('amber' as const) : ('emerald' as const),
                    hint: 'Client access gate',
                  },
                  {
                    label: 'Flags enabled',
                    value: `${enabledFlagCount}/${featureFlags.length || 0}`,
                    tone: 'slate' as const,
                    hint: 'Live feature surface',
                  },
                ] as const
              ).map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border bg-card px-4 py-3.5"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge color={item.tone} size="sm">
                      {item.value}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.hint}</p>
                </div>
              ))}
            </div>

            <SettingsSection
              title="Diagnostics"
              description="Inspect raw health payload from the gateway when troubleshooting outages."
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowHealthDebug((v) => !v)}
                >
                  {showHealthDebug ? 'Hide diagnostics' : 'Load diagnostics'}
                </Button>
              }
            >
              {showHealthDebug ? (
                <div className="py-1">
                  {healthDebugQ.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading diagnostics…</p>
                  ) : null}
                  {healthDebugQ.error ? (
                    <ErrorState
                      message={getApiErrorMessage(healthDebugQ.error, 'Could not load debug info')}
                      onRetry={() => void healthDebugQ.refetch()}
                    />
                  ) : null}
                  {healthDebugQ.data ? (
                    <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/20 p-3 font-mono text-xs leading-relaxed">
                      {JSON.stringify(healthDebugQ.data, null, 2)}
                    </pre>
                  ) : !healthDebugQ.isLoading && !healthDebugQ.error ? (
                    <p className="text-sm text-muted-foreground">No diagnostic payload returned.</p>
                  ) : null}
                </div>
              ) : (
                <p className="py-1 text-sm text-muted-foreground">
                  Diagnostics stay collapsed until needed so the console stays focused on operator
                  actions.
                </p>
              )}
            </SettingsSection>

            <div className="grid gap-5 lg:grid-cols-2">
              <SettingsSection
                title="Cache management"
                description="Flush Redis globally or invalidate one key. Use carefully in production."
              >
                <div className="flex flex-col gap-3 py-1 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={clearCacheM.isPending}
                    onClick={async () => {
                      const { confirmed } = await confirm({
                        title: 'Clear all cache',
                        description:
                          'This flushes the shared Redis cache and may briefly slow the platform.',
                        destructive: true,
                        confirmLabel: 'Clear all',
                      });
                      if (!confirmed) return;
                      clearCacheM.mutate();
                    }}
                  >
                    {clearCacheM.isPending ? 'Clearing…' : 'Clear all cache'}
                  </Button>
                  <Input
                    value={cacheKey}
                    onChange={(e) => setCacheKey(e.target.value)}
                    placeholder="Exact cache key"
                    aria-label="Exact cache key"
                    className="max-w-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!cacheKey.trim() || clearCacheKeyM.isPending}
                    onClick={() => clearCacheKeyM.mutate(cacheKey.trim())}
                  >
                    Clear key
                  </Button>
                </div>
              </SettingsSection>

              <SettingsSection
                title="System logs"
                description="Export recent audit and system log entries as CSV for incident review."
              >
                <div className="flex flex-wrap items-center gap-3 py-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={downloadLogsM.isPending}
                    onClick={() => downloadLogsM.mutate()}
                  >
                    {downloadLogsM.isPending ? 'Preparing…' : 'Download logs'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    CSV · recent window from admin API
                  </p>
                </div>
              </SettingsSection>
            </div>
          </>
        ) : null}

        {/* ── Config ───────────────────────────────────────── */}
        {activeTab === 'config' && !loading ? (
          <>
            <SettingsSection
              title="Platform configuration"
              description="Tunable runtime keys. JSON values are parsed on save. Maintenance and announcements are owned by Operations."
              actions={
                pendingConfigEdits ? (
                  <div className="flex items-center gap-2">
                    <Badge color="amber" size="sm">
                      {Object.keys(configEdits).length} unsaved
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfigEdits({})}
                      disabled={updateConfigM.isPending}
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      disabled={updateConfigM.isPending}
                      onClick={() => updateConfigM.mutate(configEdits)}
                    >
                      {updateConfigM.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                ) : (
                  <Badge color="emerald" size="sm">
                    All saved
                  </Badge>
                )
              }
            >
              <div className="flex flex-wrap items-center gap-3 pb-4">
                <Input
                  value={configSearch}
                  onChange={(e) => setConfigSearch(e.target.value)}
                  placeholder="Search keys or labels…"
                  className="max-w-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {editableConfigRows.length} editable
                  {managedConfigCount ? ` · ${managedConfigCount} managed elsewhere` : ''}
                </p>
              </div>

              {managedConfigCount > 0 ? (
                <div className="mb-5 rounded-md border border-border/80 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
                  Maintenance mode and announcement history are edited under the{' '}
                  <button
                    type="button"
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                    onClick={() => setActiveTab('operations')}
                  >
                    Operations
                  </button>{' '}
                  tab — not as raw JSON here.
                </div>
              ) : null}

              {groupedConfig.length === 0 ? (
                <EmptyState
                  title="No configuration keys"
                  description={
                    configSearch
                      ? 'Nothing matched your search.'
                      : 'The config API returned no editable keys.'
                  }
                />
              ) : (
                <div className="space-y-6">
                  {groupedConfig.map(([group, rows]) => (
                    <div key={group}>
                      <div className="mb-2 flex items-baseline justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {group}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{rows.length} keys</p>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-border">
                        {rows.map((row, idx) => {
                          const value = configEdits[row.key] ?? row.value;
                          const isMultiline = value.includes('\n') || value.length > 80;
                          const dirty = Object.prototype.hasOwnProperty.call(configEdits, row.key);
                          return (
                            <div
                              key={row.key}
                              className={cn(
                                'grid gap-3 p-3.5 md:grid-cols-[minmax(0,240px)_1fr] md:items-start',
                                idx > 0 && 'border-t border-border',
                                dirty && 'bg-amber-500/5'
                              )}
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                                  {dirty ? (
                                    <Badge color="amber" size="sm">
                                      Edited
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground">
                                  {row.key}
                                </p>
                              </div>
                              <div>
                                {isMultiline ? (
                                  <Textarea
                                    value={value}
                                    onChange={(e) =>
                                      setConfigEdits((prev) => ({
                                        ...prev,
                                        [row.key]: e.target.value,
                                      }))
                                    }
                                    className="min-h-[88px] font-mono text-xs"
                                    placeholder={
                                      getFieldHelp(`system.${row.key}`)?.example ??
                                      `Enter ${row.label}`
                                    }
                                  />
                                ) : (
                                  <Input
                                    value={value}
                                    onChange={(e) =>
                                      setConfigEdits((prev) => ({
                                        ...prev,
                                        [row.key]: e.target.value,
                                      }))
                                    }
                                    className="font-mono text-xs"
                                    placeholder={
                                      getFieldHelp(`system.${row.key}`)?.example ??
                                      `Enter ${row.label}`
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SettingsSection>

            {pendingConfigEdits ? (
              <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {Object.keys(configEdits).length} unsaved config change
                    {Object.keys(configEdits).length === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Review JSON carefully before applying to production.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfigEdits({})}
                    disabled={updateConfigM.isPending}
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    disabled={updateConfigM.isPending}
                    onClick={() => updateConfigM.mutate(configEdits)}
                  >
                    {updateConfigM.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {/* ── Features ─────────────────────────────────────── */}
        {activeTab === 'features' && !loading ? (
          <SettingsSection
            title="Feature flags"
            description="Capability switches for the platform. Prefer clear names; technical IDs stay secondary."
            actions={
              <Badge color="slate" size="sm">
                {enabledFlagCount} on · {featureFlags.length - enabledFlagCount} off
              </Badge>
            }
          >
            <div className="pb-4">
              <Input
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                placeholder="Search by name, description, or id…"
                className="max-w-sm"
              />
            </div>
            {filteredFlags.length === 0 ? (
              <EmptyState
                title="No feature flags"
                description={
                  featureSearch ? 'Nothing matched your search.' : 'No flags returned from the API.'
                }
              />
            ) : (
              <div className="rounded-lg border border-border">
                <div className="divide-y divide-border px-4">
                  <FeatureFlagList
                    flags={filteredFlags}
                    readOnly={false}
                    values={flagOverrides}
                    onChange={(key, enabled) => {
                      setFlagOverrides((prev) => ({ ...prev, [key]: enabled }));
                      toggleFlagM.mutate({ flag: key, enabled });
                    }}
                  />
                </div>
              </div>
            )}
          </SettingsSection>
        ) : null}

        {/* ── Jobs ─────────────────────────────────────────── */}
        {activeTab === 'jobs' && !loading ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-foreground">Background jobs</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Inspect recent asynchronous work and retry or cancel when needed.
                </p>
              </div>
              <Badge color="slate" size="sm">
                {jobRows.length} job{jobRows.length === 1 ? '' : 's'}
              </Badge>
            </div>
            {jobRows.length === 0 ? (
              <EmptyState
                title="No jobs"
                description="No background jobs were returned by the API."
              />
            ) : (
              <AdminDataShell>
                <div className={adminTableShellClass}>
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                      <tr className={adminTableHeadRowClass}>
                        <th className={adminTableThClass}>Job</th>
                        <th className={adminTableThClass}>Status</th>
                        <th className={adminTableThClass}>Created</th>
                        <th className={cn(adminTableThClass, 'text-right')}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobRows.map((row, i) => {
                        const id = rowId(row);
                        const name = String(row.name ?? row.type ?? row.id ?? `Job ${i + 1}`);
                        const status = String(row.status ?? '—');
                        const created = row.createdAt
                          ? new Date(String(row.createdAt)).toLocaleString()
                          : '—';
                        return (
                          <tr key={id || i} className={adminTableRowClass}>
                            <td className={adminTableTdClass}>
                              <p className="font-medium">{name}</p>
                              {id ? (
                                <p className="font-mono text-[11px] text-muted-foreground">{id}</p>
                              ) : null}
                            </td>
                            <td className={adminTableTdMutedClass}>
                              <Badge color={statusBadgeColor(status)} size="sm">
                                {status}
                              </Badge>
                            </td>
                            <td className={adminTableTdMutedClass}>{created}</td>
                            <td className={cn(adminTableTdClass, 'text-right')}>
                              {id ? (
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={retryJobM.isPending}
                                    onClick={() => retryJobM.mutate(id)}
                                  >
                                    Retry
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={cancelJobM.isPending}
                                    onClick={async () => {
                                      const { confirmed } = await confirm({
                                        title: 'Cancel job',
                                        description: 'This will stop the job from running.',
                                      });
                                      if (!confirmed) return;
                                      cancelJobM.mutate(id);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AdminDataShell>
            )}
          </div>
        ) : null}

        {/* ── Templates ────────────────────────────────────── */}
        {activeTab === 'templates' && !loading ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-lg border border-border bg-muted/20 p-1">
                {(
                  [
                    { id: 'email' as const, label: 'Email', count: emailRows.length },
                    {
                      id: 'notifications' as const,
                      label: 'Notifications',
                      count: notificationRows.length,
                    },
                  ] as const
                ).map((pane) => (
                  <button
                    key={pane.id}
                    type="button"
                    onClick={() => setTemplatePane(pane.id)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      templatePane === pane.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {pane.label}
                    <span className="ml-1.5 tabular-nums text-xs text-muted-foreground">
                      {pane.count}
                    </span>
                  </button>
                ))}
              </div>
              <Input
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder={
                  templatePane === 'email' ? 'Search email templates…' : 'Search notifications…'
                }
                className="max-w-sm"
              />
            </div>

            {templatePane === 'email' ? (
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Email templates</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Open a template to edit copy and preview the rendered email in one dialog.
                  </p>
                </div>
                {filteredEmailRows.length === 0 ? (
                  <EmptyState
                    title="No email templates"
                    description={
                      templateSearch
                        ? 'Nothing matched your search.'
                        : 'No email templates returned.'
                    }
                  />
                ) : (
                  <AdminDataShell>
                    <div className={adminTableShellClass}>
                      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                        <thead>
                          <tr className={adminTableHeadRowClass}>
                            <th className={adminTableThClass}>Template</th>
                            <th className={adminTableThClass}>Subject</th>
                            <th className={cn(adminTableThClass, 'text-right')}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEmailRows.map((row, i) => {
                            const id = String(row.id ?? row.key ?? row.name ?? `tpl-${i}`);
                            const name = String(
                              row.name ?? row.key ?? row.type ?? `Template ${i + 1}`
                            );
                            const subject = String(row.subject ?? '');
                            return (
                              <tr key={id} className={adminTableRowClass}>
                                <td className={adminTableTdClass}>
                                  <p className="font-medium">{name}</p>
                                  <p className="font-mono text-[11px] text-muted-foreground">
                                    {id}
                                  </p>
                                </td>
                                <td className={adminTableTdMutedClass}>
                                  <span className="line-clamp-2">{subject || '—'}</span>
                                </td>
                                <td className={cn(adminTableTdClass, 'text-right')}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      previewTemplateM.isPending && editingTemplateId === id
                                    }
                                    onClick={() => {
                                      setEditingTemplateId(id);
                                      setEditingTemplateName(name);
                                      setTemplateSubject(subject);
                                      setTemplateBody(String(row.body ?? row.content ?? ''));
                                      setPreviewHtml('');
                                      setPreviewSubject(subject);
                                      setEmailPreviewDirty(false);
                                      previewTemplateM.mutate(id);
                                    }}
                                  >
                                    Edit & preview
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </AdminDataShell>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Notification templates
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      In-app and multi-channel copy triggered by platform events.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewNotif((v) => !v);
                      setEditingNotifId(null);
                      setNotifName('');
                      setNotifEventType('');
                      setNotifTitleTemplate('');
                      setNotifMessageTemplate('');
                      setNotifChannelsJson('["IN_APP"]');
                    }}
                  >
                    {showNewNotif ? 'Cancel' : 'New template'}
                  </Button>
                </div>

                {showNewNotif ? (
                  <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                    <p className="text-sm font-medium text-foreground">
                      Create notification template
                    </p>
                    <Input
                      value={notifName}
                      onChange={(e) => setNotifName(e.target.value)}
                      placeholder="Template name"
                    />
                    <Input
                      value={notifEventType}
                      onChange={(e) => setNotifEventType(e.target.value)}
                      placeholder="Event type (e.g. account.deleted)"
                    />
                    <Input
                      value={notifTitleTemplate}
                      onChange={(e) => setNotifTitleTemplate(e.target.value)}
                      placeholder="Title template"
                    />
                    <Textarea
                      value={notifMessageTemplate}
                      onChange={(e) => setNotifMessageTemplate(e.target.value)}
                      placeholder="Message template"
                      className="min-h-[72px]"
                    />
                    <Textarea
                      value={notifChannelsJson}
                      onChange={(e) => setNotifChannelsJson(e.target.value)}
                      placeholder='Channels JSON e.g. ["IN_APP","EMAIL"]'
                      className="min-h-[56px] font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      disabled={
                        createNotifM.isPending || !notifName.trim() || !notifEventType.trim()
                      }
                      onClick={() => createNotifM.mutate()}
                    >
                      {createNotifM.isPending ? 'Creating…' : 'Create template'}
                    </Button>
                  </div>
                ) : null}

                {filteredNotifRows.length === 0 ? (
                  <EmptyState
                    title="No notification templates"
                    description={
                      templateSearch
                        ? 'Nothing matched your search.'
                        : 'No notification templates returned.'
                    }
                  />
                ) : (
                  <AdminDataShell
                    footer={
                      notifPageCount > 1 ? (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            Page {notifPage + 1} of {notifPageCount} ({filteredNotifRows.length}{' '}
                            templates)
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={notifPage <= 0}
                              onClick={() => setNotifPage((p) => Math.max(0, p - 1))}
                            >
                              Previous
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={notifPage >= notifPageCount - 1}
                              onClick={() =>
                                setNotifPage((p) => Math.min(notifPageCount - 1, p + 1))
                              }
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      ) : undefined
                    }
                  >
                    <div className={adminTableShellClass}>
                      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                        <thead>
                          <tr className={adminTableHeadRowClass}>
                            <th className={adminTableThClass}>Template</th>
                            <th className={adminTableThClass}>Event</th>
                            <th className={adminTableThClass}>Channels</th>
                            <th className={cn(adminTableThClass, 'text-right')}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedNotifRows.map((row, i) => {
                            const id = String(row.id ?? rowId(row) ?? `notif-${i}`);
                            const name = String(row.name ?? `Template ${i + 1}`);
                            const channels = Array.isArray(row.channels)
                              ? (row.channels as unknown[]).map(String).join(', ')
                              : typeof row.channels === 'object'
                                ? Object.keys(row.channels as object).join(', ')
                                : '—';
                            return (
                              <tr key={id} className={adminTableRowClass}>
                                <td className={adminTableTdClass}>
                                  <p className="font-medium">{name}</p>
                                  {row.titleTemplate ? (
                                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                      {String(row.titleTemplate)}
                                    </p>
                                  ) : null}
                                </td>
                                <td className={adminTableTdMutedClass}>
                                  <span className="font-mono text-xs">
                                    {String(row.eventType ?? '—')}
                                  </span>
                                </td>
                                <td className={adminTableTdMutedClass}>{channels || '—'}</td>
                                <td className={cn(adminTableTdClass, 'text-right')}>
                                  <div className="flex justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingNotifId(id);
                                        setEditingNotifLabel(name);
                                        setNotifName(name);
                                        setNotifEventType(String(row.eventType ?? ''));
                                        setNotifTitleTemplate(String(row.titleTemplate ?? ''));
                                        setNotifMessageTemplate(String(row.messageTemplate ?? ''));
                                        setNotifChannelsJson(
                                          JSON.stringify(row.channels ?? ['IN_APP'], null, 2)
                                        );
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={deleteNotifM.isPending}
                                      onClick={async () => {
                                        const { confirmed } = await confirm({
                                          title: 'Delete notification template',
                                          description: `Delete template "${name}"? This cannot be undone.`,
                                          destructive: true,
                                          confirmLabel: 'Delete',
                                        });
                                        if (!confirmed) return;
                                        deleteNotifM.mutate(id);
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </AdminDataShell>
                )}
              </div>
            )}

            {/* Combined email edit + preview popup */}
            <Dialog
              open={Boolean(editingTemplateId)}
              onOpenChange={(open) => {
                if (!open) closeEmailDialog();
              }}
            >
              <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
                <div className="border-b border-border px-5 py-4">
                  <DialogTitle>
                    {editingTemplateName ? editingTemplateName : 'Email template'}
                  </DialogTitle>
                  <DialogDescription>
                    Edit the template and see how the email will look in one place.
                  </DialogDescription>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                  <div className="grid gap-0 lg:grid-cols-2">
                    <div className="space-y-3 border-b border-border p-5 lg:border-b-0 lg:border-r">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Subject</label>
                        <Input
                          value={templateSubject}
                          onChange={(e) => {
                            setTemplateSubject(e.target.value);
                            setEmailPreviewDirty(true);
                          }}
                          placeholder="Subject"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Body (HTML or plain text)
                        </label>
                        <Textarea
                          value={templateBody}
                          onChange={(e) => {
                            setTemplateBody(e.target.value);
                            setEmailPreviewDirty(true);
                          }}
                          placeholder="Body (HTML or plain text)"
                          className="min-h-[320px] font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="bg-muted/40 p-4 sm:p-5">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Email preview
                      </p>
                      <div className="overflow-hidden rounded-xl border border-border/80 bg-background shadow-sm">
                        <div className="space-y-2 border-b border-border/70 bg-muted/30 px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <span className="w-14 shrink-0 text-muted-foreground">From</span>
                            <span className="font-medium text-foreground">
                              Nestlancer &lt;noreply@nestlancer.com&gt;
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-14 shrink-0 text-muted-foreground">To</span>
                            <span className="text-foreground">
                              {testEmailTo.trim() || 'recipient@example.com'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-14 shrink-0 text-muted-foreground">Subject</span>
                            <span className="font-medium text-foreground">
                              {(emailPreviewDirty ? templateSubject : previewSubject) ||
                                templateSubject ||
                                '(no subject)'}
                            </span>
                          </div>
                        </div>
                        {previewTemplateM.isPending && !previewHtml && !emailPreviewDirty ? (
                          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                            Rendering preview…
                          </div>
                        ) : (
                          <iframe
                            title="Email template preview"
                            sandbox=""
                            srcDoc={toEmailPreviewDocument(
                              emailPreviewDirty || !previewHtml ? templateBody : previewHtml
                            )}
                            className="h-[min(50vh,420px)] w-full border-0 bg-white"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border px-5 py-4">
                  <div className="flex flex-wrap items-end gap-2">
                    <Input
                      value={testEmailTo}
                      onChange={(e) => setTestEmailTo(e.target.value)}
                      placeholder="you@company.com"
                      className="max-w-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        !editingTemplateId || !testEmailTo.trim() || sendTestEmailM.isPending
                      }
                      onClick={() =>
                        editingTemplateId &&
                        sendTestEmailM.mutate({
                          id: editingTemplateId,
                          to: testEmailTo.trim(),
                        })
                      }
                    >
                      {sendTestEmailM.isPending ? 'Sending…' : 'Send test'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" onClick={closeEmailDialog}>
                      Close
                    </Button>
                    <Button
                      size="sm"
                      disabled={!editingTemplateId || updateTemplateM.isPending}
                      onClick={() => editingTemplateId && updateTemplateM.mutate(editingTemplateId)}
                    >
                      {updateTemplateM.isPending ? 'Saving…' : 'Save template'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Notification edit popup */}
            <Dialog
              open={Boolean(editingNotifId)}
              onOpenChange={(open) => {
                if (!open) closeNotifEditor();
              }}
            >
              <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <DialogTitle>Edit notification template</DialogTitle>
                <DialogDescription>
                  {editingNotifLabel
                    ? `Update “${editingNotifLabel}”.`
                    : 'Update notification copy and channels.'}
                </DialogDescription>
                <div className="mt-4 space-y-3">
                  <Input
                    value={notifName}
                    onChange={(e) => setNotifName(e.target.value)}
                    placeholder="Name"
                  />
                  <Input
                    value={notifEventType}
                    onChange={(e) => setNotifEventType(e.target.value)}
                    placeholder="Event type"
                  />
                  <Input
                    value={notifTitleTemplate}
                    onChange={(e) => setNotifTitleTemplate(e.target.value)}
                    placeholder="Title template"
                  />
                  <Textarea
                    value={notifMessageTemplate}
                    onChange={(e) => setNotifMessageTemplate(e.target.value)}
                    placeholder="Message template"
                    className="min-h-[96px]"
                  />
                  <Textarea
                    value={notifChannelsJson}
                    onChange={(e) => setNotifChannelsJson(e.target.value)}
                    className="min-h-[64px] font-mono text-xs"
                    placeholder='Channels JSON e.g. ["IN_APP","EMAIL"]'
                  />
                  <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={closeNotifEditor}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!editingNotifId || updateNotifM.isPending}
                      onClick={() => editingNotifId && updateNotifM.mutate(editingNotifId)}
                    >
                      {updateNotifM.isPending ? 'Saving…' : 'Save template'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : null}

        {/* ── Operations ───────────────────────────────────── */}
        {activeTab === 'operations' && !loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <SettingsSection
              title="Platform announcements"
              description="Broadcast a banner notification to all active users. Delivery is written immediately, then queued for push/email channels."
            >
              <div className="space-y-3 py-1">
                <Input
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Announcement title"
                />
                <Textarea
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Message body (max 1000 characters)"
                  className="min-h-[96px]"
                />
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Severity</span>
                    <select
                      value={announcementType}
                      onChange={(e) =>
                        setAnnouncementType(e.target.value as 'INFO' | 'WARNING' | 'CRITICAL')
                      }
                      className="nl-select rounded-md border border-border bg-background py-1.5 text-sm min-w-[8rem]"
                    >
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Switch
                      checked={announcementDismissable}
                      onChange={setAnnouncementDismissable}
                    />
                    Users can dismiss
                  </label>
                </div>
                <Button
                  size="sm"
                  disabled={
                    !announcementTitle.trim() ||
                    !announcementMessage.trim() ||
                    sendAnnouncementM.isPending
                  }
                  onClick={() => sendAnnouncementM.mutate()}
                >
                  {sendAnnouncementM.isPending ? 'Sending…' : 'Send announcement'}
                </Button>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Maintenance mode"
              description="Block client app access during planned downtime. Admins can still sign in. Enabling revokes non-admin sessions."
            >
              <div className="space-y-4 py-1">
                <SettingsRow
                  label="Live status"
                  description="What the platform is enforcing right now."
                >
                  <Badge color={liveMaintenanceEnabled ? 'amber' : 'emerald'} size="sm">
                    {liveMaintenanceEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </SettingsRow>
                <SettingsRow
                  label="Enable maintenance"
                  description="Clients see a downtime screen. Public portfolio and blog stay readable."
                >
                  <Switch checked={maintenanceEnabled} onChange={setMaintenanceEnabled} />
                </SettingsRow>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Message shown to users</p>
                  <Input
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="System is under maintenance. Please check back later."
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Estimated end (optional)</p>
                  <Input
                    type="datetime-local"
                    value={maintenanceEstimatedEnd}
                    onChange={(e) => setMaintenanceEstimatedEnd(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                {maintenanceDirty ? (
                  <p className="text-xs text-amber-500">You have unsaved maintenance changes.</p>
                ) : null}
                <Button
                  size="sm"
                  variant={
                    maintenanceDirty && maintenanceEnabled && !liveMaintenanceEnabled
                      ? 'destructive'
                      : 'outline'
                  }
                  disabled={!maintenanceDirty || toggleMaintenanceM.isPending}
                  onClick={async () => {
                    const enabling = maintenanceEnabled && !liveMaintenanceEnabled;
                    const disabling = !maintenanceEnabled && liveMaintenanceEnabled;
                    const { confirmed } = await confirm({
                      title: enabling
                        ? 'Enable maintenance mode'
                        : disabling
                          ? 'Disable maintenance mode'
                          : 'Update maintenance settings',
                      description: enabling
                        ? 'Clients will see the maintenance screen and non-admin sessions will be signed out.'
                        : disabling
                          ? 'The platform will become available to clients again.'
                          : 'Update the maintenance message and schedule while keeping the current mode.',
                      destructive: enabling,
                      confirmLabel: enabling ? 'Enable' : disabling ? 'Disable' : 'Update',
                    });
                    if (!confirmed) return;
                    toggleMaintenanceM.mutate();
                  }}
                >
                  {toggleMaintenanceM.isPending ? 'Applying…' : maintenanceApplyLabel}
                </Button>
              </div>
            </SettingsSection>
          </div>
        ) : null}

        <DebugApiSection payloads={debugPayloads} />
      </div>
    </div>
  );
}

function pendingConfigLabel(edits: Record<string, string>): string {
  const n = Object.keys(edits).length;
  return n > 0 ? `${n} unsaved` : 'All saved';
}
