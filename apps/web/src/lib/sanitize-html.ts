import sanitizeHtmlLib from 'sanitize-html';

const OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    'p',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'strong',
    'em',
    'b',
    'i',
    'u',
    's',
    'code',
    'pre',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'figure',
    'figcaption',
    'span',
    'div',
    'sub',
    'sup',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'title', 'class'],
    img: ['src', 'alt', 'title', 'width', 'height', 'class'],
    '*': ['class', 'title', 'colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform('a', {
      rel: 'noopener noreferrer',
      target: '_blank',
    }),
  },
};

/**
 * Sanitize untrusted HTML (blog/portfolio content) before dangerouslySetInnerHTML.
 * Strips scripts, event handlers, and javascript: URLs.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return sanitizeHtmlLib(dirty, OPTIONS);
}
