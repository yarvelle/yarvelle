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

function getFilesRecursively(dir: string, ext = ['.ts', '.tsx']): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFilesRecursively(fullPath, ext));
    } else if (entry.isFile() && ext.some((e) => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

const srcDir = path.resolve(__dirname, '../src');
const slotDirs = ['finance', 'education', 'household'];
const slotFiles = slotDirs.flatMap((d) => getFilesRecursively(path.join(srcDir, d)));

describe('GU3 Token Lint & Architectural Purity (ORIGINAL_REQUEST §R3)', () => {
  it('contains zero raw Tailwind palette classes in slot components', () => {
    // Prohibited: e.g. bg-zinc-500, text-slate-900, border-blue-200, bg-amber-100
    const palettePattern =
      /\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/g;
    const violations: Array<{ file: string; match: string }> = [];

    for (const filePath of slotFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(palettePattern);
      if (matches) {
        matches.forEach((m) =>
          violations.push({ file: path.relative(srcDir, filePath), match: m })
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it('contains zero hardcoded #hex colors in slot components', () => {
    // Prohibited: inline hex color literals in slot components; use --ui-* tokens
    const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
    const violations: Array<{ file: string; match: string }> = [];

    for (const filePath of slotFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(hexPattern);
      if (matches) {
        matches.forEach((m) =>
          violations.push({ file: path.relative(srcDir, filePath), match: m })
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it('contains zero dark: Tailwind variant classes in slot components', () => {
    // Prohibited: theme switching is resolved through --ui-* semantic CSS variables
    const darkVariantPattern = /\bdark:/g;
    const violations: Array<{ file: string; match: string }> = [];

    for (const filePath of slotFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(darkVariantPattern);
      if (matches) {
        matches.forEach((m) =>
          violations.push({ file: path.relative(srcDir, filePath), match: m })
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it('contains zero physical-direction classes (enforcing logical RTL properties)', () => {
    // Prohibited: ml-, mr-, pl-, pr-, left-, right-
    // Allowed: ms-, me-, ps-, pe-, start-, end-
    const physicalPattern =
      /\b(ml-|mr-|pl-|pr-|left-[0-9]|right-[0-9]|left-0|right-0|left-1|right-1|left-2|right-2|left-3|right-3|left-4|right-4)\b/g;
    const violations: Array<{ file: string; match: string }> = [];

    for (const filePath of slotFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(physicalPattern);
      if (matches) {
        matches.forEach((m) =>
          violations.push({ file: path.relative(srcDir, filePath), match: m })
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it('enforces zero cross-pack imports between domain slots', () => {
    // Slots in finance, education, household, health-ui must never import each other
    const violations: Array<{ file: string; invalidImport: string }> = [];
    const packNames = ['finance', 'education', 'household', 'health-ui'];

    for (const pack of packNames) {
      const dirPath = path.join(srcDir, pack);
      const files = getFilesRecursively(dirPath);

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
          if (!line.trim().startsWith('import')) continue;

          for (const otherPack of packNames) {
            if (otherPack === pack) continue;

            const importPattern = new RegExp(
              `from\\s+['"][^'"]*\\b(${otherPack}|@carefold\\/health-ui)['"]`
            );
            if (importPattern.test(line)) {
              violations.push({
                file: path.relative(srcDir, filePath),
                invalidImport: line.trim(),
              });
            }
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('asserts exactly 0 occurrences of the legacy domain keyword across frontend source files', () => {
    const allFrontendFiles = getFilesRecursively(srcDir);
    const bannedPattern = new RegExp(['k', 'i', 'd', 's'].join(''), 'i');
    const violations: string[] = [];

    for (const file of allFrontendFiles) {
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
    for (const d of slotDirs) {
      const p = path.join(srcDir, d, 'index.tsx');
      expect(fs.existsSync(p)).toBe(true);
      const text = fs.readFileSync(p, 'utf-8');
      expect(text).toContain('Spectrayan');
      expect(text).toContain('PolyForm Noncommercial License 1.0.0');
    }
  });
});
