export const featureFlags = {
  commandPaletteWeb: 'NEXT_PUBLIC_FEATURE_COMMAND_PALETTE_WEB',
  commandPaletteAdmin: 'NEXT_PUBLIC_FEATURE_COMMAND_PALETTE_ADMIN',
  projectHubContractStrip: 'NEXT_PUBLIC_FEATURE_PROJECT_HUB_CONTRACT_STRIP',
  landingHeroRevamp: 'NEXT_PUBLIC_FEATURE_LANDING_HERO_REVAMP',
} as const;

export type FeatureFlagName = keyof typeof featureFlags;

export function isFeatureEnabled(name: FeatureFlagName, fallback = true): boolean {
  const key = featureFlags[name];
  const raw = typeof process !== 'undefined' ? process.env[key] : undefined;
  if (!raw) return fallback;
  const value = raw.trim().toLowerCase();
  if (value === '1' || value === 'true' || value === 'yes' || value === 'on') return true;
  if (value === '0' || value === 'false' || value === 'no' || value === 'off') return false;
  return fallback;
}
