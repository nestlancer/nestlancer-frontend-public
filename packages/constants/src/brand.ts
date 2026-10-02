/**
 * Canonical product positioning for Nestlancer.
 * Single studio + client portal — not a freelancer marketplace.
 */

/** Official social / profile URLs — only set verified Nestlancer profiles. */
const SOCIAL_PROFILES = {
  linkedin: '',
  twitter: '',
  github: '',
  instagram: '',
} as const;

export const BRAND = {
  name: 'Nestlancer',
  legalName: 'Nestlancer',
  tagline: 'Your dedicated studio — from brief to delivery',
  shortDescription:
    'Nestlancer is a dedicated product studio. Clients submit a brief, receive a milestone quote, pay on schedule, and track delivery in one workspace.',
  longDescription:
    'Work with the Nestlancer studio for web, mobile, and product design. Request a project, get a clear milestone-based quote, pay securely with Razorpay on a deposit and installment schedule, and collaborate through delivery — all in one place.',
  /** Footer / compact blurb */
  footerBlurb:
    'Milestone quotes, scheduled payments, and realtime collaboration with a dedicated studio.',
  /** Hero eyebrow */
  heroEyebrow: 'Dedicated product studio',
  /** Default OG / Twitter image paths (relative to each app public/) */
  ogImagePath: '/images/social/og-image.png',
  twitterImagePath: '/images/social/twitter-image.png',
  locale: 'en_IN',
  socialProfiles: SOCIAL_PROFILES,
  /** Schema.org sameAs — non-empty official profile URLs only */
  sameAs: Object.values(SOCIAL_PROFILES).filter((url) => Boolean(url.trim())),
  /** ISO regions + Worldwide for ProfessionalService.areaServed */
  areaServed: ['IN', 'US', 'GB', 'AE', 'Worldwide'] as const,
  /** Core offerings for ProfessionalService.hasOfferCatalog */
  offerCatalog: [
    {
      name: 'MVP Development',
      description:
        'End-to-end MVP delivery: discovery, design, frontend and backend, QA, and production handoff.',
    },
    {
      name: 'Web Application Development',
      description:
        'Full-stack web products with UI/UX, APIs, QA, deployment, and milestone-based delivery.',
    },
    {
      name: 'Mobile Apps',
      description:
        'Custom mobile product builds scoped after brief with a clear milestone schedule.',
    },
    {
      name: 'UI/UX Design',
      description: 'Product UI/UX, brand systems, and design for core product surfaces.',
    },
  ] as const,
} as const;

/** Primary SEO keywords — studio/agency positioning, no marketplace claims */
export const BRAND_KEYWORDS = [
  'Nestlancer',
  'product studio',
  'software development studio',
  'web development India',
  'mobile app development',
  'UI UX design studio',
  'project quote',
  'milestone payments',
  'Razorpay',
  'custom software development',
  'MVP development',
  'client project portal',
] as const;

export const BRAND_PROCESS_STEPS = [
  {
    step: '01',
    title: 'Submit a request',
    description:
      'Describe your goals, scope, and timeline. The studio reviews your brief and prepares a tailored proposal.',
  },
  {
    step: '02',
    title: 'Receive your quote',
    description:
      'Get a milestone-based quote with clear scope, pricing, and a deposit / mid / final payment schedule.',
  },
  {
    step: '03',
    title: 'Pay and ship together',
    description:
      'Pay milestones securely via Razorpay, approve deliverables as you go, and track progress in real time until handoff.',
  },
] as const;
