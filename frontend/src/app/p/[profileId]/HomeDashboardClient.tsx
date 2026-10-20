/*
 * Yarvelle — Personal & Family AI Assistant Application
 * Copyright 2026 Spectrayan (https://spectrayan.com)
 *
 * Licensed under the PolyForm Noncommercial License 1.0.0 and the
 * Yarvelle Additional Terms (see LICENSE and ADDITIONAL-TERMS.md).
 * Personal and household local use only. Commercial use, hosted service
 * offering, rebranding, white-labeling, and redistribution of modified
 * forks are prohibited without a written commercial license from Spectrayan.
 *
 * Required Notice: Copyright 2026 Spectrayan (https://spectrayan.com)
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Sparkles,
  MessageSquare,
  Printer,
  FileText,
  Lock,
  ChevronRight,
  Check,
  Edit3,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, type MemberColorSlot } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@yarvelle/ui';
import type { SlotProps } from '@yarvelle/ui/slots';
import { ProfileEditModal } from '@/components/family/ProfileEditModal';
import {
  getHouseholdProfile,
  loadHouseholdProfiles,
  fetchHouseholdProfiles,
  type HouseholdProfile,
  type AudienceBand,
  deriveAudienceBand,
  HOUSEHOLD_PROFILES_CHANGED_EVENT,
} from '@/lib/familyProfiles';
import { useAuth } from '@/lib/auth';
import { profilePath } from '@/lib/routes';
import { useI18n } from '@/i18n';
import {
  getAllSlotContributions,
  filterSlotContributions,
} from '@/pack-registry.generated';

export type CareProfile = HouseholdProfile;

export interface UpcomingAppointment {
  id: string;
  title: string;
  monthShort: string;
  dayNumber: number;
  timeStr: string;
  clinician: string;
  clinic: string;
  linkedDocTitle?: string;
  specialistId?: string;
  specialistTitle?: string;
  prepCompletedQuestions: number;
  prepTotalQuestions: number;
  checklist: Array<{
    id: string;
    text: string;
    isDone: boolean;
  }>;
  savedToNotesTimestamp?: string;
}

export interface SuggestedStarter {
  label: string;
  prompt: string;
  domain: 'health' | 'finance' | 'education' | 'household';
  audiences?: AudienceBand[];
}

export const DEFAULT_SAMPLE_APPOINTMENT: UpcomingAppointment = {
  id: 'appt-cardio',
  title: 'Cardiology follow-up',
  monthShort: 'OCT',
  dayNumber: 24,
  timeStr: 'Tuesday 10:30 AM',
  clinician: 'Dr. Elena Whitfield · Cardiology',
  clinic: 'Lakeside Heart Clinic',
  linkedDocTitle: 'Discharge summary, Sep 2',
  specialistId: 'cardiology-guide',
  specialistTitle: 'Cardiology Guide',
  prepCompletedQuestions: 1,
  prepTotalQuestions: 4,
  checklist: [
    { id: 'item_1', text: 'Questions for cardiologist ready', isDone: true },
    { id: 'item_2', text: 'Bring current medication list and BP log', isDone: false },
    { id: 'item_3', text: 'Bring prior auth approval letter', isDone: false },
    { id: 'item_4', text: 'Note recent symptom dates and trigger patterns', isDone: false },
  ],
  savedToNotesTimestamp: 'Saved to Notes · 2 hours ago',
};

export const DOMAIN_SUGGESTED_STARTERS: SuggestedStarter[] = [
  {
    label: 'Prepare for cardiologist visit',
    prompt: 'Prepare questions for cardiologist visit on Tuesday',
    domain: 'health',
    audiences: ['adult', 'teen'],
  },
  {
    label: 'Review recent bills & EOB',
    prompt: 'Review recent medical bills and insurance statements',
    domain: 'finance',
    audiences: ['adult'],
  },
  {
    label: 'Prepare school conference',
    prompt: 'Prepare parent-teacher conference questions and study milestones',
    domain: 'education',
    audiences: ['adult', 'teen', 'child'],
  },
  {
    label: 'Plan weekly meals & chores',
    prompt: 'Plan nut-free weekly dinner menu and grocery list',
    domain: 'household',
    audiences: ['adult', 'teen', 'child'],
  },
];

export const DEFAULT_SCOPES = [
  'health.clinical',
  'health.paperwork',
  'finance.bills',
  'finance.budget',
  'finance.accounts',
  'education.calendar',
  'education.assignments',
  'education.reading',
  'education.forms',
  'household.calendar',
  'household.governance',
  'household.chores',
  'household.meals',
  'household.maintenance',
  'household.travel',
];

export const PACK_FILTERS = [
  { id: 'all', label: 'All Packs' },
  { id: 'health', label: 'Health Pack' },
  { id: 'finance', label: 'Finance Pack' },
  { id: 'education', label: 'Education Pack' },
  { id: 'household', label: 'Household Pack' },
] as const;

export const AUDIENCE_OPTIONS: { id: AudienceBand; label: string }[] = [
  { id: 'adult', label: 'Adult Steward' },
  { id: 'teen', label: 'Teen (13–17)' },
  { id: 'child', label: 'Child (<13)' },
];

export interface HomeDashboardClientProps {
  profileId?: string;
  profile?: CareProfile;
  initialProfile?: CareProfile;
  initialAppointment?: UpcomingAppointment | null;
  isEmpty?: boolean;
}

export function HomeDashboardClient({
  profileId: profileIdProp,
  profile: profileProp,
  initialProfile,
  initialAppointment,
  isEmpty = false,
}: HomeDashboardClientProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { t } = useI18n();
  const [askDraft, setAskDraft] = useState('');
  const [profileOverride, setProfileOverride] = useState<CareProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [audience, setAudience] = useState<AudienceBand>('adult');
  const [selectedPack, setSelectedPack] = useState<string>('all');
  const [backendStatus, setBackendStatus] = useState<{ status: string; version?: string } | null>(null);

  useEffect(() => {
    setHasMounted(true);
    fetchHouseholdProfiles().catch(() => {});
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.status) setBackendStatus(data);
      })
      .catch(() => {});
  }, []);

  const resolvedInitialProfile = profileProp || initialProfile;
  const profileId = profileIdProp || resolvedInitialProfile?.id || 'me';

  useEffect(() => {
    const handleProfilesChange = () => {
      const updated = getHouseholdProfile(profileId);
      if (updated) {
        setProfileOverride(updated);
      }
    };
    window.addEventListener(HOUSEHOLD_PROFILES_CHANGED_EVENT, handleProfilesChange);
    return () => {
      window.removeEventListener(HOUSEHOLD_PROFILES_CHANGED_EVENT, handleProfilesChange);
    };
  }, [profileId]);

  // Resolved Profile Info
  const baseProfile: CareProfile = useMemo(() => {
    if (resolvedInitialProfile) return resolvedInitialProfile;
    const userFallbackName = hasMounted
      ? user?.full_name?.trim() || user?.username?.trim() || 'Leo'
      : 'Leo';
    const userShortName =
      hasMounted && user?.full_name
        ? user.full_name.trim().split(/\s+/)[0]
        : hasMounted && user?.username
        ? user.username
        : 'Leo';

    const household = hasMounted ? getHouseholdProfile(profileId) : undefined;
    if (household) {
      const isSelf =
        household.role === 'self' ||
        household.relationship?.toLowerCase() === 'self' ||
        profileId === 'me';
      const resolvedName =
        isSelf && (household.name === 'Me' || !household.name)
          ? userFallbackName
          : household.name;
      const resolvedShortName =
        household.shortName || (resolvedName ? resolvedName.split(/\s+/)[0] : userShortName);
      return {
        id: household.id,
        name: resolvedName,
        shortName: resolvedShortName,
        relationship: household.relationship || 'Self',
        role: household.role || 'self',
        colorSlot: household.colorSlot || 1,
        dateOfBirth: household.dateOfBirth,
        avatarUrl: household.avatarUrl,
        viewers: household.viewers,
        age: household.age,
        audience: household.audience,
      };
    }

    return {
      id: profileId,
      name: profileId === 'me' ? userFallbackName : profileId,
      shortName: profileId === 'me' ? userShortName : profileId,
      relationship: 'Self',
      role: 'self',
      colorSlot: 1,
      audience: 'adult',
    };
  }, [resolvedInitialProfile, profileId, user, hasMounted]);

  const profile: CareProfile = profileOverride || baseProfile;

  const displayName = useMemo(() => {
    const currentName = profile.name?.trim();
    if (currentName && currentName.toLowerCase() !== 'me') {
      return currentName;
    }
    if (hasMounted && user?.full_name?.trim()) {
      return user.full_name.trim();
    }
    if (hasMounted && user?.username?.trim()) {
      return user.username.trim();
    }
    return 'Leo';
  }, [profile.name, user?.full_name, user?.username, hasMounted]);

  // Handle audience switcher clicks
  const handleAudienceChange = (newAudience: AudienceBand) => {
    setAudience(newAudience);
    const profiles = loadHouseholdProfiles();
    const match = profiles.find(
      (p) => (p.audience || deriveAudienceBand(p.age, p.role)) === newAudience
    );
    if (match) {
      setProfileOverride(match);
    }
  };

  // Appointment Data
  const appointment: UpcomingAppointment | null = useMemo(() => {
    if (isEmpty) return null;
    if (initialAppointment !== undefined) return initialAppointment;
    return DEFAULT_SAMPLE_APPOINTMENT;
  }, [isEmpty, initialAppointment]);

  const [checklist, setChecklist] = useState(() => appointment?.checklist || []);

  useEffect(() => {
    if (appointment?.checklist) {
      setChecklist(appointment.checklist);
    }
  }, [appointment?.checklist]);

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isDone: !item.isDone } : item))
    );
  };

  const completedQuestions = checklist.filter((item) => item.isDone).length;
  const totalQuestions = checklist.length || appointment?.prepTotalQuestions || 1;
  const prepPercent = Math.round((completedQuestions / totalQuestions) * 100);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  }, [t]);

  const handleAskSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!askDraft.trim()) return;
    router.push(profilePath(profile.id, `chat?prompt=${encodeURIComponent(askDraft.trim())}`));
  };

  const visibleStarters = useMemo(() => {
    return DOMAIN_SUGGESTED_STARTERS.filter(
      (starter) => !starter.audiences || starter.audiences.includes(audience)
    );
  }, [audience]);

  const dashboardSlots = filterSlotContributions(getAllSlotContributions(), {
    slot: 'dashboard.card',
    audience,
    activeScopes: DEFAULT_SCOPES,
    enabledPacks: selectedPack === 'all' ? undefined : [selectedPack],
  });

  if (isLoading) {
    return (
      <div
        className="space-y-6 animate-pulse p-4"
        data-testid="dashboard-loading"
        aria-busy="true"
      >
        <div className="h-28 bg-[var(--cf-surface)] rounded-2xl border border-[var(--cf-border)]" />
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          <div className="h-64 bg-[var(--cf-surface)] rounded-2xl border border-[var(--cf-border)]" />
          <div className="h-64 bg-[var(--cf-surface)] rounded-2xl border border-[var(--cf-border)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Person Greeting Hero */}
      <section
        aria-label="Person hero"
        className="flex flex-col gap-5 p-4 sm:p-6 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => setIsEditModalOpen(true)}
              title="Click to edit profile"
              role="button"
              tabIndex={0}
              aria-label="Edit care profile"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsEditModalOpen(true);
                }
              }}
            >
              <Avatar
                name={displayName}
                src={profile.avatarUrl}
                colorSlot={profile.colorSlot}
                size="xl"
                className="shrink-0 transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-full bg-black/35 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  suppressHydrationWarning
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--cf-fg)]"
                >
                  {greeting}, {displayName}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  aria-label="Edit profile"
                  title="Edit profile"
                  className="p-1 rounded-lg text-[var(--cf-fg-subtle)] hover:text-[var(--cf-fg)] hover:bg-[var(--cf-surface-2)] transition"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {backendStatus && (
                  <span
                    data-testid="backend-status-pill"
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--cf-success-bg)] text-[var(--cf-success-fg)] border border-[var(--cf-success-border)]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--cf-success-fg)] animate-pulse" />
                    Runtime {backendStatus.version || 'Online'}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[var(--cf-fg-muted)] mt-1">
                {profile.role ? `${profile.role} · ` : ''}
                {profile.relationship}
                {profile.age ? ` · ${profile.age}` : ''}
                {profile.audience ? ` · ${profile.audience}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Profile Audience Switcher */}
            <div className="flex items-center gap-1.5 bg-[var(--cf-surface-2)] p-1.5 rounded-xl border border-[var(--cf-border)]">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAudienceChange(opt.id)}
                  data-testid={`audience-btn-${opt.id}`}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px]',
                    audience === opt.id
                      ? 'bg-primary text-primary-fg shadow-sm'
                      : 'text-[var(--cf-fg-muted)] hover:bg-[var(--cf-surface-3)] hover:text-[var(--cf-fg)]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              leftIcon={<Edit3 className="w-3.5 h-3.5 text-primary" />}
              className="min-h-[44px]"
            >
              {t('home.manageProfile')}
            </Button>

            <Chip
              size="md"
              variant="neutral"
              icon={<Lock className="w-3.5 h-3.5 text-[var(--cf-fg-subtle)]" />}
            >
              {t('home.privateOnComputer', { name: displayName })}
            </Chip>
          </div>
        </div>

        {/* Domain Pack Filter Bar */}
        <div
          className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--cf-border)]"
          role="group"
          aria-label="Domain pack filters"
        >
          {PACK_FILTERS.map((pack) => {
            const active = selectedPack === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelectedPack(pack.id)}
                data-testid={`pack-filter-${pack.id}`}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium border transition min-h-[36px]',
                  active
                    ? 'bg-primary text-primary-fg border-primary shadow-sm'
                    : 'bg-[var(--cf-surface-2)] text-[var(--cf-fg-muted)] border-[var(--cf-border)] hover:bg-[var(--cf-surface-3)] hover:text-[var(--cf-fg)]'
                )}
              >
                {pack.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Main Asymmetric Two-Column Grid: Next Visit vs Ask about Person */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Next Visit & Priority Preparation Card */}
        <section
          aria-labelledby="section-next-visit"
          className="flex flex-col justify-between p-6 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] shadow-sm"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--cf-border)]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 id="section-next-visit" className="text-base font-semibold text-[var(--cf-fg)]">
                {t('home.nextVisitPrep')}
              </h2>
            </div>
            <Link
              href={profilePath(profile.id, 'appointments')}
              className="text-xs font-semibold text-[var(--cf-primary-hover)] hover:underline"
            >
              {t('home.allVisits')}
            </Link>
          </div>

          {appointment ? (
            <div className="space-y-4">
              {/* Date Badge & Appointment Details */}
              <div className="flex items-start gap-4">
                <div
                  aria-hidden="true"
                  className="w-14 h-14 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] flex flex-col items-center justify-center shrink-0 shadow-sm"
                >
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    {appointment.monthShort}
                  </span>
                  <span className="text-xl font-bold text-[var(--cf-fg)] leading-none">
                    {appointment.dayNumber}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[var(--cf-fg)] truncate">
                    {appointment.title}
                  </h3>
                  <p className="text-xs text-[var(--cf-fg-muted)] mt-0.5">
                    <span>{appointment.timeStr}</span> · <span>{appointment.clinician}</span> ·{' '}
                    <span>{appointment.clinic}</span>
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {appointment.linkedDocTitle && (
                      <Chip size="sm" variant="neutral" icon={<FileText className="w-3 h-3" />}>
                        {appointment.linkedDocTitle}
                      </Chip>
                    )}
                    {appointment.specialistTitle && (
                      <Chip size="sm" variant="selected" icon={<Sparkles className="w-3 h-3" />}>
                        {appointment.specialistTitle}
                      </Chip>
                    )}
                  </div>
                </div>
              </div>

              {/* Prep Sheet Progress & Checklist */}
              <div className="p-4 rounded-xl bg-[var(--cf-surface-2)] border border-[var(--cf-border)] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--cf-fg)]">
                    {t('home.prepSheet')}
                  </span>
                  <span className="text-[var(--cf-fg-subtle)]">
                    {t('home.questionsReady', {
                      completed: completedQuestions,
                      total: totalQuestions,
                    })}
                  </span>
                </div>

                {/* Accessible Progress Bar */}
                <div
                  role="progressbar"
                  aria-valuenow={prepPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Visit preparation progress"
                  className="w-full h-2 rounded-full bg-[var(--cf-surface-3)] overflow-hidden"
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${prepPercent}%` }}
                  />
                </div>

                {/* Checklist Preview */}
                <div className="space-y-2 pt-1">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      role="checkbox"
                      tabIndex={0}
                      aria-checked={item.isDone}
                      onClick={() => handleToggleChecklist(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          handleToggleChecklist(item.id);
                        }
                      }}
                      className="flex items-start gap-2.5 text-xs cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[var(--cf-focus)] p-1 rounded-lg hover:bg-[var(--cf-surface-3)] transition-colors"
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors',
                          item.isDone
                            ? 'bg-primary border-primary text-primary-fg'
                            : 'border-[var(--cf-border-strong)] bg-[var(--cf-surface)]'
                        )}
                      >
                        {item.isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span
                        className={cn(
                          'flex-1 text-[var(--cf-fg)]',
                          item.isDone && 'line-through text-[var(--cf-fg-muted)]'
                        )}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions & Provenance */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                    onClick={() =>
                      router.push(
                        profilePath(
                          profile.id,
                          `chat?agent=${encodeURIComponent(
                            appointment.specialistId || 'visit-steward'
                          )}`
                        )
                      )
                    }
                  >
                    {t('home.continuePrep')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Printer className="w-4 h-4" />}
                    onClick={() => {
                      if (typeof window !== 'undefined' && typeof window.print === 'function') {
                        window.print();
                      }
                    }}
                  >
                    {t('home.printPrepSheet')}
                  </Button>
                </div>

                {appointment.savedToNotesTimestamp && (
                  <span className="text-xs text-[var(--cf-fg-subtle)]">
                    {appointment.savedToNotesTimestamp}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Calendar className="w-6 h-6 text-primary" />}
              title={t('home.noUpcomingVisitsTitle')}
              description={t('home.noUpcomingVisitsDesc')}
              action={{
                label: t('home.prepareWithSteward'),
                onClick: () => router.push(profilePath(profile.id, 'chat?agent=visit-steward')),
              }}
            />
          )}
        </section>

        {/* "Ask Yarvelle about [Person]" Hero Trigger Card */}
        <section
          aria-labelledby="section-ask"
          className="flex flex-col justify-between p-6 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] shadow-sm"
        >
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[var(--cf-border)]">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 id="section-ask" className="text-base font-semibold text-[var(--cf-fg)]">
                {t('home.askAboutPerson', { name: displayName })}
              </h2>
            </div>

            <form onSubmit={handleAskSubmit} className="space-y-3">
              <textarea
                aria-label={`Ask Yarvelle about ${displayName}`}
                placeholder={`Ask anything about ${displayName.split(' ')[0]}'s health, paperwork, or visits...`}
                value={askDraft}
                onChange={(e) => setAskDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskSubmit();
                  }
                }}
                className="w-full h-24 p-3 text-xs sm:text-sm rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] placeholder:text-[var(--cf-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] resize-none"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={!askDraft.trim()}
                  data-testid="ask-helper-btn"
                >
                  {t('home.askHelper')}
                </Button>
              </div>
            </form>

            {/* Domain-Aware Quick Starters */}
            <div className="space-y-2 mt-4 pt-3 border-t border-[var(--cf-border)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--cf-fg-subtle)] block">
                {t('home.suggestedStarters')}
              </span>
              {visibleStarters.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  onClick={() => setAskDraft(starter.prompt)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] hover:bg-[var(--cf-surface-3)] text-start text-xs text-[var(--cf-fg)] font-medium transition min-h-[44px]"
                >
                  <span className="truncate">{starter.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--cf-fg-subtle)] shrink-0 ms-2" />
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 3. Contributed Pack Slot Cards Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        data-testid="dashboard-slots-grid"
      >
        {dashboardSlots.map((slot) => {
          const Component = RICH_HEALTH_SLOT_CARDS[slot.id] ?? slot.component;
          if (!Component) return null;
          return (
            <div
              key={slot.id}
              data-slot-id={slot.id}
              className="transition hover:-translate-y-0.5 duration-150"
            >
              <Component profileId={profile.id} scopes={DEFAULT_SCOPES} />
            </div>
          );
        })}
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSaved={(updated) => setProfileOverride(updated)}
      />
    </div>
  );
}

const RICH_HEALTH_SLOT_CARDS: Record<string, React.ComponentType<SlotProps>> = {
  'health.vitals.card': function RichVitalsCard({ profileId }: SlotProps) {
    const targetId = profileId || 'self';
    return (
      <Card data-testid="health-vitals-card" data-profile-id={profileId} className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Vitals & Biometrics</CardTitle>
            <Badge variant="success">Recorded</Badge>
          </div>
          <CardDescription>Blood pressure, resting heart rate, glucose, and lab trends.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl p-3 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)]">
              <div className="flex items-center justify-between text-xs text-[color:var(--ui-color-fg-muted)]">
                <span>Blood Pressure</span>
                <Badge variant="success">Normal</Badge>
              </div>
              <div className="mt-1.5 text-lg font-bold text-[color:var(--ui-color-fg-default)]">
                118/76 <span className="text-xs font-normal text-[color:var(--ui-color-fg-muted)]">mmHg</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[color:var(--ui-color-fg-subtle)]">Today · 08:15 AM</div>
            </div>
            <div className="rounded-xl p-3 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)]">
              <div className="flex items-center justify-between text-xs text-[color:var(--ui-color-fg-muted)]">
                <span>Resting HR</span>
                <Badge variant="success">Steady</Badge>
              </div>
              <div className="mt-1.5 text-lg font-bold text-[color:var(--ui-color-fg-default)]">
                62 <span className="text-xs font-normal text-[color:var(--ui-color-fg-muted)]">bpm</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[color:var(--ui-color-fg-subtle)]">7-day avg · 64 bpm</div>
            </div>
            <div className="rounded-xl p-3 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)]">
              <div className="flex items-center justify-between text-xs text-[color:var(--ui-color-fg-muted)]">
                <span>Fasting Glucose</span>
                <Badge variant="info">In Range</Badge>
              </div>
              <div className="mt-1.5 text-lg font-bold text-[color:var(--ui-color-fg-default)]">
                94 <span className="text-xs font-normal text-[color:var(--ui-color-fg-muted)]">mg/dL</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[color:var(--ui-color-fg-subtle)]">HbA1c · 5.3%</div>
            </div>
            <div className="rounded-xl p-3 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)]">
              <div className="flex items-center justify-between text-xs text-[color:var(--ui-color-fg-muted)]">
                <span>SpO₂ & Weight</span>
                <Badge variant="default">Synced</Badge>
              </div>
              <div className="mt-1.5 text-lg font-bold text-[color:var(--ui-color-fg-default)]">
                99% <span className="text-xs font-normal text-[color:var(--ui-color-fg-muted)]">· 164 lb</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[color:var(--ui-color-fg-subtle)]">Withings + HealthKit</div>
            </div>
          </div>
          <div className="pt-2 border-t border-[color:var(--ui-color-border-subtle)] flex items-center justify-between text-xs">
            <span className="text-[color:var(--ui-color-fg-muted)]">14 readings this week</span>
            <Link
              href={`/p/${encodeURIComponent(targetId)}/vitals`}
              className="font-semibold text-[color:var(--ui-color-action-primary-bg)] hover:underline"
            >
              Open Vitals Hub →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  },
  'health.appointments.card': function RichAppointmentsCard({ profileId }: SlotProps) {
    const targetId = profileId || 'self';
    return (
      <Card data-testid="health-appointments-card" data-profile-id={profileId} className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Upcoming Care & Visits</CardTitle>
            <Badge variant="info">2 Scheduled</Badge>
          </div>
          <CardDescription>Clinical specialist visits, prep dossiers, and follow-up checklists.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-2.5">
          <div className="space-y-2">
            <div className="rounded-xl p-3 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[color:var(--ui-color-fg-default)]">
                  Cardiology Follow-up · Dr. E. Whitfield
                </span>
                <Badge variant="info">Oct 24</Badge>
              </div>
              <p className="mt-1 text-xs text-[color:var(--ui-color-fg-muted)]">
                Lakeside Heart Clinic · 10:30 AM · Prep dossier 75% ready
              </p>
            </div>
            <div className="rounded-xl p-3 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[color:var(--ui-color-fg-default)]">
                  Annual Preventive Physical · Dr. M. Patel
                </span>
                <Badge variant="default">Nov 12</Badge>
              </div>
              <p className="mt-1 text-xs text-[color:var(--ui-color-fg-muted)]">
                Primary Care Associates · 09:00 AM · Fasting lipid panel ordered
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-[color:var(--ui-color-border-subtle)] flex items-center justify-between text-xs">
            <span className="text-[color:var(--ui-color-fg-muted)]">Synced with Calendar (.ics)</span>
            <Link
              href={`/p/${encodeURIComponent(targetId)}/appointments`}
              className="font-semibold text-[color:var(--ui-color-action-primary-bg)] hover:underline"
            >
              Manage Visits →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  },
  'health.preventive.card': function RichPreventiveCard({ profileId }: SlotProps) {
    const targetId = profileId || 'self';
    return (
      <Card data-testid="health-preventive-card" data-profile-id={profileId} className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Preventive Guidelines</CardTitle>
            <Badge variant="success">4 / 5 Up to Date</Badge>
          </div>
          <CardDescription>USPSTF preventive screenings, annual physicals, and immunization tracking.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-2.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)] text-xs">
              <span className="font-medium text-[color:var(--ui-color-fg-default)]">Annual Lipid & Metabolic Panel</span>
              <Badge variant="warn">Due Nov 2026</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)] text-xs">
              <span className="font-medium text-[color:var(--ui-color-fg-default)]">Influenza & Seasonal Booster</span>
              <Badge variant="success">Completed</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)] text-xs">
              <span className="font-medium text-[color:var(--ui-color-fg-default)]">Dental & Vision Preventive Exam</span>
              <Badge variant="success">Completed</Badge>
            </div>
          </div>
          <div className="pt-2 border-t border-[color:var(--ui-color-border-subtle)] flex items-center justify-between text-xs">
            <span className="text-[color:var(--ui-color-fg-muted)]">USPSTF Grade A/B rules</span>
            <Link
              href={`/p/${encodeURIComponent(targetId)}/appointments`}
              className="font-semibold text-[color:var(--ui-color-action-primary-bg)] hover:underline"
            >
              View Checklist →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  },
  'health.school-forms.card': function RichSchoolFormsCard({ profileId }: SlotProps) {
    const targetId = profileId || 'self';
    return (
      <Card data-testid="health-school-forms-card" data-profile-id={profileId} className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Health & Immunization Forms</CardTitle>
            <Badge variant="info">2 Active</Badge>
          </div>
          <CardDescription>Vaccination records, sports physical clearance, and camp health forms.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-2.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl px-3 py-2.5 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)] text-xs">
              <div>
                <div className="font-semibold text-[color:var(--ui-color-fg-default)]">Varsity Athletics PPE Clearance</div>
                <div className="text-[11px] text-[color:var(--ui-color-fg-muted)]">Signed by Dr. Patel · Valid through Aug 2027</div>
              </div>
              <Badge variant="success">Verified</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl px-3 py-2.5 border border-[color:var(--ui-color-border-subtle)] bg-[color:var(--ui-color-bg-subtle)] text-xs">
              <div>
                <div className="font-semibold text-[color:var(--ui-color-fg-default)]">State Certificate of Immunization</div>
                <div className="text-[11px] text-[color:var(--ui-color-fg-muted)]">SMART Health Card (.smart-health-card)</div>
              </div>
              <Badge variant="info">Prefilled</Badge>
            </div>
          </div>
          <div className="pt-2 border-t border-[color:var(--ui-color-border-subtle)] flex items-center justify-between text-xs">
            <span className="text-[color:var(--ui-color-fg-muted)]">Ready for PDF export</span>
            <Link
              href={`/p/${encodeURIComponent(targetId)}/library`}
              className="font-semibold text-[color:var(--ui-color-action-primary-bg)] hover:underline"
            >
              Open Records →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  },
};
