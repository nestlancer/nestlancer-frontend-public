'use client';

import Link from 'next/link';
import type { Conversation } from '@nestlancer/types';
import type { PeerViewState } from '@nestlancer/websocket';
import { cn, messagingKindBadgeClass, PeerViewStatusBadge } from '@nestlancer/ui';
import { Search } from '@nestlancer/ui/icons';
import { formatRelativeTime } from '@nestlancer/utils';

import type { DockSlot } from './AdminChatDock';
import {
  conversationActivityAt,
  conversationHref,
  conversationInitials,
  conversationIsUnread,
  conversationIsUrgent,
  conversationKindLabel,
  conversationPreview,
  conversationTitle,
  conversationWaitLabel,
  type ConversationKindFilter,
  type QueueSort,
} from './conversation-utils';

type QueueBaseProps = {
  rows: Conversation[];
  search: string;
  onSearchChange: (value: string) => void;
  kindFilter: ConversationKindFilter | 'all';
  onKindFilterChange: (value: ConversationKindFilter | 'all') => void;
  statusFilter: 'all' | 'unread';
  onStatusFilterChange: (value: 'all' | 'unread') => void;
  queueSort: QueueSort;
  onQueueSortChange: (value: QueueSort) => void;
  inboxFilter: 'active' | 'archived';
  onInboxFilterChange: (value: 'active' | 'archived') => void;
  onOpenRow: (conversation: Conversation) => void;
  peerViewForConversation?: (conversation: Conversation) => PeerViewState | null;
};

type DockQueueProps = QueueBaseProps & {
  mode?: 'dock';
  slots: Map<string, DockSlot>;
  focusedId: string | null;
};

type InlineQueueProps = QueueBaseProps & {
  mode: 'inline';
  selectedId: string | null;
  waitingCount?: number;
};

export function AdminConversationQueue(props: DockQueueProps | InlineQueueProps) {
  const isInline = props.mode === 'inline';
  const selectedId = isInline
    ? (props as InlineQueueProps).selectedId
    : (props as DockQueueProps).focusedId;
  const waitingCount = isInline ? ((props as InlineQueueProps).waitingCount ?? 0) : 0;

  return (
    <section className="inbox-queue">
      <div className="inbox-queue-header">
        <div>
          <h2 className="inbox-queue-title">Conversation queue</h2>
          <p className="inbox-queue-subtitle">
            {props.rows.length} conversation{props.rows.length === 1 ? '' : 's'} —{' '}
            {isInline ? 'click to open in the workspace' : 'click to open in dock'}
          </p>
          {isInline && waitingCount > 0 ? (
            <p className="inbox-queue-live-count">
              <span className="inbox-queue-live-count-dot" />
              {waitingCount} waiting for response
            </p>
          ) : null}
        </div>
      </div>

      <div className={cn('inbox-queue-toolbar', isInline && 'inbox-queue-toolbar-modern')}>
        <label className="inbox-queue-search">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            id="inbox-queue-search"
            name="q"
            type="search"
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            placeholder="Search by name, preview, or ID…"
            className="inbox-queue-search-input"
            aria-label="Search conversations"
          />
        </label>

        <div className="inbox-queue-chips" role="group" aria-label="Filter by type">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread' },
              { value: 'direct', label: 'Direct' },
              { value: 'project', label: 'Project' },
              { value: 'group', label: 'Group' },
            ] as const
          ).map((chip) => {
            const isStatusChip = chip.value === 'unread';
            const active = isStatusChip
              ? props.statusFilter === 'unread'
              : props.kindFilter === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                className={cn('inbox-queue-chip', active && 'is-active')}
                aria-pressed={active}
                onClick={() => {
                  if (isStatusChip) {
                    props.onStatusFilterChange(props.statusFilter === 'unread' ? 'all' : 'unread');
                    return;
                  }
                  props.onKindFilterChange(chip.value);
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <FilterSelect
          label="Inbox"
          value={props.inboxFilter}
          onChange={(v) => props.onInboxFilterChange(v as 'active' | 'archived')}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'archived', label: 'Archived' },
          ]}
        />

        <FilterSelect
          label="Sort"
          value={props.queueSort}
          onChange={(v) => props.onQueueSortChange(v as QueueSort)}
          options={[
            { value: 'recent', label: 'Latest' },
            { value: 'unread', label: 'Unread first' },
            { value: 'waiting', label: 'Longest wait' },
          ]}
        />
      </div>

      <div className="inbox-queue-list" role="list">
        {props.rows.map((row) => {
          const docked = !isInline && 'slots' in props && props.slots.has(row.id);
          const minimized =
            !isInline && 'slots' in props ? (props.slots.get(row.id)?.minimized ?? false) : false;
          const isSelected = selectedId === row.id;

          return (
            <QueueRow
              key={row.id}
              row={row}
              inline={isInline}
              href={isInline ? conversationHref(row) : undefined}
              docked={docked}
              minimized={minimized}
              selected={isSelected}
              peerViewState={props.peerViewForConversation?.(row) ?? null}
              onOpen={() => props.onOpenRow(row)}
            />
          );
        })}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inbox-queue-filter">
      <span className="sr-only">{label}</span>
      <select
        className="inbox-queue-filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function QueueRow({
  row,
  inline,
  href,
  docked,
  minimized,
  selected,
  peerViewState,
  onOpen,
}: {
  row: Conversation;
  inline: boolean;
  href?: string;
  docked: boolean;
  minimized: boolean;
  selected: boolean;
  peerViewState: PeerViewState | null;
  onOpen: () => void;
}) {
  const unread = conversationIsUnread(row);
  const urgent = conversationIsUrgent(row);
  const kind = conversationKindLabel(row) as keyof typeof messagingKindBadgeClass;
  const activityAt = conversationActivityAt(row);
  const waitLabel = conversationWaitLabel(row);
  const title = conversationTitle(row);
  const preview = conversationPreview(row);

  const className = cn(
    'inbox-queue-row',
    selected && (inline ? 'is-selected' : 'is-focused'),
    docked && 'is-docked',
    unread && 'is-unread',
    urgent && 'is-urgent'
  );

  const body = (
    <>
      <div className="inbox-queue-row-avatar" aria-hidden>
        {conversationInitials(row)}
        {unread ? <span className="inbox-queue-row-unread-dot" /> : null}
      </div>

      <div className="inbox-queue-row-body">
        <div className="inbox-queue-row-top">
          <span className="inbox-queue-row-name">{title}</span>
          <span
            className={cn(
              'inbox-queue-row-kind',
              messagingKindBadgeClass[kind] ?? messagingKindBadgeClass.Direct
            )}
          >
            {kind}
          </span>
          <PeerViewStatusBadge state={peerViewState} perspective="admin" short />
          {waitLabel ? (
            <span className={cn('inbox-queue-row-wait', urgent && 'is-urgent')}>{waitLabel}</span>
          ) : null}
          <span className="inbox-queue-row-time">
            {activityAt ? formatRelativeTime(activityAt) : '—'}
          </span>
        </div>
        <p className="inbox-queue-row-preview">{preview}</p>
      </div>

      {!inline ? (
        <span
          className={cn(
            'inbox-queue-row-status',
            docked && !minimized && 'is-open',
            docked && minimized && 'is-minimized'
          )}
        >
          {docked ? (minimized ? 'Minimized' : selected ? 'Active' : 'Open') : 'Open'}
        </span>
      ) : unread ? (
        <span className="inbox-queue-row-unread-dot static shrink-0" />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} role="listitem" className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" role="listitem" className={className} onClick={onOpen}>
      {body}
    </button>
  );
}
