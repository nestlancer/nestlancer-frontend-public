'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PublicPortfolioItem } from '@nestlancer/types';

import { PortfolioShowcaseCard } from './PortfolioShowcaseCard';

type PortfolioFeaturedCarouselProps = {
  items: PublicPortfolioItem[];
};

const AUTO_ADVANCE_MS = 6000;
const CARD_WIDTH_CLASS = 'w-[240px] sm:w-[260px] lg:w-[280px]';

export function PortfolioFeaturedCarousel({ items }: PortfolioFeaturedCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;

    const cards = track.querySelectorAll<HTMLElement>('[data-carousel-card]');
    const target = cards[index];
    if (!target) return;

    track.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    setActiveIndex(index);
  }, []);

  const scrollByStep = useCallback(
    (direction: 'prev' | 'next') => {
      if (items.length <= 1) return;
      const nextIndex =
        direction === 'next'
          ? (activeIndex + 1) % items.length
          : (activeIndex - 1 + items.length) % items.length;
      scrollToIndex(nextIndex);
    },
    [activeIndex, items.length, scrollToIndex]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length <= 1) return;

    const onScroll = () => {
      const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-carousel-card]'));
      if (cards.length === 0) return;

      const center = track.scrollLeft + track.clientWidth / 2;
      let closest = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(center - cardCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closest = index;
        }
      });

      setActiveIndex(closest);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const timer = window.setInterval(() => {
      scrollByStep('next');
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, items.length, scrollByStep]);

  if (items.length === 0) return null;

  if (items.length <= 3) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <PortfolioShowcaseCard
            key={item.id}
            item={item}
            index={index}
            className="mx-auto w-full max-w-[280px] sm:mx-0 sm:max-w-none"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory no-scrollbar"
        aria-label="Featured portfolio projects"
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            data-carousel-card
            className={`${CARD_WIDTH_CLASS} shrink-0 snap-start`}
          >
            <PortfolioShowcaseCard item={item} index={index} className="h-full" />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show project ${index + 1}: ${item.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => scrollToIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-primary/50'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous project"
            onClick={() => scrollByStep('prev')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-sm transition-colors hover:border-primary hover:text-primary"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next project"
            onClick={() => scrollByStep('next')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-sm transition-colors hover:border-primary hover:text-primary"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
