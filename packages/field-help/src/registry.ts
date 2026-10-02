import type { FieldHelpContent, FieldHelpKey } from './types';
import { SYSTEM_CONFIG_HELP } from './system-config-help';

/**
 * Central field help registry keyed as `domain.fieldName`.
 * Primary source: nestlancer-backend-api DTO @ApiProperty descriptions.
 */
export const FIELD_HELP_REGISTRY: Record<FieldHelpKey, FieldHelpContent> = {
  // —— Auth ——
  'auth.email': {
    what: 'Email address used to sign in.',
    enter: 'Valid email. Trimmed before submit.',
    example: 'operator@company.com',
    visibility: 'both',
  },
  'auth.password': {
    what: 'Account password for this session.',
    enter: 'Your current password. Not stored in the browser beyond this session.',
    visibility: 'both',
  },
  'auth.rememberMe': {
    what: 'Keeps you signed in on this device longer.',
    enter: 'Optional checkbox. Uses a longer-lived refresh token when enabled.',
    visibility: 'both',
    assumed: true,
  },
  'auth.firstName': {
    what: 'Your given name on the account.',
    enter: '2–50 characters. Letters and spaces.',
    example: 'John',
    visibility: 'both',
  },
  'auth.lastName': {
    what: 'Your family name on the account.',
    enter: '2–50 characters.',
    example: 'Doe',
    visibility: 'both',
  },
  'auth.registerPassword': {
    what: 'Password for your new account.',
    enter: '8–64 characters with uppercase, lowercase, and a number or special character.',
    visibility: 'client',
  },
  'auth.confirmPassword': {
    what: 'Re-enter your password to avoid typos.',
    enter: 'Must exactly match the password field.',
    visibility: 'client',
    assumed: true,
  },
  'auth.acceptTerms': {
    what: 'Confirms you agree to platform terms.',
    enter: 'Required boolean `true` to register.',
    visibility: 'client',
  },
  'auth.marketingConsent': {
    what: 'Optional consent for product emails.',
    enter: 'Boolean. Defaults to false if omitted.',
    visibility: 'client',
  },
  'auth.twoFactorCode': {
    what: 'One-time code from your authenticator app.',
    enter: 'Typically 6 digits. Expires quickly after issue.',
    example: '123456',
    visibility: 'both',
    assumed: true,
  },
  'auth.resetToken': {
    what: 'Password-reset token from your email link.',
    enter: 'Set automatically from the URL. Do not edit.',
    visibility: 'client',
    assumed: true,
  },

  // —— Requests ——
  'requests.title': {
    what: 'Short name for your project request.',
    enter: '5–100 characters. Shown in lists and quotes.',
    example: 'Build a Custom CRM for Real Estate',
    visibility: 'both',
  },
  'requests.description': {
    what: 'Full scope and context for operators quoting the work.',
    enter: '20–5,000 characters. Plain language; attachments can supplement.',
    example: 'We need a CRM to manage leads, automated emails, and agent performance…',
    visibility: 'both',
  },
  'requests.category': {
    what: 'Primary service type for routing and quote presets.',
    enter:
      'Enum: webDevelopment, mobileApp, ecommerce, design, branding, marketing, seo, consulting, maintenance, custom.',
    example: 'webDevelopment',
    visibility: 'both',
  },
  'requests.budgetMin': {
    what: 'Low end of your estimated budget.',
    enter: 'Number ≥ 0 in rupees (e.g. 5000 for ₹5,000). Stored as paise in the API.',
    example: '5000',
    visibility: 'client',
  },
  'requests.budgetMax': {
    what: 'High end of your estimated budget.',
    enter: 'Number ≥ min. Major currency units.',
    example: '15000',
    visibility: 'client',
  },
  'requests.budgetCurrency': {
    what: 'ISO 4217 currency for budget figures.',
    enter: 'Exactly 3 letters, uppercase.',
    example: 'INR',
    visibility: 'client',
  },
  'requests.budgetFlexible': {
    what: 'Whether operators can propose outside this range.',
    enter: 'Boolean. True = open to negotiation.',
    visibility: 'client',
  },
  'requests.preferredStartDate': {
    what: 'When you would like work to begin.',
    enter: 'Date (YYYY-MM-DD). Sent to API as ISO 8601 midnight UTC.',
    example: '2024-12-01',
    visibility: 'client',
  },
  'requests.deadline': {
    what: 'Target completion date.',
    enter: 'Date after preferred start. ISO 8601 when submitted.',
    example: '2025-05-01',
    visibility: 'client',
  },
  'requests.requirements': {
    what: 'Bullet list of must-have features or outcomes.',
    enter: 'Up to 20 strings; at least one required. One per line in this form.',
    example: 'User authentication\nDashboard analytics',
    visibility: 'client',
  },
  'requests.assigneeId': {
    what: 'Internal user ID of the operator owning this request.',
    enter: 'UUID of an admin/operator user.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    visibility: 'admin',
  },
  'requests.internalNote': {
    what: 'Private note for your team only.',
    enter: 'Free text. Not shown to the client.',
    visibility: 'admin',
    assumed: true,
  },
  'requests.status': {
    what: 'Workflow state of the request.',
    enter:
      'Enum: draft, submitted, underReview, quoted, accepted, rejected, convertedToProject, changesRequested.',
    example: 'underReview',
    visibility: 'admin',
  },
  'requests.attachments': {
    what: 'Supporting files for the request.',
    enter: 'Up to 10 media UUIDs from your library. Upload first, then attach.',
    visibility: 'client',
  },

  // —— Quotes ——
  'quotes.lineItemDescription': {
    what: 'What the client is paying for on this line.',
    enter: 'Non-empty string. Shown on the client quote PDF/view.',
    example: 'Frontend UI Implementation - Dashboard',
    visibility: 'both',
  },
  'quotes.lineItemQuantity': {
    what: 'Count of units (hours, licenses, phases).',
    enter: 'Number ≥ 0. Line total = quantity × unit price.',
    example: '1',
    visibility: 'both',
  },
  'quotes.lineItemUnitPrice': {
    what: 'Price per unit in major currency (not paise).',
    enter: 'Number ≥ 0. Same units as quote totals (e.g. ₹2,500 not 250000 paise).',
    example: '2500',
    visibility: 'both',
  },
  'quotes.currency': {
    what: 'Currency for all line items and totals.',
    enter: 'ISO 4217, max 3 characters. Must match how you priced lines.',
    example: 'INR',
    visibility: 'both',
  },
  'quotes.taxPercentage': {
    what: 'Tax rate applied to the subtotal.',
    enter: 'Percent 0–100 (e.g. 18 for 18% GST). Use 0 if tax is included in unit prices.',
    example: '18',
    visibility: 'both',
  },
  'quotes.validUntil': {
    what: 'Last day the client can accept this quote.',
    enter: 'Date (YYYY-MM-DD). Stored as ISO end-of-day UTC.',
    example: '2025-01-15',
    visibility: 'both',
  },
  'quotes.terms': {
    what: 'Nestlancer standard terms applied to every quote (snapshotted at creation).',
    enter: 'Read-only in the admin UI. Shown to the client alongside project-specific terms.',
    example: 'Validity, payment, scope, IP, and liability clauses.',
    visibility: 'both',
  },
  'quotes.termsAndConditions': {
    what: 'Additional project-specific terms shown on top of the standard Nestlancer terms.',
    enter:
      'Optional, max 2000 characters. Use for timeline, scope boundaries, or custom payment notes.',
    example: '30% deposit on acceptance. Client provides brand assets within 5 business days.',
    visibility: 'both',
  },
  'quotes.requiresContract': {
    what: 'Whether the client must sign the Nestlancer service agreement when accepting the quote.',
    enter:
      'Enabled by default. Client reviews the draft agreement and signs electronically on accept.',
    example: 'true',
    visibility: 'admin',
  },
  'quotes.internalNotes': {
    what: 'Internal notes for operators only.',
    enter: 'Optional, max 1000 characters. Never shown to the client.',
    example: 'Margin approved by lead. Rush delivery possible.',
    visibility: 'admin',
  },
  'quotes.signatureName': {
    what: 'Your legal name when accepting the quote electronically.',
    enter: 'Required, max 100 characters.',
    example: 'Jane Smith',
    visibility: 'client',
  },
  'quotes.changesArea': {
    what: 'Which part of the quote you want revised.',
    enter: 'Enum: budget, timeline, features, terms (maps to ChangeItemDto.area).',
    example: 'budget',
    visibility: 'client',
  },
  'quotes.changesMessage': {
    what: 'Details of requested quote changes.',
    enter: 'Max 500 characters per change item; describe what to adjust.',
    example: 'Reduce total by 10% by deferring logo design to phase 2.',
    visibility: 'client',
  },
  'quotes.declineReason': {
    what: 'Primary reason for declining.',
    enter: 'Enum: budgetConstraints, timelineIssues, scopeDiscrepancy, other.',
    example: 'budgetConstraints',
    visibility: 'client',
  },
  'quotes.declineFeedback': {
    what: 'Optional qualitative feedback when declining.',
    enter: 'Max 1000 characters.',
    example: 'Budget exceeds our quarterly allocation.',
    visibility: 'client',
  },
  'quotes.declineRevision': {
    what: 'Whether to keep negotiation open for a revised quote.',
    enter: 'Boolean requestRevision — true asks operators to send an updated quote.',
    visibility: 'client',
  },

  // —— Projects / milestones ——
  'projects.status': {
    what: 'Lifecycle state of the project.',
    enter: 'Values like CREATED, IN_PROGRESS, REVIEW, COMPLETED. Client may be notified on change.',
    visibility: 'admin',
    assumed: true,
  },
  'projects.statusReason': {
    what: 'Audit reason for a status change.',
    enter: 'Short text stored with the update. Client may see generic notifications.',
    visibility: 'admin',
    assumed: true,
  },
  'projects.milestoneName': {
    what: 'Title of this delivery phase.',
    enter: 'Max 200 characters.',
    example: 'Frontend MVP Development',
    visibility: 'admin',
  },
  'projects.milestoneStartDate': {
    what: 'Expected start of the milestone.',
    enter: 'ISO date string (YYYY-MM-DD).',
    example: '2024-02-01',
    visibility: 'admin',
  },
  'projects.milestoneEndDate': {
    what: 'Expected end / due date.',
    enter: 'ISO date string. Used as dueDate if not set separately.',
    example: '2024-02-15',
    visibility: 'admin',
  },
  'projects.milestoneAmount': {
    what: 'Optional payment tied to this milestone.',
    enter:
      'Enter amount in rupees (major units). UI converts to paise (×100) for the API. Payment intents use smallest currency unit.',
    example: '5000',
    visibility: 'admin',
  },
  'projects.deliverableMediaIds': {
    what: 'Uploaded files attached to a deliverable.',
    enter: 'Comma-separated media UUIDs from the media library.',
    example: '550e8400-e29b-41d4-a716-446655440001',
    visibility: 'admin',
    assumed: true,
  },
  'projects.deliverableDescription': {
    what: 'Optional caption for the deliverable upload.',
    enter: 'Short text visible to the client with the files.',
    visibility: 'admin',
    assumed: true,
  },
  'projects.progressTitle': {
    what: 'Headline for a progress update.',
    enter: 'Short title visible to the client.',
    visibility: 'admin',
    assumed: true,
  },
  'projects.progressDescription': {
    what: 'Details of work completed.',
    enter: 'Visible to the client on the project timeline.',
    visibility: 'admin',
    assumed: true,
  },
  'projects.revisionNotes': {
    what: 'What to change on a deliverable or milestone.',
    enter: 'Sent when requesting a revision.',
    visibility: 'both',
    assumed: true,
  },
  'projects.rejectionReason': {
    what: 'Why a deliverable or milestone was rejected.',
    enter: 'Required for rejection flows.',
    visibility: 'both',
    assumed: true,
  },

  // —— Payments ——
  'payments.refundAmount': {
    what: 'Partial refund amount in the same unit as the stored payment.',
    enter:
      'Paise (smallest unit) for INR — must match payment.amount from API. Leave blank for full refund. Cannot exceed amount − amountRefunded.',
    example: '500000',
    visibility: 'admin',
  },
  'payments.intentAmount': {
    what: 'Amount charged for this checkout.',
    enter:
      'Always in paise for INR (₹1 = 100 paise). Razorpay and create-payment-intent use this unit.',
    example: '2250000',
    visibility: 'client',
  },
  'payments.refundReason': {
    what: 'Audit reason for the refund.',
    enter: 'Required text for support and compliance.',
    example: 'Duplicate charge — client confirmed',
    visibility: 'admin',
    assumed: true,
  },
  'payments.disputeReason': {
    what: 'Short summary of the payment issue.',
    enter: 'Required for opening a dispute.',
    visibility: 'client',
    assumed: true,
  },
  'payments.disputeDetails': {
    what: 'Full description of the problem.',
    enter: 'Include dates, amounts, and what you expected.',
    visibility: 'client',
    assumed: true,
  },
  'payments.upiId': {
    what: 'UPI Virtual Payment Address for checkout.',
    enter: 'Format name@bank (e.g. user@paytm). Validated before charge.',
    example: 'name@oksbi',
    visibility: 'client',
    assumed: true,
  },
  'payments.razorpayToken': {
    what: 'Saved payment method token from Razorpay.',
    enter: 'Token ID string from Razorpay.js after card/UPI save.',
    visibility: 'client',
    assumed: true,
  },

  // —— Users (admin) ——
  'users.role': {
    what: 'Platform permission role.',
    enter: 'Enum from API (e.g. client, admin). Affects console access.',
    visibility: 'admin',
    assumed: true,
  },
  'users.status': {
    what: 'Whether the account can sign in.',
    enter: 'Active, suspended, etc. per API enum.',
    visibility: 'admin',
    assumed: true,
  },
  'users.newPassword': {
    what: 'Replacement password set by an operator.',
    enter: 'Same rules as registration: 8–64 chars with mixed case and number/symbol.',
    visibility: 'admin',
  },

  // —— Profile / settings ——
  'profile.firstName': {
    what: 'Display first name.',
    enter: '2–50 characters when provided.',
    example: 'John',
    visibility: 'client',
  },
  'profile.lastName': {
    what: 'Display last name.',
    enter: '2–50 characters when provided.',
    example: 'Doe',
    visibility: 'client',
  },
  'profile.phone': {
    what: 'Mobile number for payment checkout.',
    enter: 'Indian mobile (10 digits) or E.164 (+91…). Auto-filled on Razorpay checkout.',
    example: '9876543210',
    visibility: 'client',
  },
  'profile.headline': {
    what: 'Short professional tagline.',
    enter: 'Shown on your profile. Keep concise.',
    visibility: 'client',
    assumed: true,
  },
  'profile.bio': {
    what: 'Longer profile description.',
    enter: 'Plain text or markdown per product rules.',
    visibility: 'client',
    assumed: true,
  },
  'profile.skills': {
    what: 'Skills or technologies you list.',
    enter: 'Comma-separated or multi-value per UI.',
    visibility: 'client',
    assumed: true,
  },
  'settings.currentPassword': {
    what: 'Verifies it is you before a security change.',
    enter: 'Your existing account password.',
    visibility: 'client',
  },
  'settings.newPassword': {
    what: 'New password to use going forward.',
    enter: '8–64 chars with uppercase, lowercase, and number or symbol.',
    visibility: 'client',
  },
  'settings.deleteAccountPassword': {
    what: 'Confirms account deletion.',
    enter: 'Current password required to delete.',
    visibility: 'client',
    assumed: true,
  },
  'settings.quietHoursFrom': {
    what: 'Do-not-disturb window start.',
    enter: 'Local time HH:MM in your chosen timezone.',
    example: '22:00',
    visibility: 'client',
    assumed: true,
  },
  'settings.quietHoursTo': {
    what: 'Do-not-disturb window end.',
    enter: 'Local time HH:MM.',
    example: '08:00',
    visibility: 'client',
    assumed: true,
  },
  'settings.quietHoursTimezone': {
    what: 'IANA timezone for quiet hours.',
    enter: 'e.g. Asia/Kolkata, America/New_York',
    example: 'Asia/Kolkata',
    visibility: 'client',
    assumed: true,
  },

  // —— Contact ——
  'contact.name': {
    what: 'Your name for the inquiry.',
    enter: 'Max 100 characters.',
    example: 'John Doe',
    visibility: 'both',
  },
  'contact.email': {
    what: 'Email for replies.',
    enter: 'Valid email address.',
    example: 'john.doe@example.com',
    visibility: 'both',
  },
  'contact.message': {
    what: 'Body of your message.',
    enter: '10–5,000 characters.',
    example: 'I would like to discuss a partnership…',
    visibility: 'both',
  },
  'contact.subject': {
    what: 'Topic classification.',
    enter: 'Enum ContactSubject (e.g. general, support, sales).',
    visibility: 'both',
    assumed: true,
  },
  'contact.responseMessage': {
    what: 'Reply sent to the submitter.',
    enter: 'Plain text email body.',
    visibility: 'admin',
    assumed: true,
  },

  // —— Integrations ——
  'integrations.webhookUrl': {
    what: 'HTTPS endpoint that receives event payloads.',
    enter: 'Must be publicly reachable URL. Signing secret recommended.',
    example: 'https://api.example.com/webhooks/nestlancer',
    visibility: 'admin',
    assumed: true,
  },
  'integrations.webhookEvents': {
    what: 'Which events trigger this webhook.',
    enter: 'Comma-separated or multi-select event names from API.',
    visibility: 'admin',
    assumed: true,
  },

  // —— Content ——
  'blog.title': {
    what: 'Post headline.',
    enter: 'Required for publish. Shown in feeds and SEO.',
    visibility: 'admin',
    assumed: true,
  },
  'blog.slug': {
    what: 'URL path segment for the post.',
    enter: 'Lowercase, hyphens. Unique per site.',
    example: 'getting-started-with-nestlancer',
    visibility: 'admin',
    assumed: true,
  },
  'blog.excerpt': {
    what: 'Short summary for cards and meta.',
    enter: 'Plain text, typically 1–2 sentences.',
    visibility: 'admin',
    assumed: true,
  },
  'blog.content': {
    what: 'Main article body.',
    enter: 'Markdown or HTML per editor.',
    visibility: 'admin',
    assumed: true,
  },
  'blog.tags': {
    what: 'Comma-separated tags for filtering and SEO.',
    enter: 'Lowercase words separated by commas.',
    example: 'design, nextjs, tips',
    visibility: 'admin',
    assumed: true,
  },
  'blog.status': {
    what: 'Publication state of the post.',
    enter: 'draft, published, or archived per API enum.',
    visibility: 'admin',
    assumed: true,
  },
  'blog.commentBody': {
    what: 'Text of your blog comment.',
    enter: 'Plain text; follow community guidelines.',
    visibility: 'client',
    assumed: true,
  },

  // —— Progress ——
  'progress.changeReason': {
    what: 'What you want changed on a progress update or deliverable.',
    enter: 'Sent with request-changes payload; include specific revision asks.',
    visibility: 'client',
    assumed: true,
  },

  // —— Messages ——
  'messages.body': {
    what: 'Message text sent in the thread.',
    enter: 'Non-empty string. Visible to thread participants.',
    visibility: 'both',
    assumed: true,
  },
  'messages.groupTitle': {
    what: 'Optional title for a group conversation.',
    enter: 'Short label shown in the inbox.',
    visibility: 'admin',
    assumed: true,
  },
  'messages.memberIds': {
    what: 'Client user IDs to add to the group.',
    enter: 'Comma-separated UUIDs of client accounts.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    visibility: 'admin',
    assumed: true,
  },

  // —— Settings (grouped) ——
  'settings.notificationsEmail': {
    what: 'Email notification preferences for your account.',
    enter: 'Toggles control project updates, payment reminders, marketing, and digest frequency.',
    visibility: 'client',
    assumed: true,
  },
  'settings.notificationsPush': {
    what: 'Push notification preferences.',
    enter: 'Requires a registered push subscription in supported browsers.',
    visibility: 'client',
    assumed: true,
  },
  'settings.privacy': {
    what: 'Who can see profile details.',
    enter: 'Profile visibility plus optional show email / show phone toggles.',
    visibility: 'client',
    assumed: true,
  },

  // —— Filters ——
  'filter.search': {
    what: 'Free-text filter on the current list.',
    enter: 'Matches visible columns (excludes password/secret fields). Case-insensitive.',
    visibility: 'admin',
    assumed: true,
  },
  'filter.status': {
    what: 'Restrict rows by status/state column.',
    enter: 'Choose All or a value present in the loaded data.',
    visibility: 'admin',
    assumed: true,
  },

  // —— Contact status ——
  'contact.status': {
    what: 'Inquiry workflow state.',
    enter: 'Updated when operators triage or resolve messages.',
    visibility: 'admin',
    assumed: true,
  },
};

export function getFieldHelp(key: FieldHelpKey): FieldHelpContent | undefined {
  if (FIELD_HELP_REGISTRY[key]) return FIELD_HELP_REGISTRY[key];
  if (key.startsWith('system.')) {
    const configKey = key.slice('system.'.length);
    return SYSTEM_CONFIG_HELP[configKey];
  }
  return undefined;
}
