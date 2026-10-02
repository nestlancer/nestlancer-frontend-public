<div align="center">

# Frontend troubleshooting

</div>

---

## 📖 Table of Contents

- [API calls fail with CORS](#api-calls-fail-with-cors)
- [Cookies not sent / always logged out](#cookies-not-sent-always-logged-out)
- [`contract:check` fails on push](#contractcheck-fails-on-push)
- [WebSocket never connects](#websocket-never-connects)
- [Razorpay checkout does not open](#razorpay-checkout-does-not-open)
- [Hydration errors](#hydration-errors)
- [No / empty container logs](#no--empty-container-logs)
- [Related](#related)

---

## API calls fail with CORS

**Symptom:** Browser blocks `fetch` to `dev.nestlancer.com` from `localhost`.

**Fix:** Use API proxy — set `NEXT_PUBLIC_API_PROXY=true`, `NEXT_PUBLIC_API_URL` to app origin, `API_UPSTREAM` to gateway. See root `README.md`.

---

## Cookies not sent / always logged out

**Cause:** HttpOnly cookies scoped to another domain.

**Fix:** Align frontend origin with cookie domain, or use proxy. Same-site rules in [nginx.md](./nginx.md).

---

## `contract:check` fails on push

**Cause:** OpenAPI drift — generated client out of date.

**Fix:**

```bash
pnpm pull:openapi
pnpm codegen
git add swagger-docs packages/api-client/src/generated
```

---

## WebSocket never connects

1. Check `NEXT_PUBLIC_WS_URL` and `NEXT_PUBLIC_SOCKET_IO_PATH`.
2. Nginx must pass `Upgrade` headers.
3. Backend `ws-gateway` running on :3001.

---

## Razorpay checkout does not open

See [razorpay-test-payments.md](./razorpay-test-payments.md) — test keys, amount in paise, order created server-side first.

---

## Hydration errors

Usually client-only state in Server Components. Add `'use client'` to components using hooks, `window`, or browser APIs.

---

## No / empty container logs

**Symptom:** Browser works, but `docker logs` / `pnpm docker:prod:logs` show only Next “Ready” text, or you only look at DevTools.

**Fix:**

1. Use **server** logs, not the browser console — see [logging.md](./logging.md).
2. Prod: `pnpm docker:prod:logs -- web` (or `admin` / `landing`).
3. Dev: `pnpm docker:logs:web`.
4. Expect JSON lines with `event` = `app.start`, `http.request`, `http.route`, or `auth.*`.
5. If `app.start` is missing after a rebuild, confirm `experimental.instrumentationHook: true` in the app `next.config.mjs` and that the image was rebuilt.
6. Raise verbosity: Infisical `LOG_LEVEL=debug`, recreate containers (`pnpm docker:prod:up`).

---

## Related

- [logging.md](./logging.md)
- [modification-playbook.md](./modification-playbook.md)
- [Backend troubleshooting](../../../nestlancer-backend-api/docs/guides/troubleshooting.md)

---

<div align="center">

**Frontend troubleshooting** — Nestlancer guide

</div>
