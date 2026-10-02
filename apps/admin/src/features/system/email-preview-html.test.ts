import { describe, expect, it } from 'vitest';

import { neutralizeEmailHtml, toEmailPreviewDocument } from './email-preview-html';

describe('neutralizeEmailHtml', () => {
  it('strips an event handler that is not preceded by whitespace', () => {
    const result = neutralizeEmailHtml(
      '<img/onerror=alert(1) src="https://cdn.nestlancer.com/a.png">'
    );
    expect(result).not.toMatch(/onerror/i);
    expect(result).not.toContain('alert');
  });

  it('strips quoted handlers, scripts, and javascript urls', () => {
    const result = neutralizeEmailHtml(
      '<p>Hi</p><script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(2)">x</a>'
    );
    expect(result).toContain('<p>Hi</p>');
    expect(result).not.toMatch(/<script/i);
    expect(result).not.toMatch(/javascript:/i);
    expect(result).not.toMatch(/onclick/i);
  });

  it('does not inject a base target', () => {
    const doc = toEmailPreviewDocument('<p>Hello</p><base target="_blank">');
    expect(doc).not.toMatch(/<base/i);
    expect(doc).toContain('<p>Hello</p>');
  });
});
