# Nestlancer sanitized share package

Generated: 2026-10-09T05:27:44Z

## Source commits (original repos, unmodified)

| Repo | Branch | Commit |
|------|--------|--------|
| nestlancer-frontend | main | b29ea5aeb083606cb49de9cc5f8db3f961d227d2 |

## Never exported (local-only on originals)

- `.env.infisical*`, `.env`, `.env.local`, `.env.test`
- Local Docker/Caddy ACME keys under `.docker/`
- `node_modules/`, build artifacts (`.next/`, `*.tsbuildinfo`), coverage, `.pnpm-store/`
- Git history (`.git`)

## Removed / redacted in this package

- Deleted `docker/caddy/certs/origin.key` + `origin.pem` (if present)
- Deleted `overall-report.md` (if present; live infra passwords)
- Real Infisical/env files are never copied

## Sync note

Public working tree mirrored from nestlancer-frontend@b29ea5ae (chore(api-client): sync generated client for system status and end-impersonation) — content only; separate public git history.
