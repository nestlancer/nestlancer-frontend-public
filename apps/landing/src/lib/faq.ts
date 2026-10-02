/** Shared FAQ copy for marketing UI + FAQPage JSON-LD */

export type FaqItem = {
  question: string;
  answer: string;
};

export const CONTACT_FAQ: readonly FaqItem[] = [
  {
    question: 'Why is the form on the app?',
    answer:
      'The contact form is Turnstile-protected on the app host so spam checks and delivery live in one place. This page hands you off with any selected package already attached.',
  },
  {
    question: 'How fast do you reply?',
    answer: 'We typically reply within one business day, IST.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'No. You can send a message as a guest. Creating an account is only required when you are ready to request a quote or start a project.',
  },
] as const;

export const PRICING_FAQ: readonly FaqItem[] = [
  {
    question: 'Is Nestlancer a subscription product?',
    answer:
      'No. Nestlancer sells studio engagements — transparent packages and custom quotes with milestone payment schedules, not a recurring SaaS subscription for delivery work.',
  },
  {
    question: 'How do milestone payments work?',
    answer:
      'After you submit a request, the studio sends a line-item quote with a deposit / mid / final (or equivalent) schedule. You pay milestones securely via Razorpay and approve deliverables as work ships.',
  },
  {
    question: 'What is included in the Web Application MVP package?',
    answer:
      'Discovery and requirements, UI/UX for core screens, frontend and backend API, QA, deployment and handoff, plus revision rounds as listed on the pricing page.',
  },
  {
    question: 'Can you work with international clients?',
    answer:
      'Yes. Nestlancer serves clients in India and internationally (including the US, UK, UAE, and worldwide remote engagements), with replies typically within one business day IST.',
  },
] as const;
