<div align="center">

# `@nestlancer/hooks`

### Reusable **React hooks** with no knowledge of Nestlancer domains. Safe to import from any app or package that runs in the browser (client components only).

</div>

---

## 📖 Table of Contents

- [Package info](#package-info)
- [When to use this package vs feature hooks](#when-to-use-this-package-vs-feature-hooks)
- [📡 API reference](#api-reference)
- [Files](#files)
- [🧪 Testing](#testing)
- [📚 Related documentation](#related-documentation)

---

## Package info

|                  |                                                       |
| :--------------- | :---------------------------------------------------- |
| **Path**         | `packages/hooks/src/`                                 |
| **Import**       | `import { useDebounce, … } from '@nestlancer/hooks';` |
| **Dependencies** | `react` only (no `@nestlancer/*`)                     |

---

## When to use this package vs feature hooks

| Use `@nestlancer/hooks`               | Use `apps/*/src/features/**/hooks/` |
| :------------------------------------ | :---------------------------------- |
| Debounce search input                 | `useProjects`, `useLogin`           |
| Persist UI preference in localStorage | TanStack Query wrappers             |
| Responsive breakpoint                 | API mutations                       |

---

## 📡 API reference

### `useDebounce<T>(value, delayMs)`

Returns a value that updates only after `delayMs` milliseconds without `value` changing.

**Use case:** search boxes, filter inputs — avoid API call on every keystroke.

```tsx
'use client';
import { useState } from 'react';
import { useDebounce } from '@nestlancer/hooks';

export function ProjectSearch() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  // useEffect or useQuery keyed on debouncedQ
  return <input value={q} onChange={(e) => setQ(e.target.value)} />;
}
```

### `useThrottle<T>(value, intervalMs)`

Like debounce but emits at most once per interval while `value` keeps changing (trailing edge via latest value).

**Use case:** scroll position, resize handlers feeding state.

### `useLocalStorage<T>(key, initial)`

Returns `[value, setValue]` synced with `localStorage` (JSON serialized). SSR-safe: on server, always returns `initial`.

**Use case:** sidebar collapsed, table page size, non-sensitive UI prefs. **Do not** store tokens — auth uses HttpOnly cookies.

```tsx
const [dense, setDense] = useLocalStorage('admin-table-dense', false);
```

### `useMediaQuery(query)`

Returns `boolean` for a CSS media query, e.g. `'(min-width: 1024px)'`. Subscribes to `matchMedia` changes.

**Use case:** conditional render instead of-only-CSS when JS behavior differs (drawer vs sidebar).

### `useIntersectionObserver(ref, options?)`

Observes an element ref for viewport intersection. Returns `IntersectionObserverEntry | undefined`.

**Use case:** infinite scroll sentinel, lazy-load analytics.

```tsx
const ref = useRef<HTMLDivElement>(null);
const entry = useIntersectionObserver(ref, { threshold: 0.5 });
const visible = entry?.isIntersecting ?? false;
```

### `usePrevious<T>(value)`

Returns the previous render’s `value` (undefined on first render).

**Use case:** compare old vs new props, animation direction, skip duplicate effects.

---

## Files

| File                         | Export                    |
| :--------------------------- | :------------------------ |
| `useDebounce.ts`             | `useDebounce`             |
| `useThrottle.ts`             | `useThrottle`             |
| `useLocalStorage.ts`         | `useLocalStorage`         |
| `useMediaQuery.ts`           | `useMediaQuery`           |
| `useIntersectionObserver.ts` | `useIntersectionObserver` |
| `usePrevious.ts`             | `usePrevious`             |

Barrel: `index.ts` re-exports all.

---

## 🧪 Testing

Hooks are tested indirectly via feature components; add unit tests with `@testing-library/react` if you change timing behavior.

---

## 📚 Related documentation

- [Web app](../apps/web.md)
- [Frontend architecture](../../architecture/overview.md)
- [Modification playbook](../../guides/modification-playbook.md)

---

<div align="center">

**`@nestlancer/hooks`** — Nestlancer backend component documentation

</div>
