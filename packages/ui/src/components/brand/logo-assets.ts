/**
 * Public SVG paths served from each app's `public/logos/`.
 * Keep `apps/{landing,web,admin}/public/logos/` byte-identical when updating assets.
 *
 * Naming: `*-light.svg` = navy mark for light backgrounds;
 * `*-dark.svg` = white mark for dark backgrounds.
 *
 * Email (PNG): `logo-email.png` — transactional mail uses this (SVG is unreliable in clients).
 * Also mirrored as `/logo.png` at each app public root for legacy links.
 */
export type LogoVariant = 'icon' | 'full';
export type LogoAppearance = 'light' | 'dark';

export function logoSrc(variant: LogoVariant, appearance: LogoAppearance): string {
  return `/logos/logo-${variant}-${appearance}.svg`;
}

/** Favicon always uses the icon mark (OS theme, not app theme). */
export function faviconLogoSrc(appearance: LogoAppearance): string {
  return logoSrc('icon', appearance);
}
