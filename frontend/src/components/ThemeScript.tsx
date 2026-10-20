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

import Script from 'next/script';
import { THEME_STORAGE_KEY } from '@/lib/theme';

export const THEME_SCRIPT_CONTENT = `(function() {
  try {
    var key = '${THEME_STORAGE_KEY}';
    var stored = localStorage.getItem(key);
    var supportDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || ((!stored || stored === 'system') && supportDark)) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();`;

export function ThemeScript() {
  if (process.env.NODE_ENV === 'test') {
    return (
      <script
        id="yarvelle-theme-init"
        dangerouslySetInnerHTML={{ __html: THEME_SCRIPT_CONTENT }}
      />
    );
  }

  return (
    <Script
      id="yarvelle-theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT_CONTENT }}
    />
  );
}
