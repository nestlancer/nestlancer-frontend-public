<div align="center">

# `@nestlancer/validators`

### **Zod** schemas shared between apps for form validation.

</div>

---

## 📖 Table of Contents

- [Schemas (`packages/validators/src/`)](#schemas-packagesvalidatorssrc)
- [Usage](#usage)
- [Related](#related)

---

## Schemas (`packages/validators/src/`)

| File                | Covers                               |
| :------------------ | :----------------------------------- |
| `auth.schema.ts`    | Login, register, reset password, 2FA |
| `request.schema.ts` | New service request                  |
| `project.schema.ts` | Project feedback, revisions          |
| `payment.schema.ts` | Checkout-related fields              |
| `profile.schema.ts` | Profile edit, password change        |

---

## Usage

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@nestlancer/validators';

useForm({ resolver: zodResolver(loginSchema) });
```

Keep rules aligned with backend DTOs when APIs change.

---

## Related

- [auth](./auth.md), [api-client](./api-client.md)
- [Modification playbook](../../guides/modification-playbook.md)

---

<div align="center">

**`@nestlancer/validators`** — Nestlancer backend component documentation

</div>
