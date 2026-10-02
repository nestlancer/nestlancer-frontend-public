'use client';

import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Textarea, toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { resolveTurnstileToken } from '@nestlancer/constants';
import { FormFieldLabel } from '@nestlancer/field-help';

import { TurnstileWidget } from '@/components/security/TurnstileWidget';
import { apiServices } from '@/lib/axios';

const CONTACT_SUBJECTS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'SALES', label: 'Sales' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
] as const;

type ContactSubject = (typeof CONTACT_SUBJECTS)[number]['value'];

export function ContactFormClient() {
  const searchParams = useSearchParams();
  const refPortfolioId = searchParams.get('ref');
  const serviceSlug = searchParams.get('service');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<ContactSubject>(serviceSlug ? 'SALES' : 'GENERAL');
  const [message, setMessage] = useState(() =>
    serviceSlug ? `I'm interested in the “${serviceSlug}” package.\n\n` : ''
  );
  const [refTitle, setRefTitle] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const onTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  useEffect(() => {
    if (!refPortfolioId) return;
    void apiServices.portfolio
      .getByIdOrSlug(refPortfolioId)
      .then((item) => setRefTitle(item.title))
      .catch(() => setRefTitle(null));
  }, [refPortfolioId]);

  const submit = useMutation({
    mutationFn: () => {
      let token: string;
      try {
        token = resolveTurnstileToken(turnstileToken);
      } catch {
        throw new Error('Security verification is required. Retry the check, then try again.');
      }
      return apiServices.contact.createInquiry({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        turnstileToken: token,
        subject,
        referencePortfolioItemId: refPortfolioId ?? undefined,
      });
    },
    onSuccess: () => {
      toast.success('Message sent. We will get back to you soon.');
      setName('');
      setEmail('');
      setSubject('GENERAL');
      setMessage('');
      setTurnstileToken(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not send message')),
  });

  return (
    <form
      className="min-w-0 space-y-6 overflow-x-clip"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !message.trim()) {
          toast.error('Please fill in all fields');
          return;
        }
        submit.mutate();
      }}
    >
      {refPortfolioId && refTitle ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          Interested in work similar to: <span className="font-medium">{refTitle}</span>
        </p>
      ) : null}
      {serviceSlug ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          Service inquiry: <span className="font-medium">{serviceSlug}</span>
        </p>
      ) : null}

      <div className="space-y-2">
        <FormFieldLabel htmlFor="contact-name" fieldKey="contact.name" label="Your name" required>
          Your name
        </FormFieldLabel>
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <FormFieldLabel htmlFor="contact-email" fieldKey="contact.email" label="Email" required>
          Email
        </FormFieldLabel>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          maxLength={254}
        />
      </div>
      <div className="space-y-2">
        <FormFieldLabel
          htmlFor="contact-subject"
          fieldKey="contact.subject"
          label="Subject"
          required
        >
          Subject
        </FormFieldLabel>
        <select
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value as ContactSubject)}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/25"
        >
          {CONTACT_SUBJECTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <FormFieldLabel
          htmlFor="contact-message"
          fieldKey="contact.message"
          label="Message"
          required
        >
          Message
        </FormFieldLabel>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your project, timeline, and budget…"
          rows={6}
          required
          maxLength={5000}
        />
      </div>
      <TurnstileWidget onToken={onTurnstileToken} />
      <Button type="submit" disabled={submit.isPending} className="w-full sm:w-auto">
        {submit.isPending ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
