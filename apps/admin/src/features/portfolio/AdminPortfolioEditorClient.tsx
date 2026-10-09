'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cloneElement, useEffect, useId, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { Button, Input } from '@nestlancer/ui';

import { AdminQueryState, AdminSection } from '@/components/admin/AdminConsolePrimitives';
import { PageHeader } from '@/components/admin/AdminDataViews';
import { AdminPortfolioMediaPanel } from '@/features/portfolio/AdminPortfolioMediaPanel';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRecord, pickAdminRows } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

function parseTags(raw: unknown): string {
  if (!Array.isArray(raw)) return '';
  return raw.map(String).join(', ');
}

export function AdminPortfolioEditorClient({ itemId }: { itemId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProjectId = searchParams.get('fromProject');
  const qc = useQueryClient();
  const isEdit = Boolean(itemId);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [contentFormat, setContentFormat] = useState<'MARKDOWN' | 'HTML'>('MARKDOWN');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientIndustry, setClientIndustry] = useState('');
  const [clientWebsite, setClientWebsite] = useState('');
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [testimonialQuote, setTestimonialQuote] = useState('');
  const [testimonialAuthor, setTestimonialAuthor] = useState('');
  const [testimonialRole, setTestimonialRole] = useState('');
  const [reviewRating, setReviewRating] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [duration, setDuration] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featured, setFeatured] = useState(false);

  const detailQ = useQuery({
    queryKey: adminKeys.portfolioItem(itemId!),
    queryFn: () => apiServices.admin.getAdminPortfolio(itemId!),
    enabled: isEdit,
  });

  const categoriesQ = useQuery({
    queryKey: [...adminKeys.portfolio(), 'categories'],
    queryFn: () => apiServices.admin.listPortfolioCategories(),
  });

  const categories = useMemo(() => {
    const rows = pickAdminRows(categoriesQ.data);
    return rows as Array<{ id: string; name: string; slug?: string }>;
  }, [categoriesQ.data]);

  useEffect(() => {
    const record = pickAdminRecord(detailQ.data);
    if (!record) return;
    setTitle(String(record.title ?? ''));
    setSlug(String(record.slug ?? ''));
    setShortDescription(String(record.shortDescription ?? ''));
    setFullDescription(String(record.fullDescription ?? ''));
    const fmt = String(record.contentFormat ?? 'MARKDOWN').toUpperCase();
    setContentFormat(fmt === 'HTML' ? 'HTML' : 'MARKDOWN');
    setCategoryId(
      String(record.categoryId ?? (record.category as { id?: string } | null | undefined)?.id ?? '')
    );
    setTags(parseTags(record.tags));
    setClientName(String(record.clientName ?? ''));
    setClientIndustry(String(record.clientIndustry ?? ''));
    setClientWebsite(String(record.clientWebsite ?? ''));
    const testimonial = record.clientTestimonial as {
      quote?: string;
      author?: string;
      role?: string;
      rating?: number;
      enabled?: boolean;
    } | null;
    const hasReview = Boolean(testimonial?.quote?.trim());
    setReviewEnabled(testimonial?.enabled !== false && hasReview);
    setTestimonialQuote(String(testimonial?.quote ?? ''));
    setTestimonialAuthor(String(testimonial?.author ?? ''));
    setTestimonialRole(String(testimonial?.role ?? ''));
    setReviewRating(
      typeof testimonial?.rating === 'number' && testimonial.rating > 0
        ? String(testimonial.rating)
        : ''
    );
    const details = record.projectDetails as { technologies?: string[]; duration?: string } | null;
    setTechnologies((details?.technologies ?? []).join(', '));
    setDuration(String(details?.duration ?? ''));
    const links = record.links as { live?: string; github?: string } | null;
    setLiveUrl(String(links?.live ?? ''));
    setGithubUrl(String(links?.github ?? ''));
    const seo = record.seo as { metaTitle?: string; metaDescription?: string } | null;
    setMetaTitle(String(seo?.metaTitle ?? ''));
    setMetaDescription(String(seo?.metaDescription ?? ''));
    setFeatured(Boolean(record.featured));
  }, [detailQ.data]);

  const buildBody = () => {
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const techList = technologies
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const rating =
      reviewRating.trim() && Number.isFinite(Number(reviewRating))
        ? Math.min(5, Math.max(1, Number(reviewRating)))
        : undefined;

    const clientReview =
      reviewEnabled && testimonialQuote.trim()
        ? {
            quote: testimonialQuote.trim(),
            author: testimonialAuthor.trim() || 'Client',
            role: testimonialRole.trim() || undefined,
            rating,
            enabled: true,
          }
        : undefined;

    const hasClientInfo = Boolean(
      clientName.trim() || clientIndustry.trim() || clientWebsite.trim() || clientReview
    );

    return {
      title: title.trim(),
      slug: slug.trim() || undefined,
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      contentFormat,
      categoryId: categoryId || undefined,
      tags: tagList.length ? tagList : undefined,
      featured,
      client: hasClientInfo
        ? {
            name: clientName.trim() || 'Confidential Client',
            industry: clientIndustry.trim() || undefined,
            website: clientWebsite.trim() || undefined,
            testimonial: clientReview,
          }
        : undefined,
      clientTestimonial: !reviewEnabled ? null : (clientReview ?? null),
      projectDetails: {
        duration: duration.trim() || undefined,
        technologies: techList.length ? techList : undefined,
      },
      links: {
        live: liveUrl.trim() || undefined,
        github: githubUrl.trim() || undefined,
      },
      seo: {
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
      },
    };
  };

  const saveM = useMutation({
    mutationFn: () => {
      const body = buildBody();
      return isEdit
        ? apiServices.admin.patchAdminPortfolio(itemId!, body)
        : apiServices.admin.createAdminPortfolio(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Portfolio item updated' : 'Portfolio item created');
      void qc.invalidateQueries({ queryKey: adminKeys.portfolio() });
      if (isEdit && itemId) {
        void qc.invalidateQueries({ queryKey: adminKeys.portfolioItem(itemId) });
      } else {
        router.push('/portfolio');
      }
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Save failed')),
  });

  const publishM = useMutation({
    mutationFn: () => apiServices.admin.publishAdminPortfolio(itemId!),
    onSuccess: () => {
      toast.success('Published to portfolio');
      void qc.invalidateQueries({ queryKey: adminKeys.portfolio() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Publish failed')),
  });

  const record = pickAdminRecord(detailQ.data) as Record<string, unknown> | null;
  const sourceProjectId = record?.sourceProjectId as string | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Content"
        title={isEdit ? 'Edit portfolio item' : 'New portfolio item'}
        description="Curate the public case study. Client project data stays private."
      />
      <Link href="/portfolio" className="text-sm font-medium text-primary hover:underline">
        ← Back to portfolio
      </Link>

      {fromProjectId ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          Created from project{' '}
          <Link href={`/projects/${fromProjectId}`} className="font-medium underline">
            {fromProjectId}
          </Link>
          . Remove any sensitive details before publishing.
        </p>
      ) : null}

      {sourceProjectId ? (
        <p className="text-sm text-muted-foreground">
          Source project:{' '}
          <Link href={`/projects/${sourceProjectId}`} className="text-primary hover:underline">
            {sourceProjectId}
          </Link>
        </p>
      ) : null}

      <AdminQueryState isLoading={isEdit && detailQ.isPending} error={detailQ.error}>
        <form
          className="max-w-3xl space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveM.mutate();
          }}
        >
          <AdminSection title="Content" className="space-y-4">
            <Field label="Title" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg"
                required
                placeholder="e.g. D2C store rebuild"
              />
            </Field>
            <Field label="Slug">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-lg font-mono text-sm"
                placeholder="auto-generated if empty"
              />
            </Field>
            <Field label="Short description" required>
              <TextArea
                value={shortDescription}
                onChange={setShortDescription}
                rows={3}
                required
                placeholder="One-line case-study summary"
              />
            </Field>
            <Field label="Content format">
              <select
                value={contentFormat}
                onChange={(e) => setContentFormat(e.target.value as 'MARKDOWN' | 'HTML')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="MARKDOWN">Markdown</option>
                <option value="HTML">HTML</option>
              </select>
            </Field>
            <Field label="Full description" required>
              <TextArea
                value={fullDescription}
                onChange={setFullDescription}
                rows={12}
                mono
                required
                placeholder="Write the case study in Markdown…"
              />
            </Field>
          </AdminSection>

          <AdminSection title="Classification" className="space-y-4">
            <Field label="Category">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tags (comma-separated)">
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="rounded-lg"
                placeholder="shopify, d2c, checkout"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Featured on homepage
            </label>
          </AdminSection>

          <AdminSection
            title="Client (marketing only)"
            description="Display name and context for the case study. Use a confidential label when the real client should stay private."
            className="space-y-4"
          >
            <Field label="Client name">
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="rounded-lg"
                placeholder="Brand name or Confidential client"
              />
            </Field>
            <Field label="Industry">
              <Input
                value={clientIndustry}
                onChange={(e) => setClientIndustry(e.target.value)}
                className="rounded-lg"
                placeholder="e.g. D2C fashion"
              />
            </Field>
            <Field label="Website">
              <Input
                value={clientWebsite}
                onChange={(e) => setClientWebsite(e.target.value)}
                className="rounded-lg"
                placeholder="https://"
              />
            </Field>
          </AdminSection>

          <AdminSection
            title="Client review"
            description="Curate a public review for this showcase. You enter the quote and attribution — it does not need to come from the client portal."
            className="space-y-4"
          >
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={reviewEnabled}
                onChange={(e) => setReviewEnabled(e.target.checked)}
              />
              Show on public showcase
            </label>

            {reviewEnabled ? (
              <div className="space-y-4">
                <Field label="Review quote" required>
                  <TextArea
                    value={testimonialQuote}
                    onChange={setTestimonialQuote}
                    rows={4}
                    required={reviewEnabled}
                    placeholder="What did the client say about the project outcome?"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Reviewer name">
                    <Input
                      value={testimonialAuthor}
                      onChange={(e) => setTestimonialAuthor(e.target.value)}
                      className="rounded-lg"
                      placeholder="Reviewer name"
                    />
                  </Field>
                  <Field label="Reviewer role / title">
                    <Input
                      value={testimonialRole}
                      onChange={(e) => setTestimonialRole(e.target.value)}
                      className="rounded-lg"
                      placeholder="Founder, D2C brand"
                    />
                  </Field>
                </div>
                <Field label="Star rating (optional)">
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No rating</option>
                    <option value="5">5 stars — Excellent</option>
                    <option value="4">4 stars — Great</option>
                    <option value="3">3 stars — Good</option>
                    <option value="2">2 stars — Fair</option>
                    <option value="1">1 star — Poor</option>
                  </select>
                </Field>

                {testimonialQuote.trim() ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Preview
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{testimonialQuote.trim()}</p>
                    {testimonialAuthor.trim() || testimonialRole.trim() ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        —{' '}
                        {[testimonialAuthor.trim(), testimonialRole.trim()]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enable the review section to add a curated client quote to the public case study
                page.
              </p>
            )}
          </AdminSection>

          <AdminSection title="Project details" className="space-y-4">
            <Field label="Duration">
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="rounded-lg"
                placeholder="e.g. 8 weeks"
              />
            </Field>
            <Field label="Technologies (comma-separated)">
              <Input
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                className="rounded-lg"
                placeholder="Next.js, Razorpay, Shopify"
              />
            </Field>
          </AdminSection>

          <AdminSection title="Links" className="space-y-4">
            <Field label="Live URL">
              <Input
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                className="rounded-lg"
                placeholder="https://"
              />
            </Field>
            <Field label="GitHub URL">
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="rounded-lg"
                placeholder="https://github.com/…"
              />
            </Field>
          </AdminSection>

          {isEdit && itemId ? <AdminPortfolioMediaPanel itemId={itemId} /> : null}

          <AdminSection title="SEO" className="space-y-4">
            <Field label="Meta title">
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="rounded-lg"
                placeholder="SEO title for search results"
              />
            </Field>
            <Field label="Meta description">
              <TextArea
                value={metaDescription}
                onChange={setMetaDescription}
                rows={2}
                placeholder="155 characters that sell the click"
              />
            </Field>
          </AdminSection>

          <div className="h-16" aria-hidden />
          <div className="sticky bottom-0 z-20 -mx-1 flex flex-wrap gap-2 border-t border-border/70 bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85">
            <Button
              type="submit"
              disabled={
                saveM.isPending || !title.trim() || (reviewEnabled && !testimonialQuote.trim())
              }
              className="rounded-md"
            >
              {saveM.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create item'}
            </Button>
            {isEdit ? (
              <Button
                type="button"
                variant="secondary"
                className="rounded-md"
                disabled={publishM.isPending}
                onClick={() => publishM.mutate()}
              >
                {publishM.isPending ? 'Publishing…' : 'Publish'}
              </Button>
            ) : null}
          </div>
        </form>
      </AdminQueryState>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactElement;
}) {
  const id = useId();
  const controlId = (children.props as { id?: string }).id ?? id;
  return (
    <div>
      <label htmlFor={controlId} className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? ' *' : ''}
      </label>
      <div className="mt-1">
        {cloneElement(children, {
          id: controlId,
          ...(required ? { 'aria-required': true } : {}),
        } as Record<string, unknown>)}
      </div>
    </div>
  );
}

function TextArea({
  id,
  value,
  onChange,
  rows = 4,
  mono,
  required,
  placeholder,
  'aria-required': ariaRequired,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  mono?: boolean;
  required?: boolean;
  placeholder?: string;
  'aria-required'?: boolean;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      required={required}
      aria-required={ariaRequired}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm ${mono ? 'font-mono' : ''}`}
    />
  );
}
