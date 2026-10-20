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
import { ArrowRight, Sparkles } from 'lucide-react';

export interface StartersChipsProps {
  starters: string[];
  onSelectStarter: (prompt: string, autoSend?: boolean) => void;
  disabled?: boolean;
  autoSend?: boolean;
}

export function StartersChips({
  starters,
  onSelectStarter,
  disabled = false,
  autoSend = true,
}: StartersChipsProps) {
  if (!starters || starters.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="starters-container"
      aria-label="Suggested starter prompts"
      className="w-full flex flex-wrap gap-2 pt-2 pb-1"
    >
      <div className="w-full flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
        <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
        <span>Suggested starters:</span>
      </div>

      {starters.map((prompt, index) => (
        <button
          key={`${index}-${prompt.slice(0, 20)}`}
          type="button"
          data-testid="starter-chip"
          disabled={disabled}
          onClick={() => onSelectStarter(prompt, autoSend)}
          className="inline-flex items-center text-start whitespace-normal break-words text-xs min-h-[44px] max-w-full px-3.5 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:border-emerald-700 dark:hover:border-emerald-400 hover:text-emerald-950 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm hover:shadow group cursor-pointer"
        >
          <span className="break-words whitespace-normal max-w-full leading-snug">{prompt}</span>
          <ArrowRight className="w-3 h-3 ms-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-700 dark:text-emerald-400 shrink-0" />
        </button>
      ))}
    </div>
  );
}
