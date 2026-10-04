<div align="center">

# `@nestlancer/ui`

### Shared **design system** for web and admin. Tailwind-based primitives and composites — no API or domain imports.

</div>

---

## 📖 Table of Contents

- [Package info](#package-info)
- [Directory layout](#directory-layout)
- [When to add here vs in `apps/*/features`](#when-to-add-here-vs-in-appsfeatures)
- [Usage patterns](#usage-patterns)
- [Theming](#theming)
- [Accessibility](#accessibility)
- [📚 Related documentation](#related-documentation)

---

## Package info

|             |                                                             |
| :---------- | :---------------------------------------------------------- |
| **Path**    | `packages/ui/src/components/`                               |
| **Import**  | `import { Button, Card, DataTable } from '@nestlancer/ui';` |
| **Styling** | Tailwind + `cn()` helper                                    |

---

## Directory layout

```
packages/ui/src/
├── components/
│   ├── primitives/     # Button, Input, Select, Checkbox, Badge, Avatar
│   ├── forms/          # FormField, FormGroup, FileUpload
│   ├── feedback/       # Alert, Toast, Modal, Spinner, Skeleton
│   ├── navigation/     # Navbar, Sidebar, Tabs, Breadcrumb
│   ├── data-display/   # DataTable, Card, EmptyState
│   └── layout/         # Container, Stack
├── hooks/              # useDisclosure, useClickOutside
└── utils/cn.ts         # clsx + tailwind-merge
```

---

## When to add here vs in `apps/*/features`

| Add to `@nestlancer/ui`        | Keep in feature module       |
| :----------------------------- | :--------------------------- |
| Used in **both** web and admin | Single-app one-off           |
| No Nestlancer business terms   | Contains domain labels/rules |
| Stateless / props-only         | Fetches API data             |

---

## Usage patterns

```tsx
import { Button, Card, CardHeader, CardBody, EmptyState } from '@nestlancer/ui';

<Card>
  <CardHeader title="Projects" />
  <CardBody>
    {items.length === 0 ? (
      <EmptyState title="No projects" description="Create a request to get started." />
    ) : (
      ...
    )}
  </CardBody>
</Card>
```

Forms: wrap inputs with `FormField` for label + error text alignment.

---

## Theming

- CSS variables from `@nestlancer/tokens`
- `ThemeProvider` from `@nestlancer/theme` at app root
- Dark mode: class strategy on `<html>` — see admin/web `layout.tsx`

---

## Accessibility

Primitives should ship with focus visible styles, `aria-*` on interactive elements, and keyboard support for modals/menus. When extending, follow existing Radix-based patterns where used.

---

## 📚 Related documentation

- [tokens](./tokens.md), [theme](./theme.md)
- [Web app](../apps/web.md), [Admin app](../apps/admin.md)
- [overview.md § Component Library](../../architecture/overview.md)

---

<div align="center">

**`@nestlancer/ui`** — Nestlancer backend component documentation

</div>
