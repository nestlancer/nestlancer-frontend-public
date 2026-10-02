import { Container } from '@nestlancer/ui';

export function AboutPhotoHero() {
  return (
    <section className="photo-hero relative flex min-h-[26rem] items-center overflow-hidden text-white">
      <div className="photo-hero__image absolute inset-0" aria-hidden />
      <div className="photo-hero__gradient absolute inset-0" aria-hidden />
      <div className="photo-hero__vignette absolute inset-0" aria-hidden />
      <Container className="relative z-10 py-20">
        <div className="max-w-xl">
          <p className="mb-5 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/85">
            Human connection
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
            Clients &amp; studio, <span className="text-emerald-300">working as one</span>
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
            We built Nestlancer because product work deserves a calmer, more transparent way to
            collaborate with a dedicated studio.
          </p>
        </div>
      </Container>
    </section>
  );
}
