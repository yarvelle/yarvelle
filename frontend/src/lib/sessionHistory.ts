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

import { getScopedStorageKey, getStorageUserId } from './storageNamespace';

export const YARVELLE_THREADS_INDEX_KEY = 'yarvelle_threads_index_v1';
export const CAREFOLD_THREADS_INDEX_KEY = 'carefold_threads_index_v1';
export const MAX_INDEXED_SESSIONS = 50;

export interface ChatSessionMeta {
  id: string;
  agentId: string;
  agentTitle?: string;
  domain?: 'health' | 'finance' | 'education' | 'household' | 'system';
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  profileId?: string;
  isCustomTitle?: boolean;
}

/**
 * Clean and truncate raw user prompt into a readable session title up to 45 chars.
 */
export function cleanAutoTitle(text: string): string {
  if (!text || typeof text !== 'string') return 'New Consultation';

  // Strip markdown headers, bold, italics, code ticks, blockquotes, and excessive whitespace
  const cleaned = text
    .replace(/^#+\s+/gm, '')
    .replace(/[*_~`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'New Consultation';

  if (cleaned.length <= 45) {
    return cleaned;
  }

  // Truncate cleanly at word boundary if possible
  const truncated = cleaned.slice(0, 45);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 25) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}

function getRawIndex(userId?: string | null): ChatSessionMeta[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const effectiveUserId = userId !== undefined ? userId : getStorageUserId();
    const primaryKey = getScopedStorageKey(effectiveUserId, YARVELLE_THREADS_INDEX_KEY);
    const legacyKey = getScopedStorageKey(effectiveUserId, CAREFOLD_THREADS_INDEX_KEY);

    let raw = window.localStorage.getItem(primaryKey);
    if (!raw) {
      raw = window.localStorage.getItem(legacyKey);
    }
    if (!raw && !effectiveUserId) {
      raw =
        window.localStorage.getItem(YARVELLE_THREADS_INDEX_KEY) ||
        window.localStorage.getItem(CAREFOLD_THREADS_INDEX_KEY);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setRawIndex(sessions: ChatSessionMeta[], userId?: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const effectiveUserId = userId !== undefined ? userId : getStorageUserId();
    const primaryKey = getScopedStorageKey(effectiveUserId, YARVELLE_THREADS_INDEX_KEY);
    const safeSessions = sessions.map((s) => ({
      id: String(s.id).replace(/[^a-zA-Z0-9_\-:]/g, ''),
      agentId: String(s.agentId).replace(/[^a-zA-Z0-9_\-]/g, ''),
      agentTitle: s.agentTitle ? String(s.agentTitle).slice(0, 80) : undefined,
      domain: s.domain,
      profileId: s.profileId,
      title: String(s.title || 'New Consultation').slice(0, 100),
      createdAt: String(s.createdAt),
      updatedAt: String(s.updatedAt),
      messageCount: Number(s.messageCount) || 0,
      ...(s.isCustomTitle !== undefined ? { isCustomTitle: Boolean(s.isCustomTitle) } : {}),
    }));
    const serialized = JSON.stringify(safeSessions);
    window.localStorage.setItem(primaryKey, serialized);
    if (!effectiveUserId) {
      window.localStorage.setItem(YARVELLE_THREADS_INDEX_KEY, serialized);
    }
  } catch {
    // Storage access protection
  }
}

function notifySessionsChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('yarvelle:sessions-changed'));
  window.dispatchEvent(new CustomEvent('carefold:sessions-changed'));
}

export function listSessions(userId?: string | null): ChatSessionMeta[] {
  const index = getRawIndex(userId);
  return index.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getSession(sessionId: string, userId?: string | null): ChatSessionMeta | null {
  const index = getRawIndex(userId);
  return index.find((s) => s.id === sessionId) || null;
}

export function deleteSession(sessionId: string, userId?: string | null): void {
  if (!sessionId) return;
  const current = getRawIndex(userId);
  const filtered = current.filter((s) => s.id !== sessionId);
  setRawIndex(filtered, userId);

  // Clear messages from storage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const effectiveUserId = userId !== undefined ? userId : getStorageUserId();
      const msgKeyYarvelle = getScopedStorageKey(effectiveUserId, `msgs_${sessionId}`);
      const msgKeyCarefold = getScopedStorageKey(effectiveUserId, `carefold_msgs_${sessionId}`);
      window.localStorage.removeItem(msgKeyYarvelle);
      window.localStorage.removeItem(msgKeyCarefold);
      window.localStorage.removeItem(`yarvelle_msgs_${sessionId}`);
      window.localStorage.removeItem(`carefold_msgs_${sessionId}`);
    } catch {}
  }

  notifySessionsChanged();
}

export function renameSession(sessionId: string, title: string, userId?: string | null): void {
  const current = getRawIndex(userId);
  const target = current.find((s) => s.id === sessionId);
  if (!target) return;

  target.title = title.trim() || 'New Consultation';
  target.isCustomTitle = true;
  target.updatedAt = new Date().toISOString();
  setRawIndex(current, userId);
  notifySessionsChanged();
}

export function upsertSessionFromMessages(
  sessionId: string,
  agentId: string,
  messages: any[],
  agentTitle?: string,
  userId?: string | null,
  profileId?: string
): ChatSessionMeta {
  const current = getRawIndex(userId);
  const existing = current.find((s) => s.id === sessionId);

  const nowIso = new Date().toISOString();
  const firstUserMsg = Array.isArray(messages)
    ? messages.find((m) => m && m.role === 'user')
    : null;

  let title = existing?.title || 'New Consultation';
  if (!existing?.isCustomTitle && firstUserMsg && typeof firstUserMsg.content === 'string') {
    title = cleanAutoTitle(firstUserMsg.content);
  }

  const meta: ChatSessionMeta = {
    id: sessionId,
    agentId,
    agentTitle: agentTitle || existing?.agentTitle,
    title,
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
    messageCount: Array.isArray(messages) ? messages.length : 0,
    profileId: profileId || existing?.profileId,
    isCustomTitle: existing?.isCustomTitle,
  };

  const updatedList = [meta, ...current.filter((s) => s.id !== sessionId)].slice(
    0,
    MAX_INDEXED_SESSIONS
  );
  setRawIndex(updatedList, userId);
  notifySessionsChanged();
  return meta;
}
