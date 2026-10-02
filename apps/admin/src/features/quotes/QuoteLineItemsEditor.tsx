'use client';

import { useState } from 'react';
import { ChevronsUpDown, FileStack, Menu, Plus, Trash2 } from '@nestlancer/ui/icons';

import { formatCurrency } from '@nestlancer/utils';
import { FieldHelp, FormFieldLabel } from '@nestlancer/field-help';
import { Button, cn } from '@nestlancer/ui';

import {
  defaultLineItem,
  lineTotal,
  type QuoteLineItem,
} from '@/features/quotes/admin-quote-utils';
import {
  duplicateGroup,
  groupSubtotal,
  moveGroup,
  newGroup,
  type QuoteLineItemGroup,
} from '@/features/quotes/quote-line-item-groups';
import { LineItemLibraryPanel } from '@/features/quotes/LineItemLibraryPanel';

type QuoteLineItemsEditorProps = {
  groups: QuoteLineItemGroup[];
  onChange: (groups: QuoteLineItemGroup[]) => void;
  currency: string;
  onApplyPresets?: () => void;
  presetLabel?: string;
  showPrefill?: boolean;
  sourceQuoteId?: string;
  onSourceQuoteIdChange?: (id: string) => void;
  onLoadPrefill?: () => void;
  prefillPending?: boolean;
};

function updateGroup(
  groups: QuoteLineItemGroup[],
  groupId: string,
  updater: (group: QuoteLineItemGroup) => QuoteLineItemGroup
): QuoteLineItemGroup[] {
  return groups.map((g) => (g.id === groupId ? updater(g) : g));
}

function moveItem(items: QuoteLineItem[], from: number, to: number): QuoteLineItem[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  if (!row) return items;
  next.splice(to, 0, row);
  return next;
}

export function QuoteLineItemsEditor({
  groups,
  onChange,
  currency,
  onApplyPresets,
  presetLabel = 'Use phase template',
  showPrefill = false,
  sourceQuoteId = '',
  onSourceQuoteIdChange,
  onLoadPrefill,
  prefillPending = false,
}: QuoteLineItemsEditorProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dropTargetGroupId, setDropTargetGroupId] = useState<string | null>(null);

  function patchGroup(groupId: string, patch: Partial<QuoteLineItemGroup>) {
    onChange(updateGroup(groups, groupId, (g) => ({ ...g, ...patch })));
  }

  function patchItem(groupId: string, itemIndex: number, patch: Partial<QuoteLineItem>) {
    onChange(
      updateGroup(groups, groupId, (g) => {
        const items = [...g.items];
        items[itemIndex] = { ...defaultLineItem(), ...items[itemIndex], ...patch };
        return { ...g, items };
      })
    );
  }

  function addItem(groupId: string) {
    onChange(
      updateGroup(groups, groupId, (g) => ({
        ...g,
        collapsed: false,
        items: [...g.items, defaultLineItem()],
      }))
    );
  }

  function removeItem(groupId: string, itemIndex: number) {
    onChange(
      updateGroup(groups, groupId, (g) => {
        const items = g.items.filter((_, i) => i !== itemIndex);
        return { ...g, items: items.length ? items : [defaultLineItem()] };
      })
    );
  }

  function insertFromLibrary(item: QuoteLineItem, groupId?: string) {
    const targetId = groupId ?? activeGroupId ?? groups[groups.length - 1]?.id;
    if (!targetId) {
      onChange([newGroup('Phase 1', [item])]);
      return;
    }
    onChange(
      updateGroup(groups, targetId, (g) => ({
        ...g,
        collapsed: false,
        items: [...g.items, item],
      }))
    );
  }

  function handlePhaseDragStart(groupId: string) {
    setDraggedGroupId(groupId);
  }

  function handlePhaseDragOver(e: React.DragEvent, targetGroupId: string) {
    e.preventDefault();
    if (draggedGroupId && draggedGroupId !== targetGroupId) {
      setDropTargetGroupId(targetGroupId);
    }
  }

  function handlePhaseDrop(targetGroupId: string) {
    if (!draggedGroupId || draggedGroupId === targetGroupId) {
      setDraggedGroupId(null);
      setDropTargetGroupId(null);
      return;
    }
    const fromIndex = groups.findIndex((g) => g.id === draggedGroupId);
    const toIndex = groups.findIndex((g) => g.id === targetGroupId);
    if (fromIndex >= 0 && toIndex >= 0) {
      onChange(moveGroup(groups, fromIndex, toIndex));
    }
    setDraggedGroupId(null);
    setDropTargetGroupId(null);
  }

  function handlePhaseDragEnd() {
    setDraggedGroupId(null);
    setDropTargetGroupId(null);
  }

  function duplicatePhase(group: QuoteLineItemGroup) {
    const copy = duplicateGroup(group);
    const idx = groups.findIndex((g) => g.id === group.id);
    const next = [...groups];
    next.splice(idx + 1, 0, copy);
    onChange(next);
    setActiveGroupId(copy.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <FormFieldLabel fieldKey="quotes.lineItemDescription" label="Project phases" required>
            Project phases & deliverables
          </FormFieldLabel>
          <p className="mt-1 text-xs text-muted-foreground">
            Split the project into phases (Discovery, Build, Launch). Each phase can have multiple
            line items with qty and unit price.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onApplyPresets ? (
            <Button type="button" size="sm" variant="outline" onClick={onApplyPresets}>
              {presetLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowLibrary((v) => !v)}
          >
            {showLibrary ? 'Hide library' : 'Line-item library'}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onChange([...groups, newGroup(`Phase ${groups.length + 1}`)])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
            Add phase
          </Button>
        </div>
      </div>

      {showPrefill && onSourceQuoteIdChange && onLoadPrefill ? (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border/70 bg-muted/10 p-3">
          <div className="min-w-[14rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="prefill-quote-id">
              Copy from past quote
            </label>
            <input
              id="prefill-quote-id"
              value={sourceQuoteId}
              onChange={(e) => onSourceQuoteIdChange(e.target.value)}
              placeholder="Paste a quote ID to copy its line items"
              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={prefillPending || !sourceQuoteId.trim()}
            onClick={onLoadPrefill}
          >
            {prefillPending ? 'Loading…' : 'Load prefill'}
          </Button>
        </div>
      ) : null}

      {showLibrary ? (
        <div className="rounded-lg border border-border/70 p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Inserts into{' '}
            <span className="font-medium text-foreground">
              {groups.find((g) => g.id === activeGroupId)?.label ?? 'last phase'}
            </span>
            . Click a phase header first to target a different section.
          </p>
          <LineItemLibraryPanel onInsert={(item) => insertFromLibrary(item)} />
        </div>
      ) : null}

      <div className="space-y-4">
        {groups.map((group, groupIndex) => {
          const subtotal = groupSubtotal(group);
          const collapsed = group.collapsed ?? false;
          const isActive = activeGroupId === group.id;

          return (
            <section
              key={group.id}
              draggable
              onDragStart={() => handlePhaseDragStart(group.id)}
              onDragOver={(e) => handlePhaseDragOver(e, group.id)}
              onDrop={() => handlePhaseDrop(group.id)}
              onDragEnd={handlePhaseDragEnd}
              className={cn(
                'overflow-hidden rounded-xl border bg-card shadow-sm transition-all',
                isActive ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/70',
                draggedGroupId === group.id && 'opacity-50',
                dropTargetGroupId === group.id &&
                  draggedGroupId !== group.id &&
                  'border-primary border-dashed ring-2 ring-primary/30'
              )}
            >
              <header className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-2.5 sm:px-4">
                <button
                  type="button"
                  className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                  aria-label={`Drag to reorder ${group.label || `phase ${groupIndex + 1}`}`}
                  onMouseDown={() => setActiveGroupId(group.id)}
                >
                  <Menu className="h-4 w-4 shrink-0" aria-hidden />
                </button>
                <input
                  value={group.label}
                  onFocus={() => setActiveGroupId(group.id)}
                  onChange={(e) => patchGroup(group.id, { label: e.target.value })}
                  className="min-w-[8rem] flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                  placeholder={`Phase ${groupIndex + 1}`}
                  aria-label={`Phase ${groupIndex + 1} name`}
                />
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {formatCurrency(subtotal, currency)}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => addItem(group.id)}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Row</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    title="Duplicate phase"
                    onClick={() => duplicatePhase(group)}
                  >
                    <FileStack className="h-3.5 w-3.5" aria-hidden />
                    <span className="sr-only">Duplicate phase</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    disabled={groups.length <= 1}
                    onClick={() => onChange(groups.filter((g) => g.id !== group.id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => patchGroup(group.id, { collapsed: !collapsed })}
                    aria-expanded={!collapsed}
                  >
                    {collapsed ? (
                      <ChevronsUpDown className="h-4 w-4" aria-hidden />
                    ) : (
                      <ChevronsUpDown className="h-4 w-4 rotate-180" aria-hidden />
                    )}
                  </Button>
                </div>
              </header>

              {!collapsed ? (
                <div className="max-h-[min(52vh,28rem)] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
                      <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="w-10 px-2 py-2 font-medium">#</th>
                        <th className="min-w-[14rem] px-2 py-2 font-medium">
                          <span className="inline-flex items-center gap-1">
                            Deliverable
                            <FieldHelp fieldKey="quotes.lineItemDescription" label="Description" />
                          </span>
                        </th>
                        <th className="w-20 px-2 py-2 font-medium">
                          <span className="inline-flex items-center gap-1">
                            Qty
                            <FieldHelp fieldKey="quotes.lineItemQuantity" label="Quantity" />
                          </span>
                        </th>
                        <th className="w-28 px-2 py-2 font-medium">
                          <span className="inline-flex items-center gap-1">
                            Unit
                            <FieldHelp fieldKey="quotes.lineItemUnitPrice" label="Unit price" />
                          </span>
                        </th>
                        <th className="w-28 px-2 py-2 text-right font-medium">Total</th>
                        <th className="w-16 px-1 py-2" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, itemIndex) => (
                        <tr
                          key={`${group.id}-${itemIndex}`}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/20"
                        >
                          <td className="px-2 py-2 align-top text-xs tabular-nums text-muted-foreground">
                            {itemIndex + 1}
                          </td>
                          <td className="px-2 py-2 align-top">
                            <textarea
                              rows={2}
                              value={item.description}
                              placeholder="What the client receives in this phase…"
                              className="w-full min-w-[12rem] resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-sm leading-snug"
                              onFocus={() => setActiveGroupId(group.id)}
                              onChange={(e) =>
                                patchItem(group.id, itemIndex, { description: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-2 py-2 align-top">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={item.quantity || ''}
                              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums"
                              placeholder="1"
                              onChange={(e) =>
                                patchItem(group.id, itemIndex, {
                                  quantity: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                            />
                          </td>
                          <td className="px-2 py-2 align-top">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="50000"
                              value={item.unitPrice || ''}
                              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums"
                              onChange={(e) =>
                                patchItem(group.id, itemIndex, {
                                  unitPrice: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                            />
                          </td>
                          <td className="px-2 py-2 text-right align-top text-sm font-medium tabular-nums">
                            {formatCurrency(lineTotal(item), currency)}
                          </td>
                          <td className="px-1 py-2 align-top">
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                                disabled={itemIndex === 0}
                                aria-label="Move up"
                                onClick={() =>
                                  patchGroup(group.id, {
                                    items: moveItem(group.items, itemIndex, itemIndex - 1),
                                  })
                                }
                              >
                                <span className="text-xs leading-none">↑</span>
                              </button>
                              <button
                                type="button"
                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                                disabled={group.items.length <= 1}
                                aria-label="Remove row"
                                onClick={() => removeItem(group.id, itemIndex)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                                disabled={itemIndex === group.items.length - 1}
                                aria-label="Move down"
                                onClick={() =>
                                  patchGroup(group.id, {
                                    items: moveItem(group.items, itemIndex, itemIndex + 1),
                                  })
                                }
                              >
                                <span className="text-xs leading-none">↓</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {!collapsed ? (
                <footer className="flex items-center justify-between border-t border-border/50 bg-muted/10 px-4 py-2 text-xs">
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => addItem(group.id)}
                  >
                    + Add line to {group.label || `phase ${groupIndex + 1}`}
                  </button>
                  <span className="font-semibold tabular-nums text-foreground">
                    Phase subtotal: {formatCurrency(subtotal, currency)}
                  </span>
                </footer>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
