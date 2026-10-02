/** Strip IPv4-mapped IPv6 (::ffff:x.x.x.x) for display. */
export function normalizeClientIp(ip: string | null | undefined): string | null {
  if (ip == null) return null;
  let value = String(ip).trim();
  if (!value) return null;

  if (value.includes(',')) {
    const [first] = value.split(',');
    value = (first ?? '').trim();
  }

  const ipv4Mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  const mappedIpv4 = ipv4Mapped?.[1];
  if (mappedIpv4) return mappedIpv4;

  if (value === '::1') return '127.0.0.1';

  return value;
}

/** Short browser + OS label from a User-Agent string. Returns null when unknown. */
export function parseUserAgentSummary(userAgent: string | null | undefined): string | null {
  if (!userAgent?.trim()) return null;

  const ua = userAgent.trim();

  let browser: string | null = null;
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

  let os: string | null = null;
  if (/Windows NT 10/i.test(ua)) os = 'Windows';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  if (browser && os) return `${browser} on ${os}`;
  if (browser) return browser;
  if (os) return os;
  return null;
}

export type SessionClientDisplay = {
  ip: string;
  device: string | null;
  /** One-line summary for lists */
  summary: string;
  /** Full user agent for tooltips */
  userAgentFull: string | null;
};

export function formatSessionClient(
  ip: string | null | undefined,
  userAgent: string | null | undefined
): SessionClientDisplay {
  const displayIp = normalizeClientIp(ip) ?? 'Unknown IP';
  const device = parseUserAgentSummary(userAgent);
  const summary = device
    ? device
    : displayIp !== 'Unknown IP'
      ? `${displayIp} · Web browser`
      : 'Web browser';

  return {
    ip: displayIp,
    device,
    summary,
    userAgentFull: userAgent?.trim() ? userAgent.trim() : null,
  };
}
