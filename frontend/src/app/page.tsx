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

import React from 'react';
import { getSlotsFor } from '@/pack-registry.generated';

export default function DashboardPage() {
  const dashboardSlots = getSlotsFor('dashboard.card');
  const profileId = 'prof-default';
  const scopes = [
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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-md">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Family Dashboard</h1>
        <p className="mt-2 text-emerald-100 max-w-2xl text-sm sm:text-base">
          Local-first coordination across health, finances, education, and household routines with strict privacy boundaries.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-700/60 text-emerald-100 border border-emerald-600/50">
            Health Pack
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-700/60 text-emerald-100 border border-emerald-600/50">
            Finance Pack
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-700/60 text-emerald-100 border border-emerald-600/50">
            Education Pack
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-700/60 text-emerald-100 border border-emerald-600/50">
            Household Pack
          </span>
        </div>
      </div>

      {/* Grid of Contributed Pack Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="dashboard-slots-grid">
        {dashboardSlots.map((slot) => {
          if (!slot.component) return null;
          const Component = slot.component;
          return (
            <div key={slot.id} className="transition hover:-translate-y-0.5 duration-150">
              <Component profileId={profileId} scopes={scopes} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
