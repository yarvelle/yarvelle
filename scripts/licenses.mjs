#!/usr/bin/env node
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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const C_STYLE_HEADER = `/*
 * Yarvelle \u2014 Personal & Family AI Assistant Application
 * Copyright 2026 Spectrayan (https://spectrayan.com)
 *
 * Licensed under the PolyForm Noncommercial License 1.0.0 and the
 * Yarvelle Additional Terms (see LICENSE and ADDITIONAL-TERMS.md).
 * Personal and household local use only. Commercial use, hosted service
 * offering, rebranding, white-labeling, and redistribution of modified
 * forks are prohibited without a written commercial license from Spectrayan.
 *
 * Required Notice: Copyright 2026 Spectrayan (https://spectrayan.com)
 */`;

const HASH_STYLE_HEADER = `# Yarvelle \u2014 Personal & Family AI Assistant Application
# Copyright 2026 Spectrayan (https://spectrayan.com)
#
# Licensed under the PolyForm Noncommercial License 1.0.0 and the
# Yarvelle Additional Terms (see LICENSE and ADDITIONAL-TERMS.md).
# Personal and household local use only. Commercial use, hosted service
# offering, rebranding, white-labeling, and redistribution of modified
# forks are prohibited without a written commercial license from Spectrayan.
#
# Required Notice: Copyright 2026 Spectrayan (https://spectrayan.com)`;

const TARGET_EXTENSIONS = new Set(['.py', '.ts', '.tsx', '.js', '.mjs', '.css']);

const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  '.venv',
  'venv',
  '.git',
  '.pytest_cache',
  'logs',
  '__pycache__',
  '.turbo',
  'out',
  'build',
  '.changeset',
]);

const IGNORED_FILES = new Set([
  'next-env.d.ts',
]);

function isPython(filePath) {
  return filePath.endsWith('.py');
}

export function hasLicenseHeader(content, isPy) {
  let checkArea = content;
  if (checkArea.startsWith('#!')) {
    const newlineIndex = checkArea.indexOf('\n');
    if (newlineIndex !== -1) {
      checkArea = checkArea.slice(newlineIndex + 1);
    }
  }
  checkArea = checkArea.trimStart();

  const expectedHeader = isPy ? HASH_STYLE_HEADER : C_STYLE_HEADER;
  const normalizedCheck = checkArea.replace(/\r\n/g, '\n');
  const normalizedExpected = expectedHeader.replace(/\r\n/g, '\n');

  return normalizedCheck.startsWith(normalizedExpected);
}

export function applyLicenseHeader(content, isPy) {
  if (hasLicenseHeader(content, isPy)) {
    return content;
  }

  const expectedHeader = isPy ? HASH_STYLE_HEADER : C_STYLE_HEADER;

  if (content.startsWith('#!')) {
    const newlineIndex = content.indexOf('\n');
    if (newlineIndex !== -1) {
      const shebang = content.slice(0, newlineIndex + 1);
      const rest = content.slice(newlineIndex + 1).replace(/^\r?\n+/, '');
      return `${shebang}${expectedHeader}\n\n${rest}`;
    } else {
      return `${content}\n${expectedHeader}\n`;
    }
  }

  const cleanContent = content.replace(/^\r?\n+/, '');
  return `${expectedHeader}\n\n${cleanContent}`;
}

function walkDirectory(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (TARGET_EXTENSIONS.has(ext) && !IGNORED_FILES.has(entry.name)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const isCheck = process.argv.includes('--check');
const files = walkDirectory(REPO_ROOT);
let hasErrors = false;

for (const file of files) {
  const isPy = isPython(file);
  const content = fs.readFileSync(file, 'utf-8');
  if (!hasLicenseHeader(content, isPy)) {
    if (isCheck) {
      console.error(`Missing or invalid license header: ${path.relative(REPO_ROOT, file)}`);
      hasErrors = true;
    } else {
      const updated = applyLicenseHeader(content, isPy);
      fs.writeFileSync(file, updated, 'utf-8');
      console.log(`Applied license header: ${path.relative(REPO_ROOT, file)}`);
    }
  }
}

if (isCheck && hasErrors) {
  process.exit(1);
} else if (isCheck) {
  console.log('All files carry compliant license headers.');
}
