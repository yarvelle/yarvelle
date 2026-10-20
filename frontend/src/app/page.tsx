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

import React, { useEffect, useState } from 'react';
import { getAllSlotContributions, filterSlotContributions } from '@/pack-registry.generated';
import type { AudienceBand } from '@yarvelle/ui/slots';

const DEFAULT_SCOPES = [
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

const PACK_FILTERS = [
  { id: 'all', label: 'All Packs' },
  { id: 'health', label: 'Health Pack' },
  { id: 'finance', label: 'Finance Pack' },
  { id: 'education', label: 'Education Pack' },
  { id: 'household', label: 'Household Pack' },
] as const;

const AUDIENCE_OPTIONS: { id: AudienceBand; label: string; profileId: string }[] = [
  { id: 'adult', label: 'Adult Steward', profileId: 'prof-default' },
  { id: 'teen', label: 'Teen (13–17)', profileId: 'prof-teen' },
  { id: 'child', label: 'Child (<13)', profileId: 'prof-child' },
];

export default function DashboardPage() {
  const [selectedPack, setSelectedPack] = useState<string>('all');
  const [audience, setAudience] = useState<AudienceBand>('adult');
  const [backendStatus, setBackendStatus] = useState<{ status: string; version?: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.status) setBackendStatus(data);
      })
      .catch(() => {
        // Offline or standalone preview
      });
  }, []);

  const currentProfile = AUDIENCE_OPTIONS.find((a) => a.id === audience) ?? AUDIENCE_OPTIONS[0];
  const dashboardSlots = filterSlotContributions(getAllSlotContributions(), {
    slot: 'dashboard.card',
    audience,
    activeScopes: DEFAULT_SCOPES,
    enabledPacks: selectedPack === 'all' ? undefined : [selectedPack],
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Family Dashboard</h1>
              {backendStatus && (
                <span
                  data-testid="backend-status-pill"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Runtime {backendStatus.version || 'Online'}
                </span>
              )}
            </div>
            <p className="mt-2 text-emerald-100 max-w-2xl text-sm sm:text-base">
              Local-first coordination across health, finances, education, and household routines with strict privacy boundaries.
            </p>
          </div>

          {/* Profile Audience Switcher */}
          <div className="flex items-center gap-1.5 bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-700/50 self-start">
            {AUDIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAudience(opt.id)}
                data-testid={`audience-btn-${opt.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  audience === opt.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-200 hover:bg-emerald-800/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pack Filter Pills */}
        <div className="mt-6 flex flex-wrap gap-2.5" role="group" aria-label="Domain pack filters">
          {PACK_FILTERS.map((pack) => {
            const active = selectedPack === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelectedPack(pack.id)}
                data-testid={`pack-filter-${pack.id}`}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
                  active
                    ? 'bg-white text-emerald-950 border-white shadow-sm'
                    : 'bg-emerald-700/60 text-emerald-100 border-emerald-600/50 hover:bg-emerald-700'
                }`}
              >
                {pack.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Contributed Pack Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="dashboard-slots-grid">
        {dashboardSlots.map((slot) => {
          if (!slot.component) return null;
          const Component = slot.component;
          return (
            <div key={slot.id} data-slot-id={slot.id} className="transition hover:-translate-y-0.5 duration-150">
              <Component profileId={currentProfile.profileId} scopes={DEFAULT_SCOPES} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
