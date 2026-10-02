'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NestlancerLogo } from '@nestlancer/ui';
import { Activity, Shield, Terminal, Cpu } from '@nestlancer/ui/icons';

import { OperatorBackdrop } from '@/components/auth/OperatorBackdrop';
import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle';

import '@/styles/operator-portal.css';

export function AdminGateHome() {
  const [uptime, setUptime] = useState('99.97%');
  const [syncAge, setSyncAge] = useState('12s');

  useEffect(() => {
    let up = 99.97;
    let secs = 12;
    const upTimer = window.setInterval(() => {
      up = Math.min(100, Math.max(99.9, up + (Math.random() - 0.5) * 0.03));
      setUptime(`${up.toFixed(2)}%`);
    }, 4000);
    const syncTimer = window.setInterval(() => {
      secs += 1;
      setSyncAge(secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m`);
    }, 1000);
    return () => {
      window.clearInterval(upTimer);
      window.clearInterval(syncTimer);
    };
  }, []);

  return (
    <div className="op-portal">
      <OperatorBackdrop variant="gate" />
      <div className="op-theme-slot">
        <AdminThemeToggle className="op-theme-toggle" />
      </div>

      <div className="op-banner">
        <span>
          <strong>OPS</strong> · Operator gate · not client portal UI
        </span>
        <span>
          operator console · <Link href="/login">open auth →</Link>
        </span>
      </div>

      <header className="op-topbar">
        <div className="op-brand">
          <div className="op-mark" aria-hidden="true">
            <NestlancerLogo variant="icon" theme="auto" size="sm" />
          </div>
          <div>
            <h1>Nestlancer Admin</h1>
            <p>Internal operator console</p>
          </div>
        </div>
        <div className="op-status-chip">
          <span className="op-pulse" aria-hidden="true" />
          Systems operational
        </div>
      </header>

      <main className="op-main">
        <section className="op-hero-card">
          <div className="op-kicker">
            <Shield className="h-3 w-3" aria-hidden />
            Restricted access · clearance required
          </div>
          <h2>
            Operator control center
            <span className="op-caret" aria-hidden />
          </h2>
          <p className="op-lede">
            Authenticate to manage pipelines, moderation, payments, and platform health. Sessions
            are audited. Client accounts are rejected at this boundary.
          </p>

          <div className="op-clearance">
            <div className="op-metric">
              <span>Clearance</span>
              <strong className="op-glow">L3 · Ops</strong>
            </div>
            <div className="op-metric">
              <span>MFA</span>
              <strong>Required</strong>
            </div>
            <div className="op-metric">
              <span>Audit</span>
              <strong>Full trail</strong>
            </div>
          </div>

          <div className="op-modules">
            <div className="op-mod">
              <div className="op-mod-icon" aria-hidden="true">
                <Terminal className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3>Console &amp; telemetry</h3>
                <p>Service health, capacity, and database operations.</p>
              </div>
              <span className="op-tag">ONLINE</span>
            </div>
            <div className="op-mod">
              <div className="op-mod-icon" aria-hidden="true">
                <Cpu className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3>Services &amp; queues</h3>
                <p>Moderation, payments, disputes, and activity logs.</p>
              </div>
              <span className="op-tag">ONLINE</span>
            </div>
          </div>

          <div className="op-actions">
            <Link className="op-btn op-btn-primary" href="/login">
              Authenticate to console
              <Activity className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <a className="op-btn op-btn-ghost" href="#ops">
              Inspect system board
            </a>
          </div>
          <p className="op-audit">
            Unauthorized access attempts are logged with IP, user-agent, and timestamp.{' '}
            <span className="op-flash">Privileged actions require an active operator role.</span>
          </p>
        </section>

        <aside className="op-ops-card" id="ops" aria-label="Operations preview">
          <div className="op-ops-head">
            <span>ops-board · preview</span>
            <span>
              uptime <em>{uptime}</em>
            </span>
          </div>
          <div className="op-ops-body">
            <nav className="op-sidebar" aria-hidden="true">
              <div className="op-nav-sec">Operations</div>
              <div className="op-nav-item active">Dashboard</div>
              <div className="op-nav-item">Pipeline</div>
              <div className="op-nav-item">Payments</div>
              <div className="op-nav-sec">System</div>
              <div className="op-nav-item">Moderation</div>
              <div className="op-nav-item">Audit log</div>
              <div className="op-nav-item">Integrations</div>
            </nav>
            <div className="op-workspace">
              <div className="op-row">
                <h3>Platform health</h3>
                <span>
                  last sync <em>{syncAge}</em> ago
                </span>
              </div>
              <div className="op-health">
                <div className="op-hcell op-hcell--api">
                  <span>API</span>
                  <strong>98.7%</strong>
                  <em>healthy</em>
                </div>
                <div className="op-hcell op-hcell--queues">
                  <span>Queues</span>
                  <strong>14</strong>
                  <em>draining</em>
                </div>
                <div className="op-hcell op-hcell--payments">
                  <span>Payments</span>
                  <strong>₹4.2L</strong>
                  <em>collected</em>
                </div>
                <div className="op-hcell op-hcell--disputes">
                  <span>Disputes</span>
                  <strong>3</strong>
                  <em>open</em>
                </div>
              </div>
              <div className="op-log">
                <div className="op-log-head">Recent operator events</div>
                <ul>
                  <li>
                    <time>21:04:12</time>
                    <span>Quote issued · NL-204 / M3</span>
                    <span className="op-badge info">QUOTE</span>
                  </li>
                  <li>
                    <time>20:58:41</time>
                    <span>Deposit cleared · Razorpay</span>
                    <span className="op-badge ok">PAY</span>
                  </li>
                  <li>
                    <time>20:51:03</time>
                    <span>Dispute flagged · payout hold</span>
                    <span className="op-badge warn">RISK</span>
                  </li>
                  <li>
                    <time>20:44:27</time>
                    <span>Deploy · pipeline v42</span>
                    <span className="op-badge info">CFG</span>
                  </li>
                </ul>
              </div>
              <div className="op-checks">
                <div className="op-check">
                  <i /> TLS edge · cert valid <span className="op-spark">✓</span>
                </div>
                <div className="op-check">
                  <i /> CSP nonce · enforced <span className="op-spark">✓</span>
                </div>
                <div className="op-check">
                  <i /> MFA required · sessions audited <span className="op-spark">✓</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
