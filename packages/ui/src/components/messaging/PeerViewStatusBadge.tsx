'use client';

import { cn } from '../../utils/cn';

export type PeerViewState = 'live' | 'waiting';

export function peerViewLabel(
  state: PeerViewState | null | undefined,
  perspective: 'admin' | 'client'
): string | null {
  if (!state) return null;
  if (state === 'live') {
    return perspective === 'admin' ? 'Client live' : 'Support live';
  }
  return perspective === 'admin' ? 'Client waiting' : 'Support waiting';
}

export function peerViewShortLabel(state: PeerViewState | null | undefined): string | null {
  if (!state) return null;
  return state === 'live' ? 'Live' : 'Waiting';
}

export function PeerViewStatusBadge({
  state,
  perspective = 'admin',
  short = false,
  className,
}: {
  state: PeerViewState | null | undefined;
  perspective?: 'admin' | 'client';
  short?: boolean;
  className?: string;
}) {
  if (!state) return null;

  const label = short ? peerViewShortLabel(state) : peerViewLabel(state, perspective);
  if (!label) return null;

  return (
    <span
      className={cn(
        'peer-view-badge',
        state === 'live' ? 'peer-view-badge--live' : 'peer-view-badge--waiting',
        className
      )}
      aria-label={label}
    >
      {state === 'live' ? (
        <span className="peer-view-badge-dot" aria-hidden />
      ) : (
        <span className="peer-view-badge-wait" aria-hidden />
      )}
      {label}
    </span>
  );
}
