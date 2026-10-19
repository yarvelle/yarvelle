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

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Tasks & Chores</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Household maintenance checklists, chore rotations, and academic assignment trackers.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          <li className="py-3 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300">Clean kitchen counters</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Household</span>
          </li>
          <li className="py-3 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300">Biology science fair outline</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Education</span>
          </li>
          <li className="py-3 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300">Review monthly electric bill</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Finance</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
