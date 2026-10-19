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

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('GU3 Token Lint & Zero-Legacy Domain Invariant', () => {
  const srcDir = path.resolve(__dirname, '../src');

  function getSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...getSourceFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it('asserts exactly 0 occurrences of the legacy domain keyword in frontend source files', () => {
    const files = getSourceFiles(srcDir);
    const bannedPattern = new RegExp(['k', 'i', 'd', 's'].join(''), 'i');
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (bannedPattern.test(line)) {
          violations.push(`${path.relative(srcDir, file)}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('confirms all slot directories exist and carry compliant license headers', () => {
    const slotDirs = ['finance', 'education', 'household'];
    for (const d of slotDirs) {
      const p = path.join(srcDir, d, 'index.tsx');
      expect(fs.existsSync(p)).toBe(true);
      const text = fs.readFileSync(p, 'utf-8');
      expect(text).toContain('Yarvelle — Personal & Family AI Assistant Application');
      expect(text).toContain('Copyright 2026 Spectrayan');
    }
  });
});
