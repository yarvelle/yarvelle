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
  allPacks,
  getPackUi,
  getAllSlotContributions,
  getSlotsFor,
} from '../src/pack-registry.generated';

describe('Frontend Multi-Pack Slot Composition (YU2, YU3)', () => {
  it('registers all 4 packs in the frontend registry', () => {
    const packNames = allPacks.map((p) => p.pack);
    expect(packNames).toContain('health');
    expect(packNames).toContain('finance');
    expect(packNames).toContain('education');
    expect(packNames).toContain('household');
    expect(allPacks.length).toBe(4);
  });

  it('retrieves individual pack UIs by ID', () => {
    expect(getPackUi('health')?.pack).toBe('health');
    expect(getPackUi('finance')?.pack).toBe('finance');
    expect(getPackUi('education')?.pack).toBe('education');
    expect(getPackUi('household')?.pack).toBe('household');
  });

  it('populates dashboard.card slot across multiple domain packs', () => {
    const cards = getSlotsFor('dashboard.card');
    expect(cards.length).toBeGreaterThanOrEqual(10);

    const contributingPacks = new Set(cards.map((c) => c.pack));
    expect(contributingPacks).toContain('health');
    expect(contributingPacks).toContain('finance');
    expect(contributingPacks).toContain('education');
    expect(contributingPacks).toContain('household');
  });

  it('populates settings.section slot with household toggles and health consent', () => {
    const settings = getSlotsFor('settings.section');
    expect(settings.length).toBeGreaterThanOrEqual(2);

    const settingIds = settings.map((s) => s.id);
    expect(settingIds).toContain('household.panel-toggles');
    expect(settingIds).toContain('health.clinical-consent.settings');
  });

  it('verifies all slot contributions declare requiredScopes and pack ownership', () => {
    const all = getAllSlotContributions();
    expect(all.length).toBeGreaterThanOrEqual(20);

    for (const c of all) {
      expect(c.id).toBeDefined();
      expect(c.pack).toBeDefined();
      expect(c.slot).toBeDefined();
      expect(Array.isArray(c.requiredScopes)).toBe(true);
      expect(c.requiredScopes.length).toBeGreaterThan(0);
    }
  });
});
