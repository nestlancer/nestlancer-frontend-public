import { describe, expect, it } from 'vitest';

import { normalizeNotificationItem } from './normalize-notification';

describe('normalizeNotificationItem href', () => {
  it('keeps same-origin paths and drops protocol-relative urls', () => {
    expect(
      normalizeNotificationItem({
        id: '1',
        title: 'Project',
        actionUrl: '/projects/9',
        createdAt: '2026-01-01T00:00:00.000Z',
      }).href
    ).toBe('/projects/9');

    expect(
      normalizeNotificationItem({
        id: '2',
        title: 'Phish',
        actionUrl: '//evil.example/steal',
        createdAt: '2026-01-01T00:00:00.000Z',
      }).href
    ).toBeUndefined();
  });

  it('does not turn an external page into an off-site link', () => {
    expect(
      normalizeNotificationItem({
        id: '3',
        title: 'External',
        actionUrl: 'https://evil.example/phish',
        createdAt: '2026-01-01T00:00:00.000Z',
      }).href
    ).toBe('/phish');
  });

  it('keeps trusted storage downloads as external urls', () => {
    expect(
      normalizeNotificationItem({
        id: '4',
        title: 'File',
        actionUrl: 'https://files.s3.amazonaws.com/export.zip?X-Amz-Signature=abc',
        createdAt: '2026-01-01T00:00:00.000Z',
      }).href
    ).toBe('https://files.s3.amazonaws.com/export.zip?X-Amz-Signature=abc');
  });
});
