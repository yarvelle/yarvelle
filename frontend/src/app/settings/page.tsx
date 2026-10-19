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

import React from 'react';
import { getSlotsFor } from '@/pack-registry.generated';

export default function SettingsPage() {
  const settingsSlots = getSlotsFor('settings.section');
  const profileId = 'prof-default';
  const scopes = ['household.governance', 'health.clinical'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings & Privacy</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage family governance, profile age bands, and per-person domain toggles.
        </p>
      </div>

      <div className="space-y-6" data-testid="settings-sections">
        {settingsSlots.map((slot) => {
          if (!slot.component) return null;
          const Component = slot.component;
          return (
            <div key={slot.id}>
              <Component profileId={profileId} scopes={scopes} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
