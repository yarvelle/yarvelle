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
  filterSlotContributions,
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

describe('Per-Person Panel Filtering & Audience Scoping (YU3, YV-X-1..4)', () => {
  it('filters dashboard cards for child audience (excludes adult-only finance, forms, and maintenance)', () => {
    const childCards = filterSlotContributions(getAllSlotContributions(), {
      slot: 'dashboard.card',
      audience: 'child',
    });
    expect(childCards.length).toBeGreaterThan(0);

    // Zero finance pack cards may appear for a child profile
    const financeCards = childCards.filter((c) => c.pack === 'finance');
    expect(financeCards).toHaveLength(0);

    // Adult-only cards are strictly excluded
    const cardIds = childCards.map((c) => c.id);
    expect(cardIds).not.toContain('education.forms');
    expect(cardIds).not.toContain('household.cross-links');
    expect(cardIds).not.toContain('household.maintenance');
    expect(cardIds).not.toContain('household.handover');
    expect(cardIds).not.toContain('health.vitals.card');

    // Child-eligible education and household cards are included
    expect(cardIds).toContain('education.calendar');
    expect(cardIds).toContain('education.assignments');
    expect(cardIds).toContain('education.reading');
    expect(cardIds).toContain('education.study');
    expect(cardIds).toContain('household.timeline');
    expect(cardIds).toContain('household.chores');
    expect(cardIds).toContain('household.meals');

    // Invariant: every single returned card must explicitly permit 'child'
    for (const card of childCards) {
      expect(card.audiences).toContain('child');
    }
  });

  it('filters dashboard cards for teen audience (includes education, chores, travel, and health vitals)', () => {
    const teenCards = filterSlotContributions(getAllSlotContributions(), {
      slot: 'dashboard.card',
      audience: 'teen',
    });
    expect(teenCards.length).toBeGreaterThan(0);

    // Zero finance pack cards may appear for a teen
    const financeCards = teenCards.filter((c) => c.pack === 'finance');
    expect(financeCards).toHaveLength(0);

    const cardIds = teenCards.map((c) => c.id);
    // Teen includes travel, health vitals, assignments, and reading
    expect(cardIds).toContain('household.travel');
    expect(cardIds).toContain('health.vitals.card');
    expect(cardIds).toContain('education.assignments');
    expect(cardIds).toContain('education.reading');

    // Adult-only maintenance and handover are excluded
    expect(cardIds).not.toContain('household.maintenance');
    expect(cardIds).not.toContain('household.handover');
  });

  it('filters dashboard cards for adult steward audience (includes all 4 packs & adult governance)', () => {
    const adultCards = filterSlotContributions(getAllSlotContributions(), {
      slot: 'dashboard.card',
      audience: 'adult',
    });
    expect(adultCards.length).toBeGreaterThanOrEqual(10);

    const packs = new Set(adultCards.map((c) => c.pack));
    expect(packs).toContain('health');
    expect(packs).toContain('finance');
    expect(packs).toContain('education');
    expect(packs).toContain('household');

    const cardIds = adultCards.map((c) => c.id);
    expect(cardIds).toContain('finance.bills.calendar');
    expect(cardIds).toContain('finance.budget');
    expect(cardIds).toContain('education.forms');
    expect(cardIds).toContain('household.cross-links');
    expect(cardIds).toContain('household.maintenance');
    expect(cardIds).toContain('household.handover');
  });

  it('filters slot contributions by activeScopes (enforcing profile scope grants)', () => {
    const activeScopes = ['education.*', 'household.chores'];
    const scopedSlots = filterSlotContributions(getAllSlotContributions(), {
      slot: 'dashboard.card',
      activeScopes,
    });

    const cardIds = scopedSlots.map((c) => c.id);
    // Education slots satisfied by education.* wildcard
    expect(cardIds).toContain('education.calendar');
    expect(cardIds).toContain('education.assignments');
    expect(cardIds).toContain('education.reading');

    // Household chores is explicitly granted
    expect(cardIds).toContain('household.chores');

    // Finance and household.timeline are not granted
    expect(cardIds).not.toContain('finance.bills.calendar');
    expect(cardIds).not.toContain('household.timeline');
  });

  it('filters slot contributions by hiddenPanels user preferences', () => {
    const allDashboard = filterSlotContributions(getAllSlotContributions(), {
      slot: 'dashboard.card',
    });
    const hiddenPanels = ['finance.bills.calendar', 'education.study'];

    const filtered = filterSlotContributions(getAllSlotContributions(), {
      slot: 'dashboard.card',
      hiddenPanels,
    });

    const cardIds = filtered.map((c) => c.id);
    expect(cardIds).not.toContain('finance.bills.calendar');
    expect(cardIds).not.toContain('education.study');
    expect(filtered.length).toBe(allDashboard.length - 2);
  });

  it('filters slot contributions when packs are disabled via enabledPacks', () => {
    const enabledPacks = ['education', 'household'];
    const filtered = filterSlotContributions(getAllSlotContributions(), {
      enabledPacks,
    });

    const packs = new Set(filtered.map((c) => c.pack));
    expect(packs.has('education')).toBe(true);
    expect(packs.has('household')).toBe(true);
    expect(packs.has('finance')).toBe(false);
    expect(packs.has('health')).toBe(false);
  });

  it('verifies domain view routes and contribution integrity for all 4 packs', () => {
    for (const pack of allPacks) {
      expect(pack.pack).toBeDefined();
      expect(pack.contributions.length).toBeGreaterThan(0);
      for (const c of pack.contributions) {
        if (c.route) {
          expect(
            c.route.startsWith(`/${pack.pack}`) ||
            c.route.startsWith('/settings') ||
            c.route.startsWith('/vitals') ||
            c.route.startsWith('/appointments') ||
            c.route.startsWith('/preventive') ||
            c.route.startsWith('/schedule')
          ).toBe(true);
        }
      }
    }
  });
});
