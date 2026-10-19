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

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@yarvelle/ui/slots': path.resolve(__dirname, '../../yarvelle-core/frontend/src/slots/index.ts'),
      '@yarvelle/ui/tokens': path.resolve(__dirname, '../../yarvelle-core/frontend/src/tokens/index.ts'),
      '@yarvelle/ui': path.resolve(__dirname, '../../yarvelle-core/frontend/src/index.ts'),
      '@carefold/health-ui': path.resolve(__dirname, './src/health-ui/index.tsx'),
    },
  },
});
