import type { FieldHelpContent } from './types';

/** Per-key help for dynamic system config rows (admin System page). */
export const SYSTEM_CONFIG_HELP: Record<string, FieldHelpContent> = {
  'site.name': {
    what: 'Public site name shown in emails and headers.',
    enter: 'Plain text string.',
    example: 'Nestlancer',
    visibility: 'admin',
    assumed: true,
  },
  'site.supportEmail': {
    what: 'Support inbox for client-facing messages.',
    enter: 'Valid email address.',
    example: 'support@nestlancer.com',
    visibility: 'admin',
    assumed: true,
  },
  'payments.defaultCurrency': {
    what: 'Default ISO currency for new quotes and payments.',
    enter: '3-letter code.',
    example: 'INR',
    visibility: 'admin',
    assumed: true,
  },
};
