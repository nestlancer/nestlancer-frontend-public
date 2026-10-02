import type { Metadata } from 'next';
import Link from 'next/link';

import { landingUrl } from '@nestlancer/constants';
import { FigLabel } from '@nestlancer/ui';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description:
    'How Nestlancer collects, uses, and protects personal data for clients using the studio portal.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12">
      <a href={landingUrl('/')} className="text-sm text-muted-foreground hover:text-foreground">
        ← Home
      </a>
      <div className="mt-6">
        <FigLabel>FIG · Legal</FigLabel>
        <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">Last updated · May 2026</p>
      </div>

      <div className="prose mt-8 max-w-none dark:prose-invert">
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you:</p>
        <ul>
          <li>create an account (name, email address, password);</li>
          <li>complete your profile (professional background, portfolio items);</li>
          <li>post a project request or submit a quote;</li>
          <li>communicate through our messaging system;</li>
          <li>make or receive payments.</li>
        </ul>
        <p>
          We also automatically collect certain information when you use the Platform, including log
          data, device information, and cookies.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>provide, maintain, and improve the Platform;</li>
          <li>process transactions and send related information;</li>
          <li>send promotional communications (you may opt out at any time);</li>
          <li>respond to your comments, questions, and requests;</li>
          <li>monitor and analyse usage trends;</li>
          <li>detect, prevent, and address fraud and abuse.</li>
        </ul>

        <h2>3. Sharing of Information</h2>
        <p>We do not sell your personal information. We may share information as follows:</p>
        <ul>
          <li>
            with other users as necessary to facilitate projects (e.g. client and service provider
            profiles);
          </li>
          <li>with service providers who perform services on our behalf;</li>
          <li>in response to legal process or when required by law;</li>
          <li>in connection with a merger, acquisition, or sale of assets.</li>
        </ul>

        <h2>4. Data Retention</h2>
        <p>
          We retain your information for as long as your account is active or as needed to provide
          services, comply with our legal obligations, resolve disputes, and enforce our agreements.
        </p>

        <h2>5. Security</h2>
        <p>
          We take reasonable measures to protect your personal information. However, no security
          system is impenetrable and we cannot guarantee the security of our systems.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>access the personal data we hold about you;</li>
          <li>request correction of inaccurate data;</li>
          <li>request deletion of your data (subject to legal obligations);</li>
          <li>object to or restrict processing of your data;</li>
          <li>data portability.</li>
        </ul>

        <h2>7. Cookies</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our Platform and
          hold certain information. You can instruct your browser to refuse all cookies or to
          indicate when a cookie is being sent.
        </p>

        <h2>8. Children&apos;s Privacy</h2>
        <p>
          The Platform is not directed at children under 16. We do not knowingly collect personal
          information from children.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by
          posting the new policy on this page and updating the &ldquo;last updated&rdquo; date.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us via the{' '}
          <Link href="/contact">contact page</Link>.
        </p>
      </div>
    </section>
  );
}
