'use client';

import Link from 'next/link';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { formatIsoDate, formatSessionClient, openSafeHttpUrl } from '@nestlancer/utils';
import { adminResetPasswordSchema } from '@nestlancer/validators';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, Dialog, DialogContent, DialogTitle, Input, StatusBadge } from '@nestlancer/ui';
import {
  Download,
  FileStack,
  HardDrive,
  Lock,
  LogOut,
  Shield,
  Trash2,
  UserCircle,
} from '@nestlancer/ui/icons';

import {
  AdminUserAvatar,
  GeCard,
  GeCardHeader,
  GePageHeader as PageHeader,
} from '@/components/admin/AdminGentelellaUI';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { EmptyState, DebugApiSection } from '@/components/admin/AdminDataViews';
import { AdminMetricStrip, AdminTablePagination } from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import {
  buildUserPipelineSnapshot,
  userPipelinePaymentsQuery,
  userPipelineProjectsQuery,
  userPipelineRequestsQuery,
} from '@/lib/admin-pipeline-hub';
import { pickAdminRecord, pickAdminPagination, pickAdminRows } from '@/lib/admin-response';
import { extractUserDetailKpis, formatINR } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';
import {
  clientImpersonationUrl,
  notifyImpersonationEnded,
  readImpersonationHandoff,
  registerImpersonationHandoff,
} from '@/features/users/impersonationHandoff';

const USER_ROLES = ['USER', 'ADMIN'] as const;
const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED', 'PENDING_DELETION'] as const;
const SESSIONS_PAGE_SIZE = 5;
const ACTIVITY_PAGE_SIZE = 10;

export function UserDetailClient({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '' });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionPage, setSessionPage] = useState(1);
  const [supportSession, setSupportSession] = useState<{
    sessionId: string;
    email?: string;
  } | null>(null);
  const [stoppingSupport, setStoppingSupport] = useState(false);
  const [activityPage, setActivityPage] = useState(1);

  const userQuery = useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: () => apiServices.admin.getUser(userId),
  });

  const adminsQuery = useQuery({
    queryKey: [...adminKeys.users(), 'role', 'ADMIN'],
    queryFn: () => apiServices.admin.listUsers({ role: 'ADMIN', limit: 5, page: 1 }),
  });

  const sessionsQuery = useQuery({
    queryKey: [...adminKeys.user(userId), 'sessions'],
    queryFn: () => apiServices.admin.getUserSessions(userId),
  });

  const activityQuery = useQuery({
    queryKey: [...adminKeys.user(userId), 'activity', activityPage],
    queryFn: () =>
      apiServices.admin.getUserActivity(userId, {
        page: activityPage,
        limit: ACTIVITY_PAGE_SIZE,
      }),
  });

  const pipelineQ = useQueries({
    queries: [
      {
        queryKey: [...adminKeys.pipelineUser(userId), 'requests'],
        queryFn: () => apiServices.admin.listAdminRequests(userPipelineRequestsQuery(userId)),
        staleTime: 30_000,
      },
      {
        queryKey: [...adminKeys.pipelineUser(userId), 'projects'],
        queryFn: () => apiServices.admin.listAdminProjects(userPipelineProjectsQuery(userId)),
        staleTime: 30_000,
      },
      {
        queryKey: [...adminKeys.pipelineUser(userId), 'payments'],
        queryFn: () => apiServices.admin.listAdminPayments(userPipelinePaymentsQuery(userId)),
        staleTime: 30_000,
      },
    ],
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.user(userId) });
    void qc.invalidateQueries({ queryKey: [...adminKeys.user(userId), 'sessions'] });
    void qc.invalidateQueries({ queryKey: [...adminKeys.user(userId), 'activity'] });
    void qc.invalidateQueries({ queryKey: adminKeys.users() });
  };

  const profile =
    pickAdminRecord(userQuery.data) ??
    pickAdminRecord(
      userQuery.data && typeof userQuery.data === 'object' && 'data' in (userQuery.data as object)
        ? (userQuery.data as Record<string, unknown>).data
        : null
    );
  const role = typeof profile?.role === 'string' ? profile.role : undefined;
  const status = typeof profile?.status === 'string' ? profile.status : undefined;
  const deletedAt =
    typeof profile?.deletedAt === 'string'
      ? profile.deletedAt
      : typeof profile?.deleted_at === 'string'
        ? profile.deleted_at
        : null;
  const authConfig =
    profile?.authConfig && typeof profile.authConfig === 'object'
      ? (profile.authConfig as Record<string, unknown>)
      : null;
  const twoFactorEnabled =
    authConfig?.twoFactorEnabled === true ||
    profile?.twoFactorEnabled === true ||
    profile?.isTwoFactorEnabled === true;
  const isAdminAccount = role === 'ADMIN';
  const adminRows = pickAdminRows(adminsQuery.data);
  const otherAdminExists = adminRows.some(
    (r) => rowIdFromProfile(r) !== userId && r.role === 'ADMIN'
  );
  const soleAdmin = isAdminAccount && !otherAdminExists;

  const changeRole = useMutation({
    mutationFn: (nextRole: 'USER' | 'ADMIN') =>
      apiServices.admin.changeUserRole(userId, { role: nextRole }),
    onSuccess: () => {
      toast.success('Role updated');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const changeStatus = useMutation({
    mutationFn: (nextStatus: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_DELETION') =>
      apiServices.admin.changeUserStatus(userId, { status: nextStatus }),
    onSuccess: () => {
      toast.success('Status updated');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const updateProfile = useMutation({
    mutationFn: () =>
      apiServices.admin.updateUser(userId, {
        firstName: editForm.firstName.trim() || undefined,
        lastName: editForm.lastName.trim() || undefined,
        email: editForm.email.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Profile updated');
      setEditOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const terminateSession = useMutation({
    mutationFn: (sessionId: string) => apiServices.admin.terminateAnySession(sessionId),
    onSuccess: () => {
      toast.success('Session revoked');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const terminateAll = useMutation({
    mutationFn: () => apiServices.admin.terminateAllUserSessions(userId, {}),
    onSuccess: () => {
      toast.success('Sessions terminated');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const forceReset = useMutation({
    mutationFn: () => apiServices.admin.forcePasswordReset(userId, {}),
    onSuccess: () => {
      toast.success('User must change password on next login');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const setPassword = useMutation({
    mutationFn: (nextPassword: string) =>
      apiServices.admin.adminResetPassword(userId, { newPassword: nextPassword }),
    onSuccess: () => {
      toast.success('Password updated; all sessions ended');
      setPasswordOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const exportData = useMutation({
    mutationFn: () => apiServices.admin.exportUserData(userId),
    onSuccess: (result: unknown) => {
      const r = result as Record<string, unknown>;
      const data = r?.data as Record<string, unknown> | undefined;
      const url =
        typeof r?.url === 'string' ? r.url : typeof data?.url === 'string' ? data.url : null;
      if (url) {
        openSafeHttpUrl(url);
      } else {
        toast.success("Export started — you'll receive a download link shortly");
      }
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Export failed')),
  });

  const restore = useMutation({
    mutationFn: () => apiServices.admin.restoreUser(userId, {}),
    onSuccess: () => {
      toast.success('Account restored');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const del = useMutation({
    mutationFn: () => apiServices.admin.deleteUser(userId),
    onSuccess: () => {
      toast.success('User deactivated (soft-delete)');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const impersonate = useMutation({
    mutationFn: (reason: string) =>
      apiServices.admin.startImpersonation(userId, { reason, durationMinutes: 60 }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.impersonationSessions() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const sessionRows = pickAdminRows(sessionsQuery.data);
  const activityRows = pickAdminRows(activityQuery.data);
  const activityPagination = pickAdminPagination(activityQuery.data);
  const activityTotalPages = activityPagination?.totalPages ?? 1;

  const sortedSessions = useMemo(
    () =>
      [...sessionRows].sort((a, b) => {
        const ta =
          typeof a.createdAt === 'string'
            ? Date.parse(a.createdAt)
            : typeof a.lastActiveAt === 'string'
              ? Date.parse(a.lastActiveAt)
              : 0;
        const tb =
          typeof b.createdAt === 'string'
            ? Date.parse(b.createdAt)
            : typeof b.lastActiveAt === 'string'
              ? Date.parse(b.lastActiveAt)
              : 0;
        return tb - ta;
      }),
    [sessionRows]
  );

  const sessionTotalPages = Math.max(1, Math.ceil(sortedSessions.length / SESSIONS_PAGE_SIZE));
  const visibleSessions = sortedSessions.slice(
    (sessionPage - 1) * SESSIONS_PAGE_SIZE,
    sessionPage * SESSIONS_PAGE_SIZE
  );

  useEffect(() => {
    setSessionPage(1);
  }, [userId, sessionRows.length]);

  useEffect(() => {
    if (sessionPage > sessionTotalPages) {
      setSessionPage(sessionTotalPages);
    }
  }, [sessionPage, sessionTotalPages]);

  useEffect(() => {
    setActivityPage(1);
  }, [userId]);

  useEffect(() => {
    if (activityPage > activityTotalPages) {
      setActivityPage(activityTotalPages);
    }
  }, [activityPage, activityTotalPages]);

  const openEdit = () => {
    setEditForm({
      firstName: String(profile?.firstName ?? ''),
      lastName: String(profile?.lastName ?? ''),
      email: String(profile?.email ?? ''),
    });
    setEditOpen(true);
  };

  const debugPayloads = {
    profile: userQuery.data,
    sessions: sessionsQuery.data,
    activity: activityQuery.data,
  } as Record<string, unknown>;

  const userTitle =
    [profile?.firstName, profile?.lastName].filter((x) => typeof x === 'string' && x).join(' ') ||
    String(profile?.email ?? 'User');

  const email = typeof profile?.email === 'string' ? profile.email : '—';
  const avatarStatus =
    status === 'ACTIVE' ? 'active' : status === 'SUSPENDED' ? 'suspended' : 'neutral';

  const createdAt =
    typeof profile?.createdAt === 'string'
      ? formatIsoDate(profile.createdAt, 'PP')
      : typeof profile?.created_at === 'string'
        ? formatIsoDate(profile.created_at, 'PP')
        : '—';

  const lastActive =
    typeof profile?.lastLoginAt === 'string'
      ? formatIsoDate(profile.lastLoginAt, 'PPp')
      : typeof profile?.lastActiveAt === 'string'
        ? formatIsoDate(profile.lastActiveAt, 'PPp')
        : '—';

  const pipelineSnapshot = useMemo(() => {
    const requests = pickAdminRows(pipelineQ[0]?.data);
    const projects = pickAdminRows(pipelineQ[1]?.data);
    const payments = pickAdminRows(pipelineQ[2]?.data);
    return buildUserPipelineSnapshot(requests, [], projects, payments, 0);
  }, [pipelineQ]);

  const totalPaidPaise = useMemo(() => {
    const payments = pickAdminRows(pipelineQ[2]?.data);
    return payments.reduce((sum, row) => {
      const payStatus = String(row.status ?? row.latestStatus ?? '').toUpperCase();
      if (payStatus !== 'COMPLETED') return sum;
      const amount = typeof row.amount === 'number' ? row.amount : 0;
      return sum + amount;
    }, 0);
  }, [pipelineQ]);

  const lastActiveShort = useMemo(() => {
    if (lastActive === '—') return '—';
    const ts = Date.parse(
      typeof profile?.lastLoginAt === 'string'
        ? profile.lastLoginAt
        : typeof profile?.lastActiveAt === 'string'
          ? profile.lastActiveAt
          : ''
    );
    if (Number.isNaN(ts)) return lastActive;
    const diffMs = Date.now() - ts;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 48) return `${hours}h ago`;
    return formatIsoDate(new Date(ts).toISOString(), 'PP');
  }, [lastActive, profile?.lastActiveAt, profile?.lastLoginAt]);

  const metricItems = extractUserDetailKpis({
    requestCount: pipelineSnapshot.requests.length,
    projectCount: pipelineSnapshot.projects.length,
    totalPaidPaise,
    lastActiveLabel: lastActiveShort,
  });

  const operatorNotes = useMemo(() => {
    const prefs = profile?.preferences;
    if (prefs && typeof prefs === 'object') {
      const notes = (prefs as Record<string, unknown>).operatorNotes;
      if (typeof notes === 'string' && notes.trim()) return notes.trim();
    }
    return null;
  }, [profile?.preferences]);

  const statusVariant =
    status === 'ACTIVE' ? 'success' : status === 'SUSPENDED' ? 'warning' : 'neutral';

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/users" className="font-medium text-primary hover:underline">
          Users
        </Link>
        <span className="mx-1.5 text-muted-foreground/60">/</span>
        <span className="text-foreground">{userTitle}</span>
      </nav>

      <PageHeader
        pretitle="Operations"
        title={
          <span className="flex flex-wrap items-center gap-2">
            {userTitle}
            {role ? <StatusBadge variant="neutral">{role}</StatusBadge> : null}
            {status ? (
              <StatusBadge variant={statusVariant}>{status.replace(/_/g, ' ')}</StatusBadge>
            ) : null}
            {deletedAt ? <StatusBadge variant="warning">Deactivated</StatusBadge> : null}
            {twoFactorEnabled ? <StatusBadge variant="info">2FA on</StatusBadge> : null}
            {profile?.mustChangePassword === true ? (
              <StatusBadge variant="warning">Must change password</StatusBadge>
            ) : null}
          </span>
        }
        description={email}
        actions={
          <Button size="sm" onClick={openEdit}>
            Edit profile
          </Button>
        }
      />

      {soleAdmin ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          This is the only administrator account. Role demotion, suspension, and deletion are
          blocked.
        </div>
      ) : null}

      <AdminQueryState isLoading={userQuery.isLoading} error={userQuery.error}>
        <AdminMetricStrip items={metricItems} max={4} />

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <GeCard flush>
              <GeCardHeader title="Access management" subtitle="Role and account status" />
              <div className="overflow-x-auto border-t border-border">
                <table className="ge-table">
                  <tbody>
                    <tr>
                      <th className="w-1/3 bg-muted/30 font-medium text-muted-foreground">Role</th>
                      <td>
                        <select
                          className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
                          value={role ?? 'USER'}
                          disabled={changeRole.isPending || (soleAdmin && role === 'ADMIN')}
                          title={
                            soleAdmin
                              ? 'Cannot demote the only administrator'
                              : otherAdminExists && role !== 'ADMIN'
                                ? 'Another administrator already exists'
                                : undefined
                          }
                          onChange={async (e) => {
                            const next = e.target.value;
                            if (next === 'ADMIN' && otherAdminExists) {
                              toast.error(
                                'Only one administrator is allowed. Demote the other admin first.'
                              );
                              return;
                            }
                            if (next === 'USER' && soleAdmin) {
                              toast.error('Cannot demote the only administrator');
                              return;
                            }
                            const { confirmed } = await confirm({
                              title: 'Change role',
                              description: `Change this user's role to ${next}?`,
                            });
                            if (!confirmed) return;
                            changeRole.mutate(next as 'USER' | 'ADMIN');
                          }}
                        >
                          {USER_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th className="w-1/3 bg-muted/30 font-medium text-muted-foreground">
                        Account status
                      </th>
                      <td>
                        <select
                          className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
                          value={status ?? 'ACTIVE'}
                          disabled={
                            changeStatus.isPending ||
                            (soleAdmin && (status === 'ACTIVE' || !status))
                          }
                          title={
                            soleAdmin
                              ? 'Cannot suspend or delete the only administrator'
                              : undefined
                          }
                          onChange={async (e) => {
                            const next = e.target.value;
                            if (soleAdmin && (next === 'SUSPENDED' || next === 'DELETED')) {
                              toast.error('Cannot change status of the only administrator');
                              return;
                            }
                            const msg =
                              next === 'SUSPENDED'
                                ? 'Suspend this user? All sessions will end.'
                                : `Change status to ${next}?`;
                            const { confirmed } = await confirm({
                              title: 'Change user status',
                              description: msg,
                              destructive: next === 'SUSPENDED' || next === 'DELETED',
                            });
                            if (!confirmed) return;
                            changeStatus.mutate(
                              next as 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_DELETION'
                            );
                          }}
                        >
                          {USER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </GeCard>

            <GeCard flush>
              <GeCardHeader
                title="Administrative actions"
                subtitle="Security, data export, and elevated access"
              />
              <div className="ge-card-body space-y-0 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      href={`/media?visibility=PRIVATE&uploaderId=${encodeURIComponent(userId)}`}
                    >
                      <HardDrive className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      View media
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/pipeline/users/${encodeURIComponent(userId)}`}>
                      <FileStack className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Pipeline hub
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={forceReset.isPending}
                    onClick={() => forceReset.mutate()}
                  >
                    <Lock className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Force password reset
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPasswordOpen(true)}>
                    <Shield className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Set password
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={terminateAll.isPending}
                    onClick={() => terminateAll.mutate()}
                  >
                    <LogOut className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    End all sessions
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={exportData.isPending}
                    onClick={() => exportData.mutate()}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    {exportData.isPending ? 'Exporting…' : 'Export data'}
                  </Button>
                  {status === 'DELETED' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={restore.isPending}
                      onClick={() => restore.mutate()}
                    >
                      Restore account
                    </Button>
                  ) : null}
                </div>

                <div className="mt-6 border-t border-border pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">Impersonate user</p>
                      <p className="text-xs text-muted-foreground">
                        Enter a reason first. The client account opens in a new tab only after you
                        confirm. Stop impersonation appears here once that tab is open. This admin
                        tab stays signed in as you. The session lasts 60 minutes and is audited.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {supportSession ? (
                        <p className="text-xs text-muted-foreground">
                          Impersonation is active
                          {supportSession.email ? ` for ${supportSession.email}` : ''}. The client
                          tab is signed in as them.
                        </p>
                      ) : null}
                      {supportSession ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={stoppingSupport}
                          onClick={() => {
                            const sessionId = supportSession.sessionId;
                            setStoppingSupport(true);
                            void apiServices.admin
                              .endImpersonationAlias({ sessionId })
                              .then(() => {
                                notifyImpersonationEnded(sessionId);
                                setSupportSession(null);
                                toast.success(
                                  'Stopped impersonation. The client tab is signed out.'
                                );
                                void qc.invalidateQueries({
                                  queryKey: adminKeys.impersonationSessions(),
                                });
                              })
                              .catch((error: unknown) => {
                                toast.error(
                                  getApiErrorMessage(
                                    error,
                                    'Could not stop impersonation. End it under Audit Logs → Impersonation sessions.'
                                  )
                                );
                              })
                              .finally(() => setStoppingSupport(false));
                          }}
                        >
                          {stoppingSupport ? 'Stopping…' : 'Stop impersonation'}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={impersonate.isPending}
                        onClick={() => {
                          const opened: { current: Window | null } = { current: null };
                          void (async () => {
                            const { confirmed, reason } = await confirm({
                              title: 'Open this client account',
                              description:
                                'Enter why you are opening this account. The client tab opens only after you confirm. Keep this admin tab open. The session lasts 60 minutes and is audited.',
                              requireReason: true,
                              reasonLabel: 'Reason for impersonation',
                              confirmLabel: 'Open client account',
                              onConfirmClick: () => {
                                const url = clientImpersonationUrl();
                                opened.current = url
                                  ? window.open(url, `nl-impersonate-${Date.now()}`)
                                  : null;
                              },
                            });
                            const child = opened.current;
                            if (!confirmed || !reason) {
                              if (child && !child.closed) child.close();
                              return;
                            }
                            if (!child) {
                              toast.error(
                                'Allow pop-ups for the admin site, then confirm the reason again.'
                              );
                              return;
                            }
                            try {
                              const raw = await impersonate.mutateAsync(reason);
                              const handoff = readImpersonationHandoff(raw);
                              if (!handoff || child.closed) {
                                if (!child.closed) child.close();
                                toast.error(
                                  'The support session started, but the client tab could not be signed in. End it under Audit Logs → Impersonation sessions and try again.'
                                );
                                return;
                              }
                              registerImpersonationHandoff(child, handoff);
                              setSupportSession({
                                sessionId: handoff.sessionId,
                                email: handoff.email,
                              });
                              child.focus();
                              toast.success(
                                'The client account is opening in a new tab. Stop impersonation on this page when you are done.'
                              );
                            } catch {
                              if (child && !child.closed) child.close();
                            }
                          })();
                        }}
                      >
                        <UserCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        {supportSession ? 'Open client account again' : 'Impersonate'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-6">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={del.isPending || soleAdmin}
                    title={soleAdmin ? 'Cannot delete the only administrator' : undefined}
                    onClick={async () => {
                      const { confirmed } = await confirm({
                        title: 'Deactivate user',
                        description:
                          'This soft-deletes the account (sets deletedAt). The user can be restored later.',
                        destructive: true,
                        confirmLabel: 'Deactivate',
                      });
                      if (confirmed) del.mutate();
                    }}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Deactivate user
                  </Button>
                </div>
              </div>
            </GeCard>

            <GeCard flush>
              <GeCardHeader
                title="Active sessions"
                subtitle={`${sessionRows.length} device${sessionRows.length === 1 ? '' : 's'}`}
              />
              <AdminQueryState isLoading={sessionsQuery.isLoading} error={sessionsQuery.error}>
                {sessionRows.length === 0 ? (
                  <div className="border-t border-border px-4 py-8">
                    <EmptyState message="No active sessions for this user." />
                  </div>
                ) : (
                  <>
                    <div className="max-h-72 overflow-auto border-t border-border">
                      <table className="ge-table">
                        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                          <tr>
                            <th>Device</th>
                            <th>IP address</th>
                            <th>Started</th>
                            <th className="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleSessions.map((row) => {
                            const sid = String(row.id ?? '');
                            const client = formatSessionClient(
                              row.ip as string | null | undefined,
                              row.userAgent as string | null | undefined
                            );
                            const started =
                              typeof row.createdAt === 'string'
                                ? formatIsoDate(row.createdAt, 'PPp')
                                : '—';
                            return (
                              <tr key={sid}>
                                <td className="max-w-[12rem]">
                                  <span
                                    className="block truncate font-medium text-foreground"
                                    title={client.userAgentFull ?? client.device ?? undefined}
                                  >
                                    {client.device || 'Unknown device'}
                                  </span>
                                </td>
                                <td>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {client.ip}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap text-muted-foreground">
                                  {started}
                                </td>
                                <td className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    disabled={!sid || terminateSession.isPending}
                                    onClick={async () => {
                                      const { confirmed } = await confirm({
                                        title: 'Revoke session',
                                        description: 'This will sign the user out of this device.',
                                      });
                                      if (!confirmed) return;
                                      terminateSession.mutate(sid);
                                    }}
                                  >
                                    Revoke
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {sortedSessions.length > SESSIONS_PAGE_SIZE ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
                        <AdminTablePagination
                          page={sessionPage}
                          totalPages={sessionTotalPages}
                          total={sortedSessions.length}
                          onPrev={() => setSessionPage((p) => Math.max(1, p - 1))}
                          onNext={() => setSessionPage((p) => Math.min(sessionTotalPages, p + 1))}
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </AdminQueryState>
            </GeCard>

            <GeCard flush>
              <GeCardHeader
                title="Activity log"
                subtitle={`${activityPagination?.total ?? activityRows.length} event${
                  (activityPagination?.total ?? activityRows.length) === 1 ? '' : 's'
                }`}
              />
              <AdminQueryState isLoading={activityQuery.isLoading} error={activityQuery.error}>
                {activityRows.length === 0 ? (
                  <div className="border-t border-border px-4 py-8">
                    <EmptyState message="No activity recorded for this user yet. Sign-ins appear here once the user has active sessions." />
                  </div>
                ) : (
                  <>
                    <div className="max-h-80 overflow-auto border-t border-border">
                      <table className="ge-table">
                        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                          <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>IP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityRows.map((row, i) => (
                            <tr key={String(row.id ?? i)}>
                              <td className="whitespace-nowrap text-muted-foreground">
                                {typeof row.createdAt === 'string'
                                  ? formatIsoDate(row.createdAt, 'PPp')
                                  : '—'}
                              </td>
                              <td>
                                <span className="font-mono text-xs font-medium">
                                  {String(row.action ?? '—')}
                                </span>
                              </td>
                              <td className="text-muted-foreground">
                                {String(row.category ?? '—')}
                              </td>
                              <td
                                className="max-w-xs truncate"
                                title={String(row.description ?? '')}
                              >
                                {String(row.description ?? '—')}
                              </td>
                              <td className="font-mono text-xs text-muted-foreground">
                                {String(row.ip ?? '—')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {activityTotalPages > 1 ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
                        <AdminTablePagination
                          page={activityPage}
                          totalPages={activityTotalPages}
                          total={activityPagination?.total}
                          onPrev={() => setActivityPage((p) => Math.max(1, p - 1))}
                          onNext={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </AdminQueryState>
            </GeCard>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20">
            <GeCard className="text-center">
              <div className="relative mx-auto mb-4 inline-flex">
                <AdminUserAvatar name={userTitle} email={email} size="lg" status={avatarStatus} />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{userTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{email}</p>
              <dl className="mt-6 space-y-3 border-t border-border pt-4 text-left text-sm">
                <ProfileFact label="User ID" value={userId} mono />
                <ProfileFact label="Registered" value={createdAt} />
                <ProfileFact label="Last active" value={lastActive} />
                <ProfileFact label="Role" value={role ?? '—'} />
                <ProfileFact label="Status" value={status?.replace(/_/g, ' ') ?? '—'} />
                {totalPaidPaise > 0 ? (
                  <ProfileFact label="Lifetime paid" value={formatINR(totalPaidPaise)} />
                ) : null}
              </dl>
              <div className="mt-4 border-t border-border pt-4">
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href={`/pipeline/users/${encodeURIComponent(userId)}`}>
                    Open pipeline hub
                  </Link>
                </Button>
              </div>
            </GeCard>

            <GeCard>
              <GeCardHeader title="Operator notes" subtitle="Internal context for support staff" />
              <div className="ge-card-body border-t border-border">
                {operatorNotes ? (
                  <p className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                    {operatorNotes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No operator notes on file. Use the pipeline hub or request notes for client
                    context.
                  </p>
                )}
              </div>
            </GeCard>
          </aside>
        </div>
      </AdminQueryState>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md space-y-4">
          <DialogTitle>Edit profile</DialogTitle>
          {(['firstName', 'lastName', 'email'] as const).map((field) => {
            const key =
              field === 'email'
                ? 'auth.email'
                : field === 'firstName'
                  ? 'profile.firstName'
                  : 'profile.lastName';
            return (
              <div key={field} className="space-y-1 text-sm">
                <FormFieldLabel fieldKey={key} label={field}>
                  {field}
                </FormFieldLabel>
                <Input
                  value={editForm[field]}
                  onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={
                    field === 'email'
                      ? 'you@company.com'
                      : field === 'firstName'
                        ? 'First name'
                        : 'Last name'
                  }
                  autoComplete={
                    field === 'email'
                      ? 'email'
                      : field === 'firstName'
                        ? 'given-name'
                        : 'family-name'
                  }
                />
              </div>
            );
          })}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button disabled={updateProfile.isPending} onClick={() => updateProfile.mutate()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-md space-y-4">
          <DialogTitle>Set new password</DialogTitle>
          <FormFieldLabel fieldKey="users.newPassword" label="New password">
            New password
          </FormFieldLabel>
          <Input
            type="password"
            placeholder="Enter a new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <FormFieldLabel fieldKey="auth.confirmPassword" label="Confirm password">
            Confirm password
          </FormFieldLabel>
          <Input
            type="password"
            placeholder="Re-enter the password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Minimum 8 characters. Updating the password ends all sessions.
          </p>
          {confirmPassword && newPassword !== confirmPassword ? (
            <p className="text-xs text-destructive">Passwords do not match.</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={setPassword.isPending}
              onClick={() => {
                const parsed = adminResetPasswordSchema.safeParse({
                  newPassword,
                  confirmPassword,
                });
                if (!parsed.success) {
                  toast.error(parsed.error.issues[0]?.message ?? 'Check the password.');
                  return;
                }
                setPassword.mutate(parsed.data.newPassword);
              }}
            >
              Update password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DebugApiSection payloads={debugPayloads} />
    </div>
  );
}

function ProfileFact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`max-w-[60%] truncate text-right font-medium text-foreground ${mono ? 'font-mono text-xs' : ''}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function rowIdFromProfile(row: Record<string, unknown>): string {
  const id = row.id ?? row.userId;
  return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
}
