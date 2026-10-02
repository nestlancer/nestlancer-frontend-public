'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@nestlancer/ui';
import { apiServices } from '@/lib/axios';
import { pickAdminRows, rowTitle } from '@/lib/admin-response';

export type UserOption = {
  id: string;
  name: string;
  email: string;
};

interface SingleProps {
  mode?: 'single';
  value?: string;
  onChange: (userId: string, user: UserOption) => void;
  roleFilter?: 'ADMIN' | 'USER';
  placeholder?: string;
  displayName?: string;
  id?: string;
  name?: string;
}

interface MultiProps {
  mode: 'multi';
  values: UserOption[];
  onChange: (users: UserOption[]) => void;
  roleFilter?: 'ADMIN' | 'USER';
  placeholder?: string;
  id?: string;
  name?: string;
}

type Props = SingleProps | MultiProps;

function asUserOptions(data: unknown): UserOption[] {
  return pickAdminRows(data)
    .map((row) => ({
      id: String(row.id ?? ''),
      name: rowTitle(row),
      email: String(row.email ?? ''),
    }))
    .filter((opt) => opt.id.length > 0);
}

export function UserSearchCombobox(props: Props) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const fieldId = props.id ?? generatedId;
  const fieldName = props.name ?? 'user-search';

  const trimmedSearch = search.trim();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'users', 'search', trimmedSearch, props.roleFilter],
    queryFn: () =>
      trimmedSearch
        ? apiServices.admin.searchUsers({
            q: trimmedSearch,
            role: props.roleFilter,
            limit: 10,
            page: 1,
          })
        : apiServices.admin.listUsers({
            role: props.roleFilter,
            limit: 10,
            page: 1,
          }),
    enabled: open,
    staleTime: 30_000,
  });

  const options = asUserOptions(data);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (props.mode === 'multi') {
    const selected = props.values;
    const toggle = (opt: UserOption) => {
      const exists = selected.find((u) => u.id === opt.id);
      if (exists) {
        props.onChange(selected.filter((u) => u.id !== opt.id));
      } else {
        props.onChange([...selected, opt]);
      }
    };
    return (
      <div className="space-y-2" ref={containerRef}>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs"
              >
                {u.name}
                <button
                  type="button"
                  onClick={() => props.onChange(selected.filter((s) => s.id !== u.id))}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <Input
            id={fieldId}
            name={fieldName}
            className="rounded-lg pl-3"
            placeholder={props.placeholder ?? 'Search users…'}
            value={search}
            onFocus={() => setOpen(true)}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={props.placeholder ?? 'Search users'}
          />
          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
              {isLoading ? (
                <p className="p-3 text-sm text-muted-foreground">Searching…</p>
              ) : isError ? (
                <p className="p-3 text-sm text-destructive">
                  Could not load users{error instanceof Error ? `: ${error.message}` : ''}
                </p>
              ) : options.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  {trimmedSearch ? `No users match “${trimmedSearch}”` : 'No users found'}
                </p>
              ) : (
                <ul className="max-h-48 overflow-auto py-1">
                  {options.map((opt) => {
                    const isSelected = selected.some((u) => u.id === opt.id);
                    return (
                      <li key={opt.id}>
                        <button
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${isSelected ? 'bg-accent/50' : ''}`}
                          onClick={() => toggle(opt)}
                        >
                          <span className="font-medium">{opt.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{opt.email}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single mode — always-visible input (NL-BUG-PIPE-2); closed state used to be a button only.
  const selectedName = (props as SingleProps).displayName;
  return (
    <div className="relative" ref={containerRef}>
      <Input
        id={fieldId}
        name={fieldName}
        className="rounded-lg"
        placeholder={
          selectedName
            ? selectedName
            : ((props as SingleProps).placeholder ?? 'Search by name or email…')
        }
        value={search}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        aria-label={(props as SingleProps).placeholder ?? 'Search by name or email'}
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          {isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">Searching…</p>
          ) : isError ? (
            <p className="p-3 text-sm text-destructive">
              Could not load users{error instanceof Error ? `: ${error.message}` : ''}
            </p>
          ) : options.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {trimmedSearch ? `No users match “${trimmedSearch}”` : 'No users found'}
            </p>
          ) : (
            <ul className="max-h-48 overflow-auto py-1" role="listbox">
              {options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      (props as SingleProps).onChange(opt.id, opt);
                      setSearch('');
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">{opt.name}</span>
                    {opt.email ? (
                      <span className="ml-2 text-xs text-muted-foreground">{opt.email}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
