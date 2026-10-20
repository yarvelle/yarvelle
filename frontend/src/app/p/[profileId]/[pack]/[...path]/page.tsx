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

import React, { use } from 'react';
import Link from 'next/link';
import { getPackUi } from '@/pack-registry.generated';

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

export default function PackRoutePage({
  params,
}: {
  params: Promise<{ profileId: string; pack: string; path: string[] }>;
}) {
  const { profileId, pack, path } = use(params);
  const packUi = getPackUi(pack);

  if (!packUi) {
    return (
      <div className="p-8 text-center text-slate-500">
        Pack &quot;{pack}&quot; not found or disabled.
      </div>
    );
  }

  const subpath = `/${pack}/${path.join('/')}`;
  const matchingSlots = packUi.contributions.filter(
    (c) => c.route === subpath || c.route === `/${path.join('/')}`
  );
  const slotsToRender = matchingSlots.length > 0 ? matchingSlots : packUi.contributions;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize text-slate-900 dark:text-slate-100">
            {pack} &mdash; {path.join(' / ')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Profile: {profileId} &bull; Route: {subpath}
          </p>
        </div>
        <Link
          href="/"
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="pack-route-slots">
        {slotsToRender.map((slot) => {
          if (!slot.component) return null;
          const Component = slot.component;
          return (
            <div key={slot.id}>
              <Component profileId={profileId} scopes={DEFAULT_SCOPES} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
