'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from '@nestlancer/ui';

import Link from 'next/link';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import { useAuth } from '@nestlancer/auth';
import { safeNavigationUrl } from '@nestlancer/utils';
import { profileUpdateSchema } from '@nestlancer/validators';
import { Button, cn, ErrorState, Input, PageHeader, Skeleton, SkeletonText } from '@nestlancer/ui';
import { ArrowLeft } from '@nestlancer/ui/icons';

import { FormFieldLabel } from '@nestlancer/field-help';
import { apiServices } from '@/lib/axios';
import { coerceAuthUser } from '@/lib/auth-user';
import {
  webPrimaryButtonClass,
  webSectionClass,
  webStickyActionBarClass,
} from '@/lib/tailadmin-classes';

function normalizePhoneForStorage(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\+[1-9]\d{1,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return trimmed;
}

function initials(first?: string, last?: string, email?: string) {
  const a = first?.[0];
  const b = last?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  if (a) return a.toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export function ProfileEditClient() {
  const qc = useQueryClient();
  const { setUser } = useAuth();
  const q = useQuery({
    queryKey: queryKeys.users.profile,
    queryFn: () => apiServices.users.getProfile(),
  });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');

  useEffect(() => {
    if (!q.data) return;
    setFirstName(q.data.firstName ?? '');
    setLastName(q.data.lastName ?? '');
    setPhone(q.data.phone ?? '');
    setHeadline(q.data.headline ?? '');
    setBio(q.data.bio ?? '');
    setSkills((q.data.skills ?? []).join(', '));
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      apiServices.users.updateProfile({
        firstName,
        lastName,
        phone: normalizePhoneForStorage(phone),
        headline,
        bio,
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: (updated) => {
      setUser(coerceAuthUser(updated));
      toast.success('Profile updated');
      void qc.invalidateQueries({ queryKey: queryKeys.users.profile });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Update failed')),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => apiServices.users.uploadAvatar(file),
    onSuccess: () => {
      toast.success('Photo updated');
      void qc.invalidateQueries({ queryKey: queryKeys.users.profile });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not upload photo')),
  });

  const removeAvatar = useMutation({
    mutationFn: () => apiServices.users.removeAvatar(),
    onSuccess: () => {
      toast.success('Photo removed');
      void qc.invalidateQueries({ queryKey: queryKeys.users.profile });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not remove photo')),
  });

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-24 rounded-full" />
        <SkeletonText lines={4} />
      </div>
    );
  }
  if (q.isError) {
    return (
      <ErrorState
        title="Could not load profile"
        message={getApiErrorMessage(q.error)}
        onRetry={() => void q.refetch()}
      />
    );
  }

  const u = q.data;
  const showAvatar = safeNavigationUrl(u.avatarUrl != null ? String(u.avatarUrl) : null);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href={routes.profile}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to profile
      </Link>
      <PageHeader
        title="Edit profile"
        description="Update how your profile reads to clients and collaborators."
      />
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = profileUpdateSchema.safeParse({
            firstName,
            lastName,
            phone: phone.trim() || undefined,
            headline: headline.trim() || undefined,
            bio: bio.trim() || undefined,
            skills: skills
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          });
          if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
            return;
          }
          save.mutate();
        }}
      >
        <div className={webSectionClass}>
          <h2 className="text-sm font-semibold text-foreground">Photo</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG or PNG. Shown on your public profile.
          </p>
          <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {showAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={showAvatar}
                alt=""
                className="h-24 w-24 rounded-2xl border border-border/60 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/15 font-display text-xl font-semibold text-primary ring-1 ring-primary/20">
                {initials(firstName, lastName, u.email)}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAvatar.mutate(file);
                    e.target.value = '';
                  }}
                />
                <span className="inline-flex h-10 items-center rounded-xl border border-border/80 bg-background px-4 text-sm font-semibold shadow-sm transition-theme hover:bg-accent/50">
                  {uploadAvatar.isPending ? 'Uploading…' : 'Upload'}
                </span>
              </label>
              {showAvatar ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={removeAvatar.isPending}
                  onClick={() => removeAvatar.mutate()}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className={`${webSectionClass} space-y-4`}>
          <div className="space-y-2">
            <FormFieldLabel
              htmlFor="profile-first-name"
              fieldKey="profile.firstName"
              label="First name"
            >
              First name
            </FormFieldLabel>
            <Input
              id="profile-first-name"
              className="mt-1.5 h-11 rounded-xl border-border/80 bg-background/80"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-2">
            <FormFieldLabel
              htmlFor="profile-last-name"
              fieldKey="profile.lastName"
              label="Last name"
            >
              Last name
            </FormFieldLabel>
            <Input
              id="profile-last-name"
              className="mt-1.5 h-11 rounded-xl border-border/80 bg-background/80"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Your last name"
              autoComplete="family-name"
            />
          </div>
          <div className="space-y-2">
            <FormFieldLabel htmlFor="profile-phone" fieldKey="profile.phone" label="Mobile number">
              Mobile number
            </FormFieldLabel>
            <Input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              className="mt-1.5 h-11 rounded-xl border-border/80 bg-background/80"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used to pre-fill Razorpay checkout. Indian mobile required for INR payments.
            </p>
          </div>
          <div className="space-y-2">
            <FormFieldLabel htmlFor="profile-headline" fieldKey="profile.headline" label="Headline">
              Headline
            </FormFieldLabel>
            <Input
              id="profile-headline"
              className="mt-1.5 h-11 rounded-xl border-border/80 bg-background/80"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Founder at a D2C brand"
            />
          </div>
          <div className="space-y-2">
            <FormFieldLabel htmlFor="profile-bio" fieldKey="profile.bio" label="Bio">
              Bio
            </FormFieldLabel>
            <textarea
              id="profile-bio"
              rows={4}
              className="mt-1.5 w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short intro for your profile"
            />
          </div>
          <div className="space-y-2">
            <FormFieldLabel htmlFor="profile-skills" fieldKey="profile.skills" label="Skills">
              Skills (comma-separated)
            </FormFieldLabel>
            <Input
              id="profile-skills"
              className="mt-1.5 h-11 rounded-xl border-border/80 bg-background/80"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Shopify, SEO, branding"
            />
          </div>
        </div>

        <div className="h-16" aria-hidden />
        <div
          className={cn(
            webStickyActionBarClass,
            'lg:left-[var(--sidebar-width,16rem)]',
            'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
          )}
        >
          <div className="mx-auto flex max-w-dashboard justify-end">
            <Button
              type="submit"
              className={cn('h-10 rounded-lg px-5 font-semibold', webPrimaryButtonClass)}
              disabled={save.isPending}
            >
              {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
