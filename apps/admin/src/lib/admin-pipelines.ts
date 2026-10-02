import type { ComponentType } from 'react';

import {
  ClipboardList,
  CreditCard,
  FolderKanban,
  Inbox,
  MessageSquare,
  Receipt,
  ScrollText,
  ShieldAlert,
  Users,
} from '@nestlancer/ui/icons';

import type { AdminEndpointGroup } from '@/lib/admin-endpoints';
import { ADMIN_ENDPOINT_GROUPS } from '@/lib/admin-endpoints';

export type PipelineStage = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** Endpoint group id from admin-endpoints.ts */
  endpointGroupId: string;
  /** Previous stage ids — data dependencies */
  dependsOn?: string[];
  /** Primary operator action at this stage */
  operatorAction: string;
};

export type AdminPipeline = {
  id: string;
  title: string;
  description: string;
  /** Who this pipeline serves */
  audience: string;
  stages: PipelineStage[];
};

function groupById(id: string): AdminEndpointGroup | undefined {
  return ADMIN_ENDPOINT_GROUPS.find((g) => g.id === id);
}

export const CLIENT_DELIVERY_PIPELINE: AdminPipeline = {
  id: 'client-delivery',
  title: 'Client delivery',
  description:
    'End-to-end flow from first contact through paid delivery. Each stage feeds the next — manage the full client journey in order.',
  audience: 'Clients requesting Nestlancer services',
  stages: [
    {
      id: 'contact',
      label: 'Inquiries',
      description: 'Website contact form leads',
      href: '/contact',
      icon: Inbox,
      endpointGroupId: 'contact',
      operatorAction: 'Qualify lead and convert to request',
    },
    {
      id: 'requests',
      label: 'Requests',
      description: 'Scoped service requests',
      href: '/requests',
      icon: ClipboardList,
      endpointGroupId: 'requests',
      dependsOn: ['contact'],
      operatorAction: 'Triage, assign, and prepare quote',
    },
    {
      id: 'quotes',
      label: 'Quotes',
      description: 'Pricing proposals',
      href: '/quotes',
      icon: Receipt,
      endpointGroupId: 'quotes',
      dependsOn: ['requests'],
      operatorAction: 'Send quote and track acceptance',
    },
    {
      id: 'projects',
      label: 'Projects',
      description: 'Active delivery work',
      href: '/projects',
      icon: FolderKanban,
      endpointGroupId: 'projects',
      dependsOn: ['quotes'],
      operatorAction: 'Manage milestones and deliverables',
    },
    {
      id: 'payments',
      label: 'Payments',
      description: 'Milestone payments and payouts',
      href: '/payments',
      icon: CreditCard,
      endpointGroupId: 'payments',
      dependsOn: ['projects'],
      operatorAction: 'Release funds and resolve disputes',
    },
    {
      id: 'messages',
      label: 'Messages',
      description: 'Project communication',
      href: '/messages',
      icon: MessageSquare,
      endpointGroupId: 'messages',
      dependsOn: ['projects'],
      operatorAction: 'Monitor threads and system broadcasts',
    },
  ],
};

export const TRUST_COMPLIANCE_PIPELINE: AdminPipeline = {
  id: 'trust-compliance',
  title: 'Users & trust',
  description:
    'Manage all client and operator accounts, enforce platform safety, and maintain an audit trail.',
  audience: 'Every registered user on the platform',
  stages: [
    {
      id: 'users',
      label: 'Users',
      description: 'Accounts, roles, sessions',
      href: '/users',
      icon: Users,
      endpointGroupId: 'users',
      operatorAction: 'Review profile, role, and sessions',
    },
    {
      id: 'moderation',
      label: 'Moderation',
      description: 'Flagged messages and abuse',
      href: '/moderation',
      icon: ShieldAlert,
      endpointGroupId: 'messages',
      dependsOn: ['users'],
      operatorAction: 'Dismiss, escalate, or remove content',
    },
    {
      id: 'audit',
      label: 'Audit logs',
      description: 'Auth and admin action history',
      href: '/audit',
      icon: ScrollText,
      endpointGroupId: 'system',
      dependsOn: ['users'],
      operatorAction: 'Investigate security events',
    },
  ],
};

export const ADMIN_PIPELINES: AdminPipeline[] = [
  CLIENT_DELIVERY_PIPELINE,
  TRUST_COMPLIANCE_PIPELINE,
];

/** Standalone consoles — not part of a sequential pipeline */
export const ADMIN_STANDALONE_MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    description: 'KPIs, revenue, alerts',
    endpointGroupId: 'dashboard',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    description: 'Deep metrics and trends',
    endpointGroupId: 'dashboard',
  },
  {
    id: 'content',
    label: 'Blog',
    href: '/content',
    description: 'Posts, comments, and taxonomy',
    endpointGroupId: 'content',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    href: '/portfolio',
    description: 'Public showcase items',
    endpointGroupId: 'portfolio',
  },
  {
    id: 'media',
    label: 'Media',
    href: '/media',
    description: 'Files and quarantine',
    endpointGroupId: 'media',
  },
  {
    id: 'system',
    label: 'System',
    href: '/system',
    description: 'Config, jobs, flags',
    endpointGroupId: 'system',
  },
  {
    id: 'integrations',
    label: 'Webhooks',
    href: '/integrations',
    description: 'Outbound integrations',
    endpointGroupId: 'system',
  },
] as const;

export function getStageEndpoints(stage: PipelineStage) {
  return groupById(stage.endpointGroupId)?.endpoints ?? [];
}

export function getModuleEndpoints(groupId: string) {
  return groupById(groupId)?.endpoints ?? [];
}
