export const featureFlags = {
  enable2FA: true,
  enableRazorpay: true,
  enableBlog: true,
  /** Public blog post interactions: bookmark-only vs full (likes + comments). */
  blogInteractions: 'full' as 'bookmark' | 'full',
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;
