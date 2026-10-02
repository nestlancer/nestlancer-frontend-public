'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { safeNavigationUrl } from '@nestlancer/utils';

type Props = {
  title: string;
  excerpt: string;
  content: string;
  category?: string;
  tags: string[];
  readingMinutes: number;
  device: 'desktop' | 'mobile';
};

export function BlogPostPreview({
  title,
  excerpt,
  content,
  category,
  tags,
  readingMinutes,
  device,
}: Props) {
  return (
    <div
      className={`mx-auto overflow-hidden rounded-xl border border-border bg-[hsl(var(--article-bg))] text-[hsl(var(--article-text))] shadow-sm transition-[max-width] ${
        device === 'mobile' ? 'max-w-[390px]' : 'max-w-full'
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--article-border))] bg-[hsl(var(--article-bg))]/95 px-4 py-3">
        <span className="text-sm font-medium text-[hsl(var(--article-accent))]">
          ← Back to articles
        </span>
        <span className="font-mono text-xs text-[hsl(var(--article-meta))]">
          {readingMinutes} min read
        </span>
      </div>

      <article className="mx-auto w-full max-w-[720px] break-words px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {category ? (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--article-accent))]">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--article-accent))]"
              aria-hidden
            />
            {category}
          </p>
        ) : null}

        <h1
          className={`mt-4 font-bold leading-[1.15] tracking-tight ${
            device === 'mobile' ? 'text-2xl' : 'text-2xl sm:text-3xl xl:text-[2.25rem]'
          }`}
        >
          {title.trim() || 'Untitled post'}
        </h1>

        <div className="mt-5 border-b border-[hsl(var(--article-border))] pb-6 text-sm text-[hsl(var(--article-meta))]">
          <span>Nestlancer</span>
          <span aria-hidden> · </span>
          <span>{readingMinutes} min read</span>
        </div>

        {excerpt.trim() ? (
          <p className="mt-8 text-lg leading-relaxed text-[hsl(var(--article-meta))]">{excerpt}</p>
        ) : null}

        <div className="mt-10 text-[17px] leading-[1.75] text-[hsl(var(--article-text))]">
          {content.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              urlTransform={(url) => safeNavigationUrl(url, { mailto: true }) ?? ''}
              components={{
                h1: ({ children }) => (
                  <h2 className="mb-4 mt-10 text-3xl font-bold tracking-tight first:mt-0">
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h3 className="mb-3 mt-8 text-2xl font-semibold tracking-tight">{children}</h3>
                ),
                h3: ({ children }) => (
                  <h4 className="mb-2 mt-6 text-xl font-semibold">{children}</h4>
                ),
                p: ({ children }) => <p className="mb-5 leading-[1.75] opacity-90">{children}</p>,
                ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6">{children}</ul>,
                ol: ({ children }) => (
                  <ol className="mb-5 list-decimal space-y-2 pl-6">{children}</ol>
                ),
                li: ({ children }) => <li className="leading-relaxed opacity-90">{children}</li>,
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
                code: ({ className, children }) =>
                  className?.includes('language-') ? (
                    <code className={className}>{children}</code>
                  ) : (
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
                      {children}
                    </code>
                  ),
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
          ) : (
            <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
              Start writing Markdown to see the article preview.
            </div>
          )}
        </div>

        {tags.length > 0 ? (
          <ul className="mt-10 flex flex-wrap gap-2 border-t border-[hsl(var(--article-border))] pt-8">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-[hsl(var(--article-border))] bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </div>
  );
}
