import Link from 'next/link';

export function BlogNewsletterCta() {
  return (
    <aside className="accent-surface rounded-2xl p-8 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Stay in the loop
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Ideas for product teams and studio clients
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Get practical playbooks on hiring, delivery, and growing your practice. We publish sparingly
        — only when there is something worth your time.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          Get in touch
        </Link>
        <a
          href="/blog/feed/rss"
          className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-medium hover:bg-muted"
        >
          RSS feed
        </a>
      </div>
    </aside>
  );
}
