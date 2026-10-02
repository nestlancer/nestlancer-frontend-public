'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { faviconLogoSrc } from '../components/brand/logo-assets';

export type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const FAVICON_LIGHT = faviconLogoSrc('light');
const FAVICON_DARK = faviconLogoSrc('dark');

const STORAGE_KEY = 'theme';
/** Shared across nestlancer.com / app / admin (and localhost ports). */
export const THEME_COOKIE_NAME = 'nl_theme';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

function parseTheme(value: string | null | undefined): Theme | null {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return null;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function expireCookie(name: string, domain?: string) {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const parts = [`${name}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  if (domain) parts.push(`Domain=${domain}`);
  document.cookie = parts.join('; ');
}

function writeThemeCookie(theme: Theme, domain?: string) {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const parts = [
    `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  const resolvedDomain = resolveThemeCookieDomain(domain);
  // Host-only leftovers fight Domain=.nestlancer.com (prompt 17 CHECK 4).
  expireCookie(THEME_COOKIE_NAME);
  if (resolvedDomain) parts.push(`Domain=${resolvedDomain}`);
  document.cookie = parts.join('; ');
}

/**
 * Only attach Domain when the current host can accept it.
 * Avoids rejecting the cookie on localhost when layouts pass `.nestlancer.com`
 * under NODE_ENV=production (e.g. local docker prod builds).
 */
function resolveThemeCookieDomain(override?: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
    return undefined;
  }
  const candidate =
    override ??
    (host === 'nestlancer.com' || host.endsWith('.nestlancer.com') ? '.nestlancer.com' : undefined);
  if (!candidate) return undefined;
  const bare = candidate.replace(/^\./, '');
  if (host !== bare && !host.endsWith(`.${bare}`)) return undefined;
  return candidate.startsWith('.') ? candidate : `.${bare}`;
}

/**
 * Shared cookie is the cross-app source of truth; localStorage is a same-origin cache.
 */
export function readStoredTheme(storageKey: string = STORAGE_KEY): Theme | null {
  if (typeof window === 'undefined') return null;
  const fromCookie = parseTheme(readCookie(THEME_COOKIE_NAME));
  if (fromCookie) return fromCookie;
  try {
    return parseTheme(window.localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

function persistTheme(theme: Theme, storageKey: string, cookieDomain?: string) {
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // ignore
  }
  writeThemeCookie(theme, cookieDomain);
}

function mirrorToLocalStorage(theme: Theme, storageKey: string) {
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // ignore
  }
}

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY,
  /** e.g. `.nestlancer.com` so landing + app + admin share one preference. */
  cookieDomain,
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  cookieDomain?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return readStoredTheme(storageKey) ?? defaultTheme;
  });

  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Keep cookie ↔ localStorage in sync (migrate older localStorage-only prefs)
  useEffect(() => {
    try {
      const fromCookie = parseTheme(readCookie(THEME_COOKIE_NAME));
      const fromLs = parseTheme(window.localStorage.getItem(storageKey));
      if (fromCookie) {
        mirrorToLocalStorage(fromCookie, storageKey);
      } else if (fromLs) {
        writeThemeCookie(fromLs, cookieDomain);
      }
    } catch {
      // ignore
    }
  }, [storageKey, cookieDomain]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(getSystemTheme());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  // Same-origin tabs
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || event.newValue == null) return;
      const next = parseTheme(event.newValue);
      if (next) setThemeState(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  // Cross-subdomain / cross-port: another app may have updated the cookie
  useEffect(() => {
    const syncFromCookie = () => {
      const fromCookie = parseTheme(readCookie(THEME_COOKIE_NAME));
      if (!fromCookie || fromCookie === theme) return;
      setThemeState(fromCookie);
      mirrorToLocalStorage(fromCookie, storageKey);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncFromCookie();
    };
    window.addEventListener('focus', syncFromCookie);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', syncFromCookie);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [theme, storageKey]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      persistTheme(next, storageKey, cookieDomain);
    },
    [storageKey, cookieDomain]
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/**
 * Inline script for root layout — prevents theme FOUC.
 * Prefers shared `nl_theme` cookie (landing / app / admin), then localStorage.
 */
export const themeInitScript = `(function(){try{var t=null;var m=document.cookie.match(/(?:^|; )nl_theme=([^;]*)/);if(m)t=decodeURIComponent(m[1]);if(!t){try{t=localStorage.getItem('theme')}catch(e){}}var dark=t==='dark'||((t==='system'||!t)&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;

/**
 * FOUC-prevention only — sets the favicon href on the very first paint,
 * before React hydrates. Uses a cache-busting query string so Chrome
 * treats light/dark as distinct URLs and doesn't serve stale cache.
 *
 * After hydration, <FaviconManager> takes over and handles all updates.
 */
// Paths interpolated at module load from logo-assets (single source of truth).
// logo-icon-dark = WHITE icon (dark OS tabs); logo-icon-light = NAVY icon (light OS tabs).
export const faviconInitScript = `(function(){
  try {
    var osDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var baseHref = osDark ? '${FAVICON_DARK}?theme=dark' : '${FAVICON_LIGHT}?theme=light';
    
    var link = document.createElement('link');
    link.id = 'favicon-svg';
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    // Append timestamp to completely bust Chrome's aggressive favicon cache
    link.href = baseHref + '&v=' + Date.now();
    document.head.appendChild(link);
  } catch(e) {}
})();`;

/**
 * FaviconManager — place this *inside* ThemeProvider in each root layout.
 *
 * This manages the favicon based strictly on the BROWSER'S OS theme preference,
 * independent of the application's internal theme setting.
 */
export function FaviconManager() {
  useEffect(() => {
    const updateFavicon = (e: MediaQueryListEvent | MediaQueryList) => {
      const isDark = e.matches;
      const baseHref = isDark ? `${FAVICON_DARK}?theme=dark` : `${FAVICON_LIGHT}?theme=light`;

      // Dynamic timestamp to force Chrome to drop its cached favicon
      const href = `${baseHref}&v=${Date.now()}`;

      // Chrome ignores href mutations on <link rel="icon">.
      // To force an update, we must physically remove the old nodes and append a new one.
      // Since React no longer renders this link in layout.tsx, it won't crash on remove().
      document.querySelectorAll('link[rel="icon"]').forEach((el) => el.remove());

      const newLink = document.createElement('link');
      newLink.id = 'favicon-svg';
      newLink.rel = 'icon';
      newLink.type = 'image/svg+xml';
      newLink.href = href;
      document.head.appendChild(newLink);
    };

    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    // We intentionally DO NOT call updateFavicon(mq) on initial mount,
    // because the inline faviconInitScript already injected the correct initial icon.
    // Calling it here would cause a redundant update immediately after hydration.
    const onChange = (e: MediaQueryListEvent) => updateFavicon(e);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return null;
}
