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

import type { Config } from 'tailwindcss';
import { yarvellePreset } from '@yarvelle/ui/tokens';

const presetTheme = yarvellePreset.theme ?? {};

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-surface',
    'bg-surface-2',
    'bg-surface-3',
    'bg-canvas',
    'text-fg',
    'text-fg-muted',
    'text-fg-subtle',
    'border-border',
    'border-border-strong',
    'bg-primary',
    'text-primary-fg',
    'bg-primary-soft',
    'text-primary-soft-fg',
    'bg-info-bg',
    'text-info-fg',
    'border-info-border',
    'bg-warn-bg',
    'text-warn-fg',
    'border-warn-border',
    'bg-danger-bg',
    'text-danger-fg',
    'border-danger-border',
    'bg-success-bg',
    'text-success-fg',
    'border-success-border',
    'shadow-1',
    'shadow-2',
    'rounded-sm',
    'rounded-md',
    'rounded-lg',
    'rounded-xl',
    'p-6',
    'pt-0',
    'px-2.5',
    'py-0.5',
    'text-start',
    'space-y-1.5',
  ],
  theme: {
    extend: {
      colors: {
        ...(presetTheme.colors ?? {}),
        cradle: {
          emerald: {
            DEFAULT: '#047857',
            light: '#047857',
            dark: '#059669',
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
          },
          apricot: {
            DEFAULT: '#F59E0B',
            light: '#F59E0B',
            dark: '#FBBF24',
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
        },
      },
      borderRadius: {
        ...(presetTheme.borderRadius ?? {}),
      },
      boxShadow: {
        ...(presetTheme.boxShadow ?? {}),
      },
      fontFamily: {
        ...(presetTheme.fontFamily ?? {}),
      },
      zIndex: {
        ...(presetTheme.zIndex ?? {}),
      },
    },
  },
  plugins: [],
};

export default config;
