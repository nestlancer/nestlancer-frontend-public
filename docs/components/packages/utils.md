<div align="center">

# `@nestlancer/utils`

### Pure TypeScript utilities — **no React**, safe in Server Components and client code.

</div>

---

## 📖 Table of Contents

- [Package info](#package-info)
- [Modules](#modules)
- [Money (critical)](#money-critical)
- [Related](#related)

---

## Package info

|            |                                                                     |
| :--------- | :------------------------------------------------------------------ |
| **Path**   | `packages/utils/src/`                                               |
| **Import** | `import { formatCurrencyPaise, slugify } from '@nestlancer/utils';` |

---

## Modules

| Module              | Purpose                               |
| :------------------ | :------------------------------------ |
| `format.ts`         | INR from paise, dates, file sizes     |
| `string.ts`         | slugify, truncate, capitalize         |
| `number.ts`         | clamp, round, percent                 |
| `array.ts`          | uniqueBy, groupBy                     |
| `session-client.ts` | Client session helpers                |
| `sensitive-url.ts`  | Strip tokens from URLs before logging |

---

## Money (critical)

Backend amounts are **integers in paise**. Use format helpers; never treat API numbers as rupee floats without conversion.

---

## Related

- [Backend API standards](../../../../nestlancer-backend-api/docs/api/standards.md) (sibling repo)
- [Modification playbook](../../guides/modification-playbook.md)

---

<div align="center">

**`@nestlancer/utils`** — Nestlancer backend component documentation

</div>
