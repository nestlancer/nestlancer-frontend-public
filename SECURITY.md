# Security Policy

## Reporting a vulnerability

**Use GitHub's private vulnerability reporting** on this repository: **Security** tab →
**Report a vulnerability**. Do not open a public issue for a suspected vulnerability.

Include, if you can:

- A description of the vulnerability and its potential impact
- Steps to reproduce
- Which app (`web` / `admin` / `landing`) or package is affected

## Secrets

Real secrets for every environment are stored in Infisical — see
[`docs/operations/secrets-infisical.md`](docs/operations/secrets-infisical.md). Root
`.env.*.example` files are templates with placeholder values only.

If you find a real credential or token in this repo or its history, treat it as compromised,
report it privately, and rotate it.

## Frontend-specific cautions

- `NEXT_PUBLIC_*` values are embedded in client bundles — never put secrets there
- Auth cookies / JWT handling and portal mismatch rules are security-sensitive — prefer existing
  `@nestlancer/auth` patterns
- Razorpay checkout and payment method UIs must not log card/PAN data
- Do not weaken CSP, cookie flags, or auth middleware without an explicit security review

## Supported versions

This is a deployed application monorepo, not a versioned library. Security fixes land on `main`
and roll out through the normal CI/CD pipeline ([`docs/operations/`](docs/operations/README.md)).
