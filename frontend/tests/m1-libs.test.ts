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

import { describe, expect, it, beforeEach } from 'vitest';

class MemoryStorage implements Storage {
  private data: Record<string, string> = {};
  get length() { return Object.keys(this.data).length; }
  clear() { this.data = {}; }
  getItem(key: string) { return this.data[key] ?? null; }
  setItem(key: string, value: string) { this.data[key] = String(value); }
  removeItem(key: string) { delete this.data[key]; }
  key(index: number) { return Object.keys(this.data)[index] ?? null; }
}

const mockStorage = new MemoryStorage();
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: mockStorage, configurable: true, writable: true });
}
Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, configurable: true, writable: true });

import {
  getScopedStorageKey,
  setStorageUserId,
  getStorageUserId,
  ScopedStorage,
  detachUserSession,
  STORAGE_DETACHED_EVENT,
  migrateUserStorage,
} from '../src/lib/storageNamespace';
import {
  deriveAudienceBand,
  loadHouseholdProfiles,
  saveHouseholdProfiles,
  getHouseholdProfile,
  switchProfileRoute,
  DEFAULT_HOUSEHOLD_PROFILES,
} from '../src/lib/familyProfiles';
import {
  THEME_STORAGE_KEY,
  resolveTheme,
  getStoredTheme,
  setStoredTheme,
} from '../src/lib/theme';
import {
  formatLocalizedDate,
  formatLocalizedNumber,
  formatIcuMessage,
} from '../src/i18n/formatters';
import { getTextDirection, normalizeLocale } from '../src/i18n/config';
import { getInitials, hashNameToSlot } from '../src/components/ui/Avatar';
import { getProviderPrivacyState, DEFAULT_USER_SETTINGS } from '../src/lib/settings';

describe('Milestone 1 — Storage Namespace & User Isolation', () => {
  beforeEach(() => {
    mockStorage.clear();
    setStorageUserId(null);
  });

  it('prefixes keys with yarvelle_guest_ when no user is active', () => {
    expect(getStorageUserId()).toBeNull();
    const key = getScopedStorageKey('notes');
    expect(key).toBe('yarvelle_guest_notes');
  });

  it('prefixes keys with yarvelle_{userId}_ when active user is set', () => {
    setStorageUserId('usr-12345');
    expect(getStorageUserId()).toBe('usr-12345');
    const key = getScopedStorageKey('settings');
    expect(key).toBe('yarvelle_usr-12345_settings');
  });

  it('stores, retrieves, and removes typed data in ScopedStorage', () => {
    const store = new ScopedStorage({ userId: 'alice', storage: mockStorage });
    expect(store.getItem('theme', 'system')).toBe('system');

    store.setItem('profile', { displayName: 'Alice' });
    expect(store.getItem('profile')).toEqual({ displayName: 'Alice' });
    expect(mockStorage.getItem('yarvelle_alice_profile')).toBe(JSON.stringify({ displayName: 'Alice' }));

    store.removeItem('profile');
    expect(store.getItem('profile')).toBeNull();
  });

  it('migrates user storage data between user IDs', () => {
    const guestStore = new ScopedStorage({ userId: null, storage: mockStorage });
    guestStore.setItem('draft_note', 'hello world');

    const migrated = migrateUserStorage(null, 'bob', mockStorage);
    expect(migrated).toBe(1);

    const bobStore = new ScopedStorage({ userId: 'bob', storage: mockStorage });
    expect(bobStore.getItem('draft_note')).toBe('hello world');
    expect(guestStore.getItem('draft_note')).toBeNull();
  });

  it('detaches user session and emits storage detached event', () => {
    let eventReceived = false;
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.userId === 'alice') {
        eventReceived = true;
      }
    };
    window.addEventListener(STORAGE_DETACHED_EVENT, handler);

    setStorageUserId('alice');
    mockStorage.setItem('yarvelle_alice_data', 'confidential');
    mockStorage.setItem('yarvelle_msgs_123', 'messages');

    detachUserSession('alice');

    expect(mockStorage.getItem('yarvelle_alice_data')).toBeNull();
    expect(mockStorage.getItem('yarvelle_msgs_123')).toBeNull();
    expect(getStorageUserId()).toBeNull();
    expect(eventReceived).toBe(true);

    window.removeEventListener(STORAGE_DETACHED_EVENT, handler);
  });
});

describe('Milestone 1 — Family Profiles & Audience Bands', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('derives correct audience band without prohibited keywords', () => {
    expect(deriveAudienceBand(8)).toBe('child');
    expect(deriveAudienceBand(12)).toBe('child');
    expect(deriveAudienceBand(13)).toBe('teen');
    expect(deriveAudienceBand(17)).toBe('teen');
    expect(deriveAudienceBand(18)).toBe('adult');
    expect(deriveAudienceBand(42)).toBe('adult');
    expect(deriveAudienceBand(undefined, 'viewer')).toBe('viewer');
  });

  it('loads default household profiles with Adult, Teen, and Child profiles', () => {
    const profiles = loadHouseholdProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4);

    const audiences = profiles.map((p) => p.audience);
    expect(audiences).toContain('adult');
    expect(audiences).toContain('teen');
    expect(audiences).toContain('child');

    const leo = getHouseholdProfile('me');
    expect(leo).not.toBeNull();
    expect(leo?.name).toBe('Leo');
  });

  it('switches routes while preserving subpaths', () => {
    expect(switchProfileRoute('/p/me', 'rosa')).toBe('/p/rosa');
    expect(switchProfileRoute('/p/me/chat', 'rosa')).toBe('/p/rosa/chat');
    expect(switchProfileRoute('/p/me/vitals', 'maya')).toBe('/p/maya/vitals');
    expect(switchProfileRoute('/family', 'sam')).toBe('/p/sam');
  });

  it('preserves query parameters and hash fragments across root and subpath profile switches', () => {
    expect(switchProfileRoute('/p/me?tab=billing', 'rosa')).toBe('/p/rosa?tab=billing');
    expect(switchProfileRoute('/p/me#overview', 'rosa')).toBe('/p/rosa#overview');
    expect(switchProfileRoute('/p/me?tab=billing#overview', 'rosa')).toBe('/p/rosa?tab=billing#overview');
    expect(switchProfileRoute('/p/me/?tab=billing', 'rosa')).toBe('/p/rosa/?tab=billing');
    expect(switchProfileRoute('/p/me/chat?thread=42', 'rosa')).toBe('/p/rosa/chat?thread=42');
  });
});

describe('Milestone 1 — Theme Storage & Resolution', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('uses yarvelle_theme storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('yarvelle_theme');
    setStoredTheme('dark');
    expect(mockStorage.getItem('yarvelle_theme')).toBe('dark');
    expect(getStoredTheme()).toBe('dark');
  });

  it('resolves explicit light and dark themes', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });
});

describe('Milestone 1 — I18n & Internationalization', () => {
  it('detects RTL text direction for Arabic and LTR for others', () => {
    expect(getTextDirection('ar-SA')).toBe('rtl');
    expect(getTextDirection('en-US')).toBe('ltr');
    expect(getTextDirection('es-ES')).toBe('ltr');
    expect(getTextDirection('fr-FR')).toBe('ltr');
    expect(getTextDirection('hi-IN')).toBe('ltr');
  });

  it('normalizes locale variants cleanly', () => {
    expect(normalizeLocale('en')).toBe('en-US');
    expect(normalizeLocale('es')).toBe('es-ES');
    expect(normalizeLocale('fr')).toBe('fr-FR');
    expect(normalizeLocale('hi')).toBe('hi-IN');
    expect(normalizeLocale('ar')).toBe('ar-SA');
  });

  it('formats ICU templates with variables and plurals', () => {
    const simple = formatIcuMessage('Hello {name}!', { name: 'Leo' }, 'en-US');
    expect(simple).toBe('Hello Leo!');

    const plural = formatIcuMessage(
      '{count, plural, =0 {No items} one {# item} other {# items}}',
      { count: 3 },
      'en-US'
    );
    expect(plural).toBe('3 items');
  });

  it('formats dates and numbers across locales', () => {
    const date = new Date(2026, 9, 20);
    const formattedDate = formatLocalizedDate(date, 'en-US');
    expect(formattedDate).toContain('2026');

    const num = formatLocalizedNumber(1234567.89, 'en-US');
    expect(num).toBe('1,234,567.89');
  });
});

describe('Milestone 1 — Avatar Utilities & Sizing', () => {
  it('extracts initials cleanly for single and multiple word names', () => {
    expect(getInitials('Leo')).toBe('LE');
    expect(getInitials('Rosa Parks')).toBe('RP');
    expect(getInitials('Sam')).toBe('SA');
    expect(getInitials('')).toBe('?');
  });

  it('hashes names deterministically into 1..5 color slots', () => {
    const slot1 = hashNameToSlot('Leo');
    const slot2 = hashNameToSlot('Leo');
    expect(slot1).toBe(slot2);
    expect(slot1).toBeGreaterThanOrEqual(1);
    expect(slot1).toBeLessThanOrEqual(5);
  });
});

describe('Milestone 1 — Data Residency & Privacy State', () => {
  it('reports On-Device residency with emerald styling for local Ollama', () => {
    const privacy = getProviderPrivacyState(DEFAULT_USER_SETTINGS);
    expect(privacy.isLocal).toBe(true);
    expect(privacy.badgeText).toBe('On-Device');
    expect(privacy.badgeVariant).toBe('emerald');
    expect(privacy.explainerTitle).toBe('On-Device Data Residency');
    expect(privacy.destinationLabel).toContain('Local');
  });

  it('reports Cloud residency with amber styling for remote cloud providers', () => {
    const privacy = getProviderPrivacyState({
      ...DEFAULT_USER_SETTINGS,
      provider: 'google',
    });
    expect(privacy.isLocal).toBe(false);
    expect(privacy.badgeText).toBe('Cloud (Gemini)');
    expect(privacy.badgeVariant).toBe('amber');
    expect(privacy.destinationLabel).toBe('Gemini Cloud API');
  });
});
