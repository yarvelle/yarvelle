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
import {
  PRODUCT_NAME,
  STORAGE_NAMESPACE,
  cradleColors,
  cradleThemeTokens,
  getContrastRatio,
} from '../src/theme/tokens';

describe('Cradle Theme Tokens & WCAG AA Contrast (YU1)', () => {
  it('defines correct product name and storage namespace', () => {
    expect(PRODUCT_NAME).toBe('Yarvelle');
    expect(STORAGE_NAMESPACE).toBe('yarvelle');
    expect(cradleThemeTokens.productName).toBe('Yarvelle');
    expect(cradleThemeTokens.storageNamespace).toBe('yarvelle');
  });

  it('verifies Cradle emerald light (#047857) meets WCAG AA text contrast (>= 4.5:1) against white', () => {
    const ratio = getContrastRatio(cradleColors.emerald.light, '#FFFFFF');
    // #047857 against #FFFFFF is ~5.15:1
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies Cradle emerald dark (#059669) meets WCAG AA contrast against dark background (#0B1311)', () => {
    const ratio = getContrastRatio(cradleColors.emerald.dark, cradleColors.neutral.darkBg);
    // #059669 against #0B1311 is ~4.8:1
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies warm apricot accent contrast against dark surfaces', () => {
    const ratio = getContrastRatio(cradleColors.apricot.light, '#000000');
    // #F59E0B against black is > 8:1
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies dark text meets WCAG AAA against white surface', () => {
    const ratio = getContrastRatio(cradleThemeTokens.light.text, cradleThemeTokens.light.background);
    expect(ratio).toBeGreaterThanOrEqual(7.0);
  });

  it('verifies light text meets WCAG AAA against dark surface', () => {
    const ratio = getContrastRatio(cradleThemeTokens.dark.text, cradleThemeTokens.dark.background);
    expect(ratio).toBeGreaterThanOrEqual(7.0);
  });
});
