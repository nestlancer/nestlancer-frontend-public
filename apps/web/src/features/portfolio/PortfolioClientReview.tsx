import type { PortfolioClientReview as ClientReview } from '@nestlancer/types';

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${clamped} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 ${i < clamped ? 'text-amber-400' : 'text-muted-foreground/30'}`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.052 2.52-2.694.21c-.771.06-1.08 1.02-.52 1.56l2.05 1.77-.62 2.62c-.16.68.57 1.22 1.16.88l2.3-1.36 2.3 1.36c.59.34 1.32-.2 1.16-.88l-.62-2.62 2.05-1.77c.56-.54.25-1.5-.52-1.56l-2.694-.21-1.052-2.52z"
            clipRule="evenodd"
          />
        </svg>
      ))}
    </div>
  );
}

export function isPortfolioReviewVisible(
  review: ClientReview | null | undefined
): review is ClientReview {
  if (!review || typeof review !== 'object') return false;
  const quote = typeof review.quote === 'string' ? review.quote.trim() : '';
  if (!quote) return false;
  return review.enabled !== false;
}

export function PortfolioClientReviewSection({ review }: { review: ClientReview }) {
  const quote = review.quote?.trim() ?? '';
  const author = review.author?.trim();
  const role = review.role?.trim();

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-background p-6 sm:p-8"
      aria-label="Client review"
    >
      <div
        className="pointer-events-none absolute -right-4 -top-6 font-serif text-[7rem] leading-none text-primary/10"
        aria-hidden
      >
        “
      </div>

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Client review</p>

        {typeof review.rating === 'number' && review.rating > 0 ? (
          <div className="mt-3">
            <StarRating rating={review.rating} />
          </div>
        ) : null}

        <figure className="mt-4">
          <blockquote className="font-display text-lg font-medium leading-relaxed tracking-tight text-foreground sm:text-xl">
            {quote}
          </blockquote>
          {author || role ? (
            <figcaption className="mt-5 flex flex-col gap-0.5 border-t border-border/60 pt-4">
              {author ? (
                <cite className="text-sm font-semibold not-italic text-foreground">{author}</cite>
              ) : null}
              {role ? <span className="text-sm text-muted-foreground">{role}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      </div>
    </section>
  );
}
