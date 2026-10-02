/**
 * Shared user-facing copy for the split **client portal** (web) vs **operator console** (admin).
 * Use these strings for toasts and page hints so messaging stays consistent.
 */
export const AUTH_PORTAL_COPY = {
  web: {
    loginPageSubtitle:
      'For clients only. Administrator and operator accounts must use the operator console — not this page.',
    loginFooterLead: 'Staff or platform operator?',
    loginFooterLinkLabel: 'Operator sign-in',
    loginFooterMissingUrl:
      'Set NEXT_PUBLIC_ADMIN_APP_URL in the environment so the operator sign-in link appears.',
    loginFooterTrail: 'Administrator accounts cannot finish signing in here.',
    /** Toast after credentials verify as ADMIN on the client login */
    adminWrongPortalToastTitle: 'This account uses operator sign-in',
    adminWrongPortalToastDescription:
      'You signed in with an administrator account. Open the operator console and use the same email and password there.',
    adminWrongPortalActionLabel: 'Open operator sign-in',
    adminWrongPortalMissingUrlDescription:
      'NEXT_PUBLIC_ADMIN_APP_URL is not configured, so we cannot open the operator console for you. Ask your team to set it in the web app environment.',
    clientSignedInSuccess: 'Signed in',
    rateLimitMessage: (minutes: number) =>
      `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
  },
  admin: {
    loginPageSubtitle:
      'For Nestlancer administrators and internal operators only. Client accounts use the main app.',
    loginFooterLead: 'Client account?',
    loginFooterLinkLabel: 'Client sign-in',
    loginFooterMissingUrl:
      'Set NEXT_PUBLIC_APP_URL in the environment so the client sign-in link appears.',
    /** Toast after credentials verify as non-admin on the operator login */
    clientWrongPortalToastTitle: 'This account uses client sign-in',
    clientWrongPortalToastDescription:
      'You signed in with a client account. Open the main Nestlancer app and use the same email and password there.',
    clientWrongPortalActionLabel: 'Open client sign-in',
    clientWrongPortalMissingUrlDescription:
      'NEXT_PUBLIC_APP_URL is not configured, so we cannot open the client portal for you. Ask your team to set it in the admin app environment.',
    operatorSignedInSuccess: 'Signed in to the operator console',
    rateLimitMessage: (minutes: number) =>
      `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
  },
  webRegister: {
    footerNote:
      'Administrator and operator accounts are issued by your team — this form is only for new client accounts.',
  },
} as const;
