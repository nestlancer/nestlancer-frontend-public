'use client';

import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { NestlancerLogo } from '@nestlancer/ui';
import { Shield } from '@nestlancer/ui/icons';
import { AUTH_PORTAL_COPY, getWebAppUrl } from '@nestlancer/constants';

import { OperatorBackdrop } from '@/components/auth/OperatorBackdrop';
import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle';

import '@/styles/operator-portal.css';

function LoginFallback() {
  return (
    <div className="h-10 w-full animate-pulse rounded-md bg-[var(--op-panel-2)]" aria-hidden />
  );
}

export function AdminLoginShell({ children }: { children: ReactNode }) {
  return (
    <div className="op-portal op-login">
      <a href="#main-content" className="skip-link">
        Skip to sign-in
      </a>
      <OperatorBackdrop variant="login" />

      <header className="op-banner">
        <span>
          <strong>OPS</strong> · Operator auth · zero-trust posture
        </span>
        <span className="op-banner-actions">
          <Link href="/">← gate</Link> · clients use app.nestlancer.com{' '}
          <span className="op-blink" aria-hidden>
            ●
          </span>
          <AdminThemeToggle className="op-theme-toggle" />
        </span>
      </header>

      <main className="op-shell">
        <aside className="op-policy" aria-label="Access policy">
          <div className="op-brand">
            <div className="op-mark" aria-hidden="true">
              <NestlancerLogo variant="icon" theme="auto" size="sm" />
            </div>
            <div>
              <h1>Nestlancer Admin</h1>
              <p>Operator identity boundary</p>
            </div>
          </div>

          <div>
            <h2>
              Verify <span className="op-glow-word">identity</span> before console access
            </h2>
            <p className="op-lede">
              Built for internal operators — dense, auditable, and deliberately unfriendly to public
              portal branding. Credentials alone are not enough when MFA is challenged.
            </p>
          </div>

          <div className="op-env-grid">
            <div className="op-env">
              <span>Access</span>
              <strong className="op-live">Operators only</strong>
            </div>
            <div className="op-env">
              <span>Portal</span>
              <strong>Admin console</strong>
            </div>
            <div className="op-env">
              <span>Session TTL</span>
              <strong>8h / 30d</strong>
            </div>
            <div className="op-env">
              <span>Role gate</span>
              <strong>ADMIN only</strong>
            </div>
          </div>

          <div className="op-zt">
            <div className="op-zt-head">
              <span>pre-auth posture</span>
              <span>
                <em>2</em> / 3 ready
              </span>
            </div>
            <ol>
              <li>
                <span className="op-dot" aria-hidden="true" />
                <div>
                  <h3>Transport security</h3>
                  <p>HTTPS + HSTS on admin host. Mixed content blocked.</p>
                </div>
                <span className="op-state">PASS</span>
              </li>
              <li>
                <span className="op-dot" aria-hidden="true" />
                <div>
                  <h3>Network policy</h3>
                  <p>CSP nonce active. Admin cookies scoped HttpOnly / SameSite.</p>
                </div>
                <span className="op-state">PASS</span>
              </li>
              <li>
                <span className="op-dot pending" aria-hidden="true" />
                <div>
                  <h3>Operator identity</h3>
                  <p>Email + password, then TOTP challenge when enrolled.</p>
                </div>
                <span className="op-state wait">PENDING</span>
              </li>
            </ol>
          </div>

          <p className="op-rules">
            Client accounts cannot finish sign-in here.{' '}
            <span className="op-flash">
              Failed attempts are rate-limited and written to the audit log with IP and user-agent.
            </span>
          </p>
        </aside>

        <section id="main-content" className="op-auth">
          <div className="op-auth-card">
            <div className="op-eyebrow">
              <Shield className="h-2.5 w-2.5" aria-hidden />
              Internal only
            </div>
            <h2>Operator sign-in</h2>
            <p className="op-sub">{AUTH_PORTAL_COPY.admin.loginPageSubtitle}</p>

            <Suspense fallback={<LoginFallback />}>{children}</Suspense>

            <div className="op-meta">
              <span>host · admin.nestlancer.com</span>
              <span>
                policy · ADMIN role · MFA when enrolled · audited session{' '}
                <span className="op-cursor" aria-hidden />
              </span>
            </div>
          </div>

          <p className="op-back">
            <Link href="/">← Back to operator gate</Link>
          </p>
        </section>
      </main>
      <footer className="op-login-legal">
        <a href={`${getWebAppUrl() || 'https://app.nestlancer.com'}/terms`}>Terms</a>
        {' · '}
        <a href={`${getWebAppUrl() || 'https://app.nestlancer.com'}/privacy`}>Privacy</a>
      </footer>
    </div>
  );
}
