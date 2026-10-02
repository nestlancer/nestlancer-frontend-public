import { describe, expect, it } from 'vitest';

import { sanitizeHtml } from './sanitize-html';

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert(1)</script>');
    expect(result).toContain('<p>Hello</p>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert');
  });

  it('strips event handler attributes', () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)" alt="cover" />');
    expect(result).toContain('alt="cover"');
    expect(result).not.toMatch(/onerror/i);
    expect(result).not.toContain('alert');
  });

  it('strips javascript: urls', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toMatch(/javascript:/i);
  });

  it('keeps safe article markup', () => {
    const result = sanitizeHtml(
      '<h2>Title</h2><p>Body with <strong>bold</strong> and <em>italic</em>.</p><ul><li>One</li></ul>'
    );
    expect(result).toContain('<h2>Title</h2>');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<li>One</li>');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});
