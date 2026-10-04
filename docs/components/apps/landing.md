# Landing application (`apps/landing`)

Marketing site: positioning, pricing, about, contact, and lightweight blog teasers. Mostly **static/SSG** pages with minimal authenticated surface.

## At a glance

|               |                                  |
| ------------- | -------------------------------- |
| **Package**   | `@nestlancer/landing`            |
| **Dev port**  | 9020                             |
| **Shared UI** | `@nestlancer/marketing` sections |

## Routes

- `/`
- `/about`
- `/blog`
- `/blog/[slug]`
- `/contact`
- `/portfolio`
- `/portfolio/[id]`
- `/pricing`
- `/services`

## Commands

```bash
pnpm --filter @nestlancer/landing dev
```

Not in default `docker-compose.dev.yml`; expose port 9020 for Nginx — [nginx guide](../../guides/nginx.md).

## Related documentation

- [Wireframes — public](../../architecture/diagrams/wireframes/public/)
