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

export const STORAGE_DETACHED_EVENT = 'yarvelle:storage-detached';

export interface ScopedStorageOptions {
  userId?: string | null;
  storage?: Storage | null;
}

let activeStorageUserId: string | null = null;

export function setStorageUserId(userId: string | null | undefined): void {
  activeStorageUserId = userId && userId.trim() ? userId.trim() : null;
}

export function getStorageUserId(): string | null {
  return activeStorageUserId;
}

export function resolveStorageUserId(userId?: string | null): string {
  const effective = userId !== undefined ? userId : activeStorageUserId;
  return effective && effective.trim() ? effective.trim() : 'guest';
}

/**
 * Generates namespaced storage key in format `yarvelle_{userId}_{baseKey}` or `yarvelle_guest_{baseKey}`.
 */
export function getScopedStorageKey(arg1?: string | null, arg2?: string | null): string {
  let userId: string | null | undefined;
  let baseKey: string;

  if (arg2 === undefined) {
    baseKey = arg1 || '';
    userId = activeStorageUserId;
  } else {
    if (arg1 === undefined) {
      userId = activeStorageUserId;
      baseKey = arg2 || '';
    } else if (arg1 === null || !arg1.trim()) {
      userId = null;
      baseKey = arg2 || '';
    } else {
      const clean1 = arg1.trim();
      const clean2 = arg2 ? arg2.trim() : '';
      if (clean1.startsWith('usr-') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean1)) {
        userId = arg1;
        baseKey = arg2 || '';
      } else if (clean2.startsWith('usr-') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean2)) {
        userId = arg2;
        baseKey = arg1;
      } else {
        userId = arg1;
        baseKey = arg2 || '';
      }
    }
  }

  const cleanBase = baseKey.replace(/^yarvelle_/, '');
  if (!userId || !userId.trim()) {
    return `yarvelle_guest_${cleanBase}`;
  }
  return `yarvelle_${userId.trim()}_${cleanBase}`;
}

export class ScopedStorage {
  private userId: string | null;
  private storage: Storage | null;

  constructor(options: ScopedStorageOptions = {}) {
    this.userId = options.userId !== undefined ? (options.userId?.trim() || null) : activeStorageUserId;
    this.storage = options.storage !== undefined
      ? options.storage
      : (typeof window !== 'undefined' ? window.localStorage : null);
  }

  setUserId(userId: string | null) {
    this.userId = userId && userId.trim() ? userId.trim() : null;
  }

  getUserId(): string | null {
    return this.userId;
  }

  getKey(baseKey: string): string {
    return getScopedStorageKey(this.userId, baseKey);
  }

  getItem<T = any>(baseKey: string, defaultValue: T | null = null): T | null {
    if (!this.storage) return defaultValue;
    try {
      const key = this.getKey(baseKey);
      const raw = this.storage.getItem(key);
      if (raw === null) return defaultValue;
      try {
        return JSON.parse(raw);
      } catch {
        return raw as unknown as T;
      }
    } catch {
      return defaultValue;
    }
  }

  setItem<T = any>(baseKey: string, value: T): boolean {
    if (!this.storage) return false;
    try {
      const key = this.getKey(baseKey);
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      this.storage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }

  removeItem(baseKey: string): boolean {
    if (!this.storage) return false;
    try {
      const key = this.getKey(baseKey);
      this.storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  clearUserData(): number {
    if (!this.storage) return 0;
    try {
      const prefix = this.userId && this.userId.trim()
        ? `yarvelle_${this.userId.trim()}_`
        : 'yarvelle_guest_';
      const keysToRemove: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const k = this.storage.key(i);
        if (k && k.startsWith(prefix)) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        this.storage.removeItem(k);
      }
      return keysToRemove.length;
    } catch {
      return 0;
    }
  }

  listUserKeys(): string[] {
    if (!this.storage) return [];
    try {
      const prefix = this.userId && this.userId.trim()
        ? `yarvelle_${this.userId.trim()}_`
        : 'yarvelle_guest_';
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const k = this.storage.key(i);
        if (k && k.startsWith(prefix)) {
          keys.push(k.substring(prefix.length));
        }
      }
      return keys;
    } catch {
      return [];
    }
  }
}

export function migrateUserStorage(
  sourceUserId: string | null | undefined,
  targetUserId: string,
  storage?: Storage | null
): number {
  const store = storage !== undefined
    ? storage
    : (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store || !targetUserId || !targetUserId.trim()) return 0;

  try {
    const sourceStore = new ScopedStorage({ userId: sourceUserId, storage: store });
    const targetStore = new ScopedStorage({ userId: targetUserId, storage: store });
    const keys = sourceStore.listUserKeys();
    let migratedCount = 0;
    for (const baseKey of keys) {
      const val = sourceStore.getItem(baseKey);
      if (val !== null) {
        if (targetStore.setItem(baseKey, val)) {
          sourceStore.removeItem(baseKey);
          migratedCount++;
        }
      }
    }
    return migratedCount;
  } catch {
    return 0;
  }
}

export function detachUserSession(userId?: string | null): void {
  const targetId = (userId !== undefined && userId !== null) ? userId : activeStorageUserId;
  const store = new ScopedStorage({ userId: targetId });
  store.clearUserData();
  activeStorageUserId = null;
  scopedStorage.setUserId(null);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (
          k.startsWith('yarvelle_msgs_') ||
          k.startsWith('yarvelle_thread_') ||
          (targetId && k.startsWith(`yarvelle_${targetId}_`))
        )) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        window.localStorage.removeItem(k);
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(STORAGE_DETACHED_EVENT, { detail: { userId: targetId } }));
    } catch {}
  }
}

export const scopedStorage = new ScopedStorage();
