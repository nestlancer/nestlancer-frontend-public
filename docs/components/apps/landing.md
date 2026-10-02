<div align="center">

# Landing application (`apps/landing`)

### Marketing site: positioning, pricing, about, contact, and lightweight blog teasers. Mostly **static/SSG** pages with minimal authenticated surface.

</div>

---

## 📖 Table of Contents

- [👁 At a glance](#at-a-glance)
- [Routes](#routes)
- [Commands](#commands)
- [📚 Related documentation](#related-documentation)

---

## 👁 At a glance

|               |                                  |
| :------------ | :------------------------------- |
| **Package**   | `@nestlancer/landing`            |
| **Dev port**  | 9020                             |
| **Shared UI** | `@nestlancer/marketing` sections |

---

## Routes

- `/`
- `/about`
- `/blog`
- `/blog/[slug]`
- `/contact`
- `/pricing`

---

## Commands

```bash
pnpm --filter @nestlancer/landing dev
```

Not in default `docker-compose.dev.yml`; expose port 9020 for Nginx — [nginx guide](../../guides/nginx.md).

---

## 📚 Related documentation

- [Wireframes — public](../../architecture/diagrams/wireframes/public/)

---

<div align="center">

**Landing application (`apps/landing`)** — Nestlancer backend component documentation

</div>
