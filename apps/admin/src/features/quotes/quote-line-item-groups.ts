import {
  defaultLineItem,
  lineTotal,
  type QuoteLineItem,
} from '@/features/quotes/admin-quote-utils';

export type QuoteLineItemGroup = {
  id: string;
  label: string;
  collapsed?: boolean;
  items: QuoteLineItem[];
};

export function newGroupId(): string {
  return `grp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newGroup(label = 'New phase', items?: QuoteLineItem[]): QuoteLineItemGroup {
  return {
    id: newGroupId(),
    label,
    items: items?.length ? items : [defaultLineItem()],
  };
}

export function itemsFromGroups(groups: QuoteLineItemGroup[]): QuoteLineItem[] {
  return groups.flatMap((g) => g.items);
}

export function groupSubtotal(group: QuoteLineItemGroup): number {
  return group.items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function groupsFromFlatItems(items: QuoteLineItem[]): QuoteLineItemGroup[] {
  const filled = items.filter((i) => i.description.trim() || i.unitPrice > 0);
  if (filled.length === 0) {
    return [newGroup('Phase 1')];
  }
  return [newGroup('Deliverables', filled)];
}

export type PhasePreset = {
  label: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export function groupsFromPresets(presets: PhasePreset[]): QuoteLineItemGroup[] {
  return presets.map((p) =>
    newGroup(p.label, [
      {
        description: p.description,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      },
    ])
  );
}

export function countFilledItems(groups: QuoteLineItemGroup[]): number {
  return groups.reduce(
    (n, g) => n + g.items.filter((i) => i.description.trim() && i.unitPrice > 0).length,
    0
  );
}

/** Deep-clone a phase with a new id (for duplicate). */
export function duplicateGroup(group: QuoteLineItemGroup): QuoteLineItemGroup {
  return {
    id: newGroupId(),
    label: group.label.trim() ? `${group.label} (copy)` : 'Phase (copy)',
    collapsed: false,
    items: group.items.map((item) => ({ ...item })),
  };
}

/** Reorder phases by index (used by drag-and-drop). */
export function moveGroup(
  groups: QuoteLineItemGroup[],
  fromIndex: number,
  toIndex: number
): QuoteLineItemGroup[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= groups.length ||
    toIndex >= groups.length
  ) {
    return groups;
  }
  const next = [...groups];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return groups;
  next.splice(toIndex, 0, moved);
  return next;
}

export function insertGroupAfter(
  groups: QuoteLineItemGroup[],
  afterGroupId: string,
  group: QuoteLineItemGroup
): QuoteLineItemGroup[] {
  const idx = groups.findIndex((g) => g.id === afterGroupId);
  if (idx < 0) return [...groups, group];
  const next = [...groups];
  next.splice(idx + 1, 0, group);
  return next;
}
