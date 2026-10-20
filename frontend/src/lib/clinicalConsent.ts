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

import {
  FORBIDDEN_INTENT_DESCRIPTIONS,
  formatForbiddenIntent,
  describeForbiddenIntent,
} from './utils';
import { getScopedStorageKey, getStorageUserId } from './storageNamespace';

export const CLINICAL_CONSENT_STORAGE_KEY_PREFIX = 'yarvelle_clinical_consent_v1';
export const CLINICAL_CONSENT_STORAGE_KEY = 'yarvelle_clinical_consent_v1';
export const CLINICAL_CONSENT_CHANGED_EVENT = 'yarvelle:clinical-consent-changed';
export const CLINICAL_ASSIST_RISK_CLASS = 'clinical_assist';

export interface ClinicalConsentRecord {
  grantedAt: string;
}

export type ClinicalConsentMap = Record<string, ClinicalConsentRecord>;

const AGENT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const DEFAULT_FORBIDDEN_INTENTS = [
  'diagnose',
  'prescribe',
  'dose',
  'replace_emergency_care',
  'instruct_stop_medication',
] as const;

export { FORBIDDEN_INTENT_DESCRIPTIONS, formatForbiddenIntent, describeForbiddenIntent };

export function requiresClinicalConsent(riskClass: string | undefined | null): boolean {
  return (riskClass || '').trim().toLowerCase() === CLINICAL_ASSIST_RISK_CLASS;
}

function isValidRecord(value: unknown): value is ClinicalConsentRecord {
  if (!value || typeof value !== 'object') return false;
  const grantedAt = (value as { grantedAt?: unknown }).grantedAt;
  return typeof grantedAt === 'string' && !Number.isNaN(Date.parse(grantedAt));
}

export function getProfileConsentKey(profileId: string = 'me', userId?: string | null): string {
  const effectiveUserId = userId !== undefined ? userId : getStorageUserId();
  const baseKey = `${CLINICAL_CONSENT_STORAGE_KEY_PREFIX}_${profileId}`;
  return getScopedStorageKey(effectiveUserId, baseKey);
}

function resolveProfileAndUser(
  arg1?: string | null,
  arg2?: string | null
): { profileId: string; userId?: string | null } {
  if (arg2 !== undefined) {
    return { profileId: arg1 || 'me', userId: arg2 };
  }
  if (!arg1) {
    return { profileId: 'me', userId: undefined };
  }
  if (arg1.startsWith('usr-') || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(arg1)) {
    return { profileId: 'me', userId: arg1 };
  }
  return { profileId: arg1, userId: undefined };
}

export function loadClinicalConsents(
  profileIdOrUserId?: string | null,
  explicitUserId?: string | null
): ClinicalConsentMap {
  if (typeof window === 'undefined') return {};
  try {
    const { profileId, userId } = resolveProfileAndUser(profileIdOrUserId, explicitUserId);
    const effectiveUserId = userId !== undefined ? userId : getStorageUserId();
    const key = getProfileConsentKey(profileId, userId);

    let raw = window.localStorage.getItem(key);
    if (!raw && (profileId === 'me' || profileId === 'default')) {
      const legacyKey = getScopedStorageKey(effectiveUserId, CLINICAL_CONSENT_STORAGE_KEY);
      raw =
        window.localStorage.getItem(legacyKey) ||
        (!effectiveUserId ? window.localStorage.getItem(CLINICAL_CONSENT_STORAGE_KEY) : null);
    }

    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const result: ClinicalConsentMap = {};
    for (const [agentId, record] of Object.entries(parsed as Record<string, unknown>)) {
      if (AGENT_ID_PATTERN.test(agentId) && isValidRecord(record)) {
        result[agentId] = { grantedAt: record.grantedAt };
      }
    }
    return result;
  } catch {
    return {};
  }
}

function persist(
  consents: ClinicalConsentMap,
  profileId: string = 'me',
  userId?: string | null
): void {
  if (typeof window === 'undefined') return;
  const effectiveUserId = userId !== undefined ? userId : getStorageUserId();
  const profileKey = getProfileConsentKey(profileId, userId);
  const legacyKey = getScopedStorageKey(effectiveUserId, CLINICAL_CONSENT_STORAGE_KEY);

  try {
    if (Object.keys(consents).length === 0) {
      window.localStorage.removeItem(profileKey);
      if (profileId === 'me' || profileId === 'default') {
        window.localStorage.removeItem(legacyKey);
        if (!effectiveUserId) {
          window.localStorage.removeItem(CLINICAL_CONSENT_STORAGE_KEY);
        }
      }
    } else {
      const serialized = JSON.stringify(consents);
      window.localStorage.setItem(profileKey, serialized);
      if (profileId === 'me' || profileId === 'default') {
        window.localStorage.setItem(legacyKey, serialized);
        if (!effectiveUserId) {
          window.localStorage.setItem(CLINICAL_CONSENT_STORAGE_KEY, serialized);
        }
      }
    }
  } catch {}
  try {
    window.dispatchEvent(
      new CustomEvent(CLINICAL_CONSENT_CHANGED_EVENT, { detail: { profileId } })
    );
  } catch {}
}

export function hasClinicalConsent(
  agentId: string | undefined | null,
  profileIdOrUserId?: string | null,
  explicitUserId?: string | null
): boolean {
  if (!agentId || !AGENT_ID_PATTERN.test(agentId)) return false;
  const { profileId, userId } = resolveProfileAndUser(profileIdOrUserId, explicitUserId);
  return Object.prototype.hasOwnProperty.call(loadClinicalConsents(profileId, userId), agentId);
}

export function grantClinicalConsent(
  agentId: string,
  now: Date = new Date(),
  profileIdOrUserId?: string | null,
  explicitUserId?: string | null
): ClinicalConsentRecord | null {
  if (!AGENT_ID_PATTERN.test(agentId)) return null;
  const { profileId, userId } = resolveProfileAndUser(profileIdOrUserId, explicitUserId);
  const record: ClinicalConsentRecord = { grantedAt: now.toISOString() };
  persist({ ...loadClinicalConsents(profileId, userId), [agentId]: record }, profileId, userId);
  return record;
}

export function withdrawClinicalConsent(
  agentId: string,
  profileIdOrUserId?: string | null,
  explicitUserId?: string | null
): void {
  const { profileId, userId } = resolveProfileAndUser(profileIdOrUserId, explicitUserId);
  const consents = loadClinicalConsents(profileId, userId);
  if (!Object.prototype.hasOwnProperty.call(consents, agentId)) return;
  delete consents[agentId];
  persist(consents, profileId, userId);
}

export function withdrawAllClinicalConsents(
  profileIdOrUserId?: string | null,
  explicitUserId?: string | null
): void {
  const { profileId, userId } = resolveProfileAndUser(profileIdOrUserId, explicitUserId);
  persist({}, profileId, userId);
}
