'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { safeNavigationUrl } from '@nestlancer/utils';

import { buildMarkdownHeadingIds } from '@/features/blog/blog-utils';

type Props = {
  content: string;
  className?: string;
};

export function BlogMarkdown({ content, className }: Props) {
  const headingIds = useMemo(() => buildMarkdownHeadingIds(content), [content]);
  let headingIndex = 0;
  const nextHeadingId = () => headingIds[headingIndex++] ?? `section-${headingIndex}`;

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => safeNavigationUrl(url, { mailto: true }) ?? ''}
        components={{
          h1: ({ children }) => (
            <h2
              id={nextHeadingId()}
              className="mb-4 mt-10 scroll-mt-24 font-display text-2xl font-bold tracking-tight first:mt-0 sm:text-3xl"
            >
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2
              id={nextHeadingId()}
              className="mb-3 mt-8 scroll-mt-28 font-display text-xl font-semibold tracking-tight sm:text-2xl"
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              id={nextHeadingId()}
              className="mb-2 mt-6 scroll-mt-28 text-lg font-semibold sm:text-xl"
            >
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-5 leading-[1.75] text-foreground/90">{children}</p>,
          ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6">{children}</ol>,
          li: ({ children }) => (
            <li className="leading-relaxed text-foreground/90 [&>p]:mb-2">{children}</li>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-2 font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2 align-top text-foreground/90">
              {children}
            </td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-4 border-primary/50 bg-muted/30 py-2 pl-5 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            const safeHref = safeNavigationUrl(href, { mailto: true });
            if (!safeHref) return <span>{children}</span>;
            return (
              <a
                href={safeHref}
                className="font-medium text-primary underline-offset-4 hover:underline"
                target={safeHref.startsWith('mailto:') ? undefined : '_blank'}
                rel={safeHref.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              >
                {children}
              </a>
            );
          },
          pre: ({ children }) => (
            <pre className="my-6 overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 text-sm">
              {children}
            </pre>
          ),
          code: ({ className: codeClass, children }) => {
            const isBlock = codeClass?.includes('language-');
            if (isBlock) {
              return <code className={codeClass}>{children}</code>;
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-10 border-border" />,
          img: ({ alt, src }) => {
            const safeSrc = typeof src === 'string' ? safeNavigationUrl(src) : null;
            if (!safeSrc) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safeSrc}
                alt={alt ?? ''}
                className="my-8 w-full rounded-xl border border-border"
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
