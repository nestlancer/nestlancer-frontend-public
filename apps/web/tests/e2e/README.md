<div align="center">

# Web E2E tests

</div>

---

## Run

```bash
cd apps/web
pnpm exec playwright install chromium   # first time only
pnpm exec playwright test
```

Playwright starts `pnpm dev` on port **9000** with `NEXT_PUBLIC_API_URL` pointed at the same origin (API proxy enabled).

If a dev server is already running on 9000 **without** those env vars, either stop it and let Playwright start a fresh one, or run:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:9000 NEXT_PUBLIC_API_PROXY=true pnpm dev
PLAYWRIGHT_SKIP_WEBSERVER=true pnpm exec playwright test
```

---

## Mocked suites

- `requests-list.mocked.spec.ts` — empty, error, pagination, status filter, search (`q`) against `/api/v1/*` routes.
- `public-pages.visual.spec.ts` — full-page layout snapshots for `/`, `/blog`, `/portfolio`, `/contact` at 375 / 768 / 1280 px (mocked public APIs).

### Update visual baselines

```bash
cd apps/web
pnpm exec playwright test public-pages.visual.spec.ts --update-snapshots
```
