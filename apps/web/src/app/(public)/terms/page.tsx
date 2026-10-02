import type { Metadata } from 'next';
import Link from 'next/link';

import { landingUrl } from '@nestlancer/constants';
import { FigLabel } from '@nestlancer/ui';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Service',
  description:
    'Terms of Service for Nestlancer — client accounts, studio obligations, milestone payments, and intellectual property.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12">
      <a href={landingUrl('/')} className="text-sm text-muted-foreground hover:text-foreground">
        ← Home
      </a>
      <div className="mt-6">
        <FigLabel>FIG · Legal</FigLabel>
        <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">Last updated · August 2026</p>
      </div>

      <div className="prose mt-8 max-w-none dark:prose-invert">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Nestlancer (&ldquo;the Platform&rdquo;), you agree to be bound by
          these Terms of Service and all applicable laws and regulations. If you do not agree with
          any of these terms, you are prohibited from using or accessing this site.
        </p>

        <h2>2. Use Licence</h2>
        <p>
          Permission is granted to temporarily access the Platform for personal, non-commercial
          transitory viewing only. This is the grant of a licence, not a transfer of title, and
          under this licence you may not:
        </p>
        <ul>
          <li>modify or copy the materials;</li>
          <li>use the materials for any commercial purpose;</li>
          <li>attempt to decompile or reverse engineer any software contained on the Platform;</li>
          <li>remove any copyright or other proprietary notations from the materials; or</li>
          <li>
            transfer the materials to another person or &ldquo;mirror&rdquo; the materials on any
            other server.
          </li>
        </ul>

        <h2>3. Accounts</h2>
        <p>
          When you create an account you must provide accurate, complete, and current information.
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activities that occur under your account. Client accounts (USER) use the
          Nestlancer client portal. Administrator accounts use the operator console.
        </p>

        <h2>4. Client and Studio Obligations</h2>
        <p>
          Clients agree to provide accurate project briefs and to complete milestone payments
          promptly according to the agreed schedule. The Nestlancer studio agrees to complete work
          to the agreed specifications and within the agreed timeline.
        </p>

        <h2>5. Payments and Milestones</h2>
        <p>
          Nestlancer bills clients for studio work according to a milestone payment schedule
          (typically deposit, mid, and final installments) defined in each quote. Online payments
          are processed through Razorpay. Manual or offline payments may be recorded by the studio
          administrator. Disputes and refunds are handled through our resolution process as
          documented in your quote or project agreement. Amounts paid for completed milestones are
          generally non-refundable except where required by law or expressly agreed in writing.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          Upon full payment, all deliverables created for a client project become the property of
          the client unless otherwise agreed in writing. Nestlancer retains no rights to project
          deliverables except as needed to operate the Platform or as agreed for portfolio showcase
          with client consent.
        </p>

        <h2>7. Prohibited Conduct</h2>
        <p>You must not:</p>
        <ul>
          <li>use the Platform to engage in fraud or deception;</li>
          <li>circumvent the Platform to avoid fees;</li>
          <li>harass, abuse, or harm other users;</li>
          <li>violate any applicable laws or regulations.</li>
        </ul>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Nestlancer shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages resulting from your use of or
          inability to use the Platform.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These terms shall be governed by and construed in accordance with applicable law. Any
          disputes shall be subject to the exclusive jurisdiction of the competent courts.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          Nestlancer reserves the right to modify these terms at any time. We will notify users of
          material changes via email or a prominent notice on the Platform.
        </p>

        <h2>Contact</h2>
        <p>
          For any questions regarding these Terms, please contact us via the{' '}
          <Link href="/contact">contact page</Link>.
        </p>
      </div>
    </section>
  );
}
