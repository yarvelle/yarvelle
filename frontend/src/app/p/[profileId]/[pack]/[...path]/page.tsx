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
import { getPackUi } from '@/pack-registry.generated';

export default async function PackRoutePage({
  params,
}: {
  params: Promise<{ profileId: string; pack: string; path: string[] }>;
}) {
  const { profileId, pack, path } = await params;
  const packUi = getPackUi(pack);

  if (!packUi) {
    return (
      <div className="p-8 text-center text-slate-500">
        Pack &quot;{pack}&quot; not found or disabled.
      </div>
    );
  }

  const subpath = `/${path.join('/')}`;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight capitalize text-slate-900 dark:text-slate-100">
          {pack} &mdash; {path.join(' / ')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">Profile: {profileId}</p>
      </div>

      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Viewing {pack} domain route &quot;{subpath}&quot; for profile {profileId}.
        </p>
      </div>
    </div>
  );
}
