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

export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;
export type PasswordStrengthLabel = 'Weak' | 'Fair' | 'Good' | 'Strong';

export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
}

export interface PasswordStrengthResult {
  score: PasswordStrengthScore;
  label: PasswordStrengthLabel;
  criteria: PasswordCriteria;
  isValid: boolean;
  passedCount: number;
  colorClass: string;
}

export const MIN_PASSWORD_LENGTH = 10;

/**
 * Evaluates live password strength on a 4-tier scale (0-4: Weak, Fair, Good, Strong)
 * and checks individual complexity criteria matching Yarvelle's local security rules.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const p = password || '';

  const criteria: PasswordCriteria = {
    minLength: p.length >= MIN_PASSWORD_LENGTH,
    hasUpper: /[A-Z]/.test(p),
    hasLower: /[a-z]/.test(p),
    hasDigit: /[0-9]/.test(p),
    hasSpecial: /[^A-Za-z0-9]/.test(p),
  };

  const passedCount = Object.values(criteria).filter(Boolean).length;

  const isValid =
    criteria.minLength &&
    criteria.hasUpper &&
    criteria.hasLower &&
    (criteria.hasDigit || criteria.hasSpecial);

  let score: PasswordStrengthScore = 0;
  let label: PasswordStrengthLabel = 'Weak';
  let colorClass = 'bg-[var(--cf-danger)] text-[var(--cf-danger)]';

  if (p.length === 0) {
    score = 0;
    label = 'Weak';
    colorClass = 'bg-[var(--cf-border-strong)] text-[var(--cf-fg-muted)]';
  } else if (!criteria.minLength || passedCount <= 2) {
    score = 1;
    label = 'Weak';
    colorClass = 'bg-[var(--cf-danger)] text-[var(--cf-danger)]';
  } else if (passedCount === 3) {
    score = 2;
    label = 'Fair';
    colorClass = 'bg-[var(--cf-warn)] text-[var(--cf-warn)]';
  } else if (passedCount === 4) {
    score = 3;
    label = 'Good';
    colorClass = 'bg-[var(--cf-info)] text-[var(--cf-info)]';
  } else {
    score = 4;
    label = 'Strong';
    colorClass = 'bg-[var(--cf-success)] text-[var(--cf-success)]';
  }

  return {
    score,
    label,
    criteria,
    isValid,
    passedCount,
    colorClass,
  };
}
