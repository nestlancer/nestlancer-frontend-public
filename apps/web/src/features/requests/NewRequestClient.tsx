'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, type FormEvent } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage, peelSuccessEnvelope } from '@nestlancer/api-client';
import { DEFAULT_CURRENCY, REQUEST_CATEGORY_LABELS, routes } from '@nestlancer/constants';
import { FormFieldLabel } from '@nestlancer/field-help';
import type { CreateRequestPayload } from '@nestlancer/types';
import {
  REQUEST_DESCRIPTION_MAX,
  REQUEST_DESCRIPTION_MIN,
  REQUEST_TITLE_MAX,
  REQUEST_TITLE_MIN,
  requestCreateSchema,
} from '@nestlancer/validators';
import { Button, PageHeader, cn } from '@nestlancer/ui';

import { WebPanel } from '@/components/web/WebPanel';
import { useCreateRequestMutation } from '@/features/requests/hooks/useRequestsApi';
import { webPrimaryButtonClass, webStickyActionBarClass } from '@/lib/tailadmin-classes';

const CATEGORIES = [
  'webDevelopment',
  'mobileApp',
  'ecommerce',
  'design',
  'branding',
  'marketing',
  'seo',
  'consulting',
  'maintenance',
  'custom',
] as const;

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ta-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30';

const defaultStartDate = new Date().toISOString().slice(0, 10);
const defaultDeadline = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

function readFormValues(form: HTMLFormElement) {
  const fd = new FormData(form);
  const title = String(fd.get('title') ?? '').trim();
  const description = String(fd.get('description') ?? '').trim();
  const category = String(fd.get('category') ?? 'webDevelopment');
  const budgetMin = Number(fd.get('budgetMin') ?? 0);
  const budgetMax = Number(fd.get('budgetMax') ?? 0);
  const requirementsRaw = String(fd.get('requirements') ?? '');
  const requirements = requirementsRaw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const preferredStartDate = String(fd.get('preferredStartDate') ?? '');
  const deadline = String(fd.get('deadline') ?? '');
  const budgetFlexible = fd.get('budgetFlexible') === 'on';

  return {
    title,
    description,
    category,
    budget: {
      min: Number.isFinite(budgetMin) ? budgetMin : 0,
      max: Number.isFinite(budgetMax) ? budgetMax : 0,
      currency: DEFAULT_CURRENCY,
      flexible: budgetFlexible,
    },
    timeline: {
      preferredStartDate,
      deadline,
      flexible: false,
    },
    requirements,
  };
}

export function NewRequestClient() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const createRequest = useCreateRequestMutation();
  const pending = createRequest.isPending;

  async function saveDraft() {
    const formEl = formRef.current;
    if (!formEl) {
      toast.error('Form is not ready. Please try again.');
      return;
    }

    const values = readFormValues(formEl);
    const parsed = requestCreateSchema.safeParse({
      title: values.title,
      description: values.description,
      ...(values.budget.min > 0 ? { budgetMin: values.budget.min } : {}),
      ...(values.budget.max > 0 ? { budgetMax: values.budget.max } : {}),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Check the request details.');
      return;
    }

    if (!values.timeline.preferredStartDate || !values.timeline.deadline) {
      toast.error('Preferred start and deadline are required.');
      return;
    }
    if (values.budget.max < values.budget.min) {
      toast.error('Maximum budget must be at least the minimum.');
      return;
    }

    const payload: CreateRequestPayload = {
      title: values.title,
      description: values.description,
      category: values.category,
      budget: values.budget,
      requirements: values.requirements,
      timeline: {
        ...values.timeline,
        preferredStartDate: new Date(values.timeline.preferredStartDate).toISOString(),
        deadline: new Date(values.timeline.deadline).toISOString(),
      },
    };

    try {
      const raw = await createRequest.mutateAsync({
        data: payload as Parameters<typeof createRequest.mutateAsync>[0]['data'],
      });
      const created = peelSuccessEnvelope(raw) as Record<string, unknown>;
      const id = typeof created.id === 'string' ? created.id : null;
      toast.success('Request saved as draft.');
      if (id) router.push(routes.request(id));
      else router.push(routes.requests);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create request'));
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await saveDraft();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New request"
        description="Describe your project and save a draft. You can edit attachments and submit for quotes from the request page when you’re ready."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.requests}>Back to requests</Link>
          </Button>
        }
      />

      <form ref={formRef} noValidate onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-4">
        <WebPanel padding="md" className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Brief</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Title, scope, and category for your intake.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <FormFieldLabel htmlFor="req-title" fieldKey="requests.title" label="Title" required>
              Title
            </FormFieldLabel>
            <input
              id="req-title"
              name="title"
              required
              minLength={REQUEST_TITLE_MIN}
              maxLength={REQUEST_TITLE_MAX}
              className={fieldClass}
              defaultValue=""
              placeholder="e.g. Redesign marketing site"
            />
          </div>
          <div className="space-y-2 text-sm">
            <FormFieldLabel
              htmlFor="req-description"
              fieldKey="requests.description"
              label="Description"
              required
            >
              Description
            </FormFieldLabel>
            <textarea
              id="req-description"
              name="description"
              required
              minLength={REQUEST_DESCRIPTION_MIN}
              maxLength={REQUEST_DESCRIPTION_MAX}
              rows={6}
              className={fieldClass}
              defaultValue=""
              placeholder="Goals, constraints, and what success looks like…"
            />
          </div>
          <div className="space-y-2 text-sm">
            <FormFieldLabel htmlFor="req-category" fieldKey="requests.category" label="Category">
              Category
            </FormFieldLabel>
            <select
              id="req-category"
              name="category"
              className={fieldClass}
              defaultValue="webDevelopment"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {REQUEST_CATEGORY_LABELS[c] ?? c}
                </option>
              ))}
            </select>
          </div>
        </WebPanel>

        <WebPanel padding="md" className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Budget</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Approximate range in {DEFAULT_CURRENCY}.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <FormFieldLabel
                htmlFor="req-budget-min"
                fieldKey="requests.budgetMin"
                label="Budget min"
              >
                Budget min
              </FormFieldLabel>
              <input
                id="req-budget-min"
                name="budgetMin"
                type="number"
                min={0}
                className={fieldClass}
                defaultValue=""
                placeholder="50000"
              />
            </div>
            <div className="space-y-2 text-sm">
              <FormFieldLabel
                htmlFor="req-budget-max"
                fieldKey="requests.budgetMax"
                label="Budget max"
              >
                Budget max
              </FormFieldLabel>
              <input
                id="req-budget-max"
                name="budgetMax"
                type="number"
                min={0}
                className={fieldClass}
                defaultValue=""
                placeholder="150000"
              />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <FormFieldLabel
              htmlFor="req-currency"
              fieldKey="requests.budgetCurrency"
              label="Currency"
            >
              Currency
            </FormFieldLabel>
            <input
              id="req-currency"
              readOnly
              aria-readonly="true"
              className={cn(fieldClass, 'max-w-xs uppercase bg-gray-50 dark:bg-gray-800/80')}
              defaultValue={DEFAULT_CURRENCY}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              id="req-budget-flex"
              name="budgetFlexible"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-ta-brand-500 focus:ring-ta-brand-500/30"
            />
            <FormFieldLabel
              htmlFor="req-budget-flex"
              fieldKey="requests.budgetFlexible"
              label="Budget is flexible"
            >
              Budget is flexible
            </FormFieldLabel>
          </label>
        </WebPanel>

        <WebPanel padding="md" className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Timeline & requirements
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Preferred dates and must-have items.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <FormFieldLabel
                htmlFor="req-preferred-start"
                fieldKey="requests.preferredStartDate"
                label="Preferred start"
              >
                Preferred start
              </FormFieldLabel>
              <input
                id="req-preferred-start"
                name="preferredStartDate"
                type="date"
                className={fieldClass}
                defaultValue={defaultStartDate}
              />
            </div>
            <div className="space-y-2 text-sm">
              <FormFieldLabel htmlFor="req-deadline" fieldKey="requests.deadline" label="Deadline">
                Deadline
              </FormFieldLabel>
              <input
                id="req-deadline"
                name="deadline"
                type="date"
                className={fieldClass}
                defaultValue={defaultDeadline}
              />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <FormFieldLabel
              htmlFor="req-requirements"
              fieldKey="requests.requirements"
              label="Requirements"
            >
              Requirements (one per line)
            </FormFieldLabel>
            <textarea
              id="req-requirements"
              name="requirements"
              rows={4}
              className={fieldClass}
              placeholder="Must-haves, integrations, constraints…"
            />
          </div>
        </WebPanel>

        <div className="h-20" aria-hidden />
        <div
          className={cn(
            webStickyActionBarClass,
            'lg:left-[var(--sidebar-width,16rem)]',
            'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
          )}
        >
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={routes.requests}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={pending} className={webPrimaryButtonClass}>
              {pending ? 'Saving…' : 'Save draft'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
