<div align="center">

# Documentation maintenance

</div>

---

## 📖 Table of Contents

- [Canonical index](#canonical-index)
- [Regenerate](#regenerate)
- [Sibling backend repo](#sibling-backend-repo)
- [Moved paths (do not use)](#moved-paths-do-not-use)
- [Related](#related)

---

## Canonical index

[docs/README.md](./README.md)

---

## Regenerate

```bash
node scripts/generate-frontend-docs.mjs   # apps (not hooks/utils/ui/validators/config/constants)
node scripts/generate-changelog.mjs
```

Manually maintained: `docs/components/packages/hooks.md`, `utils.md`, `validators.md`, `config.md`, `constants.md`, `ui.md`.

---

## Sibling backend repo

Links use `../../../../nestlancer-backend-api/...` from `docs/components/apps/` and `docs/components/packages/`.

Required layout:

```
workspace/
├── nestlancer-backend-api/
└── nestlancer-frontend/
```

From `docs/guides/`, use `../../../nestlancer-backend-api/...` (three levels up to workspace).

---

## Moved paths (do not use)

| Old                                       | New                                               |
| :---------------------------------------- | :------------------------------------------------ |
| `Nginx.md` (root)                         | `docs/guides/nginx.md`                            |
| `docs/payments/RAZORPAY-TEST-PAYMENTS.md` | `docs/guides/razorpay-test-payments.md`           |
| `docs/MASTER-IMPLEMENTATION-TRACKER.md`   | `docs/archive/implementation/`                    |
| `packages/constants/TELEMETRY.md`         | `docs/components/packages/constants-telemetry.md` |

---

## Related

- [Backend DOCUMENTATION.md](../../nestlancer-backend-api/docs/DOCUMENTATION.md) (sibling repo)
