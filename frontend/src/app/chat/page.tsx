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

const availableAssistants = [
  { id: 'household-steward', name: 'Household Steward', role: 'Family schedules, meals, chores & home coordination' },
  { id: 'finance-organizer', name: 'Finance Organizer', role: 'Bills, budgeting & statement filing' },
  { id: 'education-navigator', name: 'Education Navigator', role: 'School forms, assignments & academic calendar' },
  { id: 'study-companion', name: 'Study Companion', role: 'Concept review, flashcards & practice quizzes' },
];

export default function ChatPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">AI Family Assistants</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Chat privately with local-first domain specialists. All responses follow non-advisory and non-clinical guardrails.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableAssistants.map((assistant) => (
          <div
            key={assistant.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-600 dark:hover:border-emerald-500 cursor-pointer transition shadow-sm"
          >
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{assistant.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{assistant.role}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm min-h-[300px] flex flex-col justify-between">
        <div className="text-center text-slate-400 my-auto">
          <p className="text-sm">Select an assistant above or start typing a query below.</p>
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="Ask a question about bills, schedules, or learning..."
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            disabled
          />
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition"
            disabled
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
