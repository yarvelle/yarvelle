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

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Wallet,
  GraduationCap,
  Home,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { getSlotsFor } from '@/pack-registry.generated';
import { cn } from '@/lib/utils';

interface PackMeta {
  id: 'health' | 'finance' | 'education' | 'household';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeClass: string;
}

const DOMAIN_PACKS: PackMeta[] = [
  {
    id: 'health',
    title: 'Health & Clinical Pack',
    description:
      'Clinical visit preparation, cardiovascular & vitals tracking, medication reviews, and health insurance navigation.',
    icon: Heart,
    colorClass: 'text-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'finance',
    title: 'Finance & Bills Pack',
    description:
      'Household bills calendar, budget envelopes, Medical-Cost Bridge deductible & OOP maximum tracking, and subscriptions.',
    icon: Wallet,
    colorClass: 'text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'education',
    title: 'Education & Study Pack',
    description:
      'Academic calendar, coursework assignments, 7-day reading log streaks, Socratic concept quizzes, and school forms.',
    icon: GraduationCap,
    colorClass: 'text-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'household',
    title: 'Household Operations Pack',
    description:
      'Family schedule coordination, chore rotation with points, 7-day dinner planner with allergy tags, and handover binder.',
    icon: Home,
    colorClass: 'text-teal-600',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
];

const PACKS_STORAGE_KEY = 'yarvelle_active_packs_v1';

export default function PacksSettingsPage() {
  const [activePacks, setActivePacks] = useState<Record<string, boolean>>({
    health: true,
    finance: true,
    education: true,
    household: true,
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PACKS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActivePacks((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  const togglePack = (packId: string) => {
    setActivePacks((prev) => {
      const next = { ...prev, [packId]: !prev[packId] };
      try {
        window.localStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent('yarvelle:packs-changed', { detail: next })
        );
      } catch {}
      setFeedbackMessage(`${packId.charAt(0).toUpperCase() + packId.slice(1)} pack ${next[packId] ? 'enabled' : 'disabled'}`);
      setTimeout(() => setFeedbackMessage(null), 2500);
      return next;
    });
  };

  const slotContributions = getSlotsFor('settings.section');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[var(--cf-fg)] tracking-tight">
          Domain Pack Toggles
        </h2>
        <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
          Enable or disable domain-specific packs across your household workspace
        </p>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-[var(--cf-surface-2)] border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {feedbackMessage}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs underline hover:no-underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Domain Pack Master Switches */}
      <div className="space-y-3 pb-6 border-b border-[var(--cf-border)]">
        <h3 className="text-sm font-semibold text-[var(--cf-fg)] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--cf-fg-subtle)]" />
          <span>Active Household Domain Packs</span>
        </h3>
        <p className="text-xs text-[var(--cf-fg-muted)]">
          Disabling a pack hides its navigation items and cards without deleting underlying records.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {DOMAIN_PACKS.map((pack) => {
            const Icon = pack.icon;
            const isEnabled = activePacks[pack.id] ?? true;

            return (
              <div
                key={pack.id}
                className="p-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[var(--cf-surface)] border border-[var(--cf-border)] shrink-0 mt-0.5">
                    <Icon className={cn('w-5 h-5', pack.colorClass)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[var(--cf-fg)]">
                        {pack.title}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                          pack.badgeClass
                        )}
                      >
                        {pack.id}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--cf-fg-muted)] mt-1 leading-relaxed">
                      {pack.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  data-testid={`pack-toggle-${pack.id}`}
                  onClick={() => togglePack(pack.id)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] mt-1',
                    isEnabled ? 'bg-emerald-600' : 'bg-[var(--cf-border-strong)]'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Slot Sections from getSlotsFor('settings.section') */}
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--cf-fg)]">
            Pack Extension Settings
          </h3>
          <p className="text-xs text-[var(--cf-fg-muted)] mt-0.5">
            Modular configuration panels contributed by installed domain packs
          </p>
        </div>

        <div className="space-y-4">
          {slotContributions.map((contribution) => {
            const Component = contribution.component;
            return (
              <div
                key={contribution.id}
                data-testid={`settings-slot-${contribution.id}`}
                className="p-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] space-y-3"
              >
                {contribution.title && (
                  <h4 className="text-xs font-bold text-[var(--cf-fg)] uppercase tracking-wider">
                    {contribution.title}
                  </h4>
                )}
                {Component ? (
                  <Component
                    profileId="me"
                    scopes={contribution.requiredScopes || []}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
