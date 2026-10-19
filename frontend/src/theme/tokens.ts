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

export const PRODUCT_NAME = 'Yarvelle';
export const STORAGE_NAMESPACE = 'yarvelle';

export interface ThemeColors {
  primary: string;
  accent: string;
  surface: string;
  background: string;
  text: string;
  textMuted: string;
  border: string;
}

export const cradleColors = {
  emerald: {
    light: '#047857', // Emerald 700
    dark: '#059669',  // Emerald 600
  },
  apricot: {
    light: '#F59E0B', // Amber 500
    dark: '#FBBF24',  // Amber 400
  },
  neutral: {
    white: '#FFFFFF',
    darkBg: '#0B1311',
    darkSurface: '#131F1C',
    black: '#000000',
  },
} as const;

export const cradleThemeTokens = {
  productName: PRODUCT_NAME,
  storageNamespace: STORAGE_NAMESPACE,
  light: {
    primary: cradleColors.emerald.light,
    accent: cradleColors.apricot.light,
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
  },
  dark: {
    primary: cradleColors.emerald.dark,
    accent: cradleColors.apricot.dark,
    background: cradleColors.neutral.darkBg,
    surface: cradleColors.neutral.darkSurface,
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    border: '#1E293B',
  },
};

/**
 * Calculates the relative luminance of an RGB hex string per WCAG 2.1 specs.
 */
export function calculateLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

/**
 * Calculates WCAG contrast ratio between two hex colors.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = calculateLuminance(hex1);
  const lum2 = calculateLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}
