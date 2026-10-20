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

export type AudienceBand = 'adult' | 'teen' | 'child' | 'viewer';
export type ProfileRole = 'self' | 'guardian' | 'viewer' | 'steward' | 'member';

export interface HouseholdProfile {
  id: string;
  name: string;
  shortName?: string;
  relationship: string;
  age?: number;
  dateOfBirth?: string;
  role: ProfileRole;
  audience?: AudienceBand;
  colorSlot: 1 | 2 | 3 | 4 | 5;
  avatarUrl?: string;
  scopes?: string[];
  viewers?: string[];
  stats?: {
    chats: number;
    items: number;
  };
}

export type CareProfile = HouseholdProfile;
export type HouseholdMemberProfile = HouseholdProfile;

export const HOUSEHOLD_PROFILES_STORAGE_KEY = 'yarvelle_household_profiles_v1';
export const HOUSEHOLD_PROFILES_CHANGED_EVENT = 'yarvelle:household-profiles-changed';

export const DEFAULT_HOUSEHOLD_PROFILES: HouseholdProfile[] = [
  {
    id: 'me',
    name: 'Leo',
    shortName: 'Leo',
    relationship: 'Self',
    age: 38,
    dateOfBirth: '1988-04-12',
    role: 'self',
    audience: 'adult',
    colorSlot: 1,
    scopes: ['health.*', 'finance.*', 'education.*', 'household.*'],
    stats: { chats: 12, items: 28 },
  },
  {
    id: 'rosa',
    name: 'Rosa',
    shortName: 'Rosa',
    relationship: 'Partner',
    age: 36,
    dateOfBirth: '1990-09-24',
    role: 'guardian',
    audience: 'adult',
    colorSlot: 2,
    scopes: ['health.*', 'finance.*', 'education.*', 'household.*'],
    stats: { chats: 8, items: 19 },
  },
  {
    id: 'maya',
    name: 'Maya',
    shortName: 'Maya',
    relationship: 'Daughter',
    age: 15,
    dateOfBirth: '2011-06-18',
    role: 'member',
    audience: 'teen',
    colorSlot: 3,
    scopes: ['health.*', 'education.*', 'household.*'],
    stats: { chats: 15, items: 34 },
  },
  {
    id: 'sam',
    name: 'Sam',
    shortName: 'Sam',
    relationship: 'Son',
    age: 9,
    dateOfBirth: '2017-02-05',
    role: 'member',
    audience: 'child',
    colorSlot: 4,
    scopes: ['education.*', 'household.*'],
    stats: { chats: 4, items: 11 },
  },
];

let inMemoryProfileCache: HouseholdProfile[] | null = null;

export function deriveAudienceBand(age?: number, role?: string): AudienceBand {
  if (role === 'viewer') return 'viewer';
  if (typeof age === 'number') {
    if (age < 13) return 'child';
    if (age < 18) return 'teen';
    return 'adult';
  }
  return 'adult';
}

export function loadHouseholdProfiles(): HouseholdProfile[] {
  if (typeof window === 'undefined') {
    return inMemoryProfileCache ?? [...DEFAULT_HOUSEHOLD_PROFILES];
  }
  try {
    const raw = window.localStorage.getItem(HOUSEHOLD_PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryProfileCache = parsed;
        return parsed;
      }
    }
  } catch {}
  inMemoryProfileCache = [...DEFAULT_HOUSEHOLD_PROFILES];
  return inMemoryProfileCache;
}

export function saveHouseholdProfiles(profiles: HouseholdProfile[]): void {
  inMemoryProfileCache = [...profiles];
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HOUSEHOLD_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    window.dispatchEvent(new CustomEvent(HOUSEHOLD_PROFILES_CHANGED_EVENT));
  } catch {}
}

export function getHouseholdProfile(id: string | null | undefined): HouseholdProfile | null {
  if (!id) return null;
  const profiles = loadHouseholdProfiles();
  const cleanId = id.trim().toLowerCase();
  const found = profiles.find((p) => p.id.toLowerCase() === cleanId);
  if (found) return found;
  if (cleanId === 'me') {
    const self = profiles.find((p) => p.role === 'self' || p.relationship.toLowerCase() === 'self');
    if (self) return self;
    return profiles[0] || null;
  }
  return null;
}

export async function fetchHouseholdProfiles(): Promise<HouseholdProfile[]> {
  try {
    const res = await fetch('/api/v1/profiles', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: HouseholdProfile[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          shortName: p.short_name || (p.name ? p.name.split(/\s+/)[0] : undefined),
          relationship: p.relationship || 'Self',
          role: (p.role as ProfileRole) || 'self',
          audience: deriveAudienceBand(p.age, p.role),
          colorSlot: (Number(p.avatar_color) >= 1 && Number(p.avatar_color) <= 5) ? Number(p.avatar_color) as 1|2|3|4|5 : 1,
          age: p.age,
          dateOfBirth: p.date_of_birth,
          avatarUrl: p.avatar_url,
          scopes: p.scopes || ['health.*', 'finance.*', 'education.*', 'household.*'],
          stats: { chats: p.stats?.chats || 0, items: p.stats?.items || 0 },
        }));
        saveHouseholdProfiles(mapped);
        return mapped;
      }
    }
  } catch {}
  return loadHouseholdProfiles();
}

export function switchProfileRoute(currentPath: string, newProfileId: string): string {
  const safeId = encodeURIComponent(String(newProfileId).replace(/[^a-zA-Z0-9_\-]/g, '')) || 'me';
  const match = currentPath.match(/^\/p\/([^/?#]+)(.*)$/);
  if (match) {
    const subpath = match[2] || '';
    return `/p/${safeId}${subpath}`;
  }
  return `/p/${safeId}`;
}

export async function updateHouseholdProfile(
  idOrProfile: string | (Partial<HouseholdProfile> & { id: string }),
  maybeUpdates?: Partial<HouseholdProfile>
): Promise<HouseholdProfile | null> {
  const id = typeof idOrProfile === 'string' ? idOrProfile : idOrProfile.id;
  const updates = typeof idOrProfile === 'string' ? maybeUpdates || {} : idOrProfile;
  const profiles = loadHouseholdProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx !== -1) {
    profiles[idx] = { ...profiles[idx], ...updates };
    saveHouseholdProfiles(profiles);
    return profiles[idx];
  }
  return null;
}

export interface TeenHandoverStatus {
  isEligible: boolean;
  isApproaching18: boolean;
  hasReached18: boolean;
  daysRemaining: number;
  turning18Date: string;
  isDismissed: boolean;
  shouldShowReminder: boolean;
}

export function checkTeenHandoverStatus(
  profile: { id: string; dateOfBirth?: string; age?: number },
  referenceDate: Date = new Date()
): TeenHandoverStatus {
  const DISMISSAL_KEY = `yarvelle_teen_handover_dismissed_${profile.id}`;

  let isDismissed = false;
  if (typeof window !== 'undefined') {
    try {
      const dismissedRaw = window.localStorage.getItem(DISMISSAL_KEY);
      if (dismissedRaw) {
        const dismissedAt = new Date(dismissedRaw);
        const diffDays = (referenceDate.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 30) {
          isDismissed = true;
        }
      }
    } catch {}
  }

  let daysRemaining = 999;
  let turning18Date = '';
  let isApproaching18 = false;
  let hasReached18 = false;

  if (profile.dateOfBirth) {
    const dob = new Date(profile.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      const b18 = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
      turning18Date = b18.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const diffMs = b18.getTime() - referenceDate.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0 && daysRemaining >= -90) {
        hasReached18 = true;
      } else if (daysRemaining > 0 && daysRemaining <= 90) {
        isApproaching18 = true;
      }
    }
  } else if (profile.age !== undefined) {
    if (profile.age === 18) {
      hasReached18 = true;
      daysRemaining = 0;
    } else if (profile.age === 17) {
      isApproaching18 = true;
      daysRemaining = 45;
    }
  }

  const shouldShowReminder = (isApproaching18 || hasReached18) && !isDismissed;

  return {
    isEligible: isApproaching18 || hasReached18,
    isApproaching18,
    hasReached18,
    daysRemaining,
    turning18Date,
    isDismissed,
    shouldShowReminder,
  };
}

export function dismissTeenHandoverReminder(
  profileId: string,
  dismissedAt: Date = new Date()
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `yarvelle_teen_handover_dismissed_${profileId}`,
      dismissedAt.toISOString()
    );
  } catch {}
}

export interface ViewerInvite {
  id: string;
  inviteeName: string;
  targetProfileId: string;
  targetProfileName: string;
  permissions: {
    view_health: boolean;
    view_finance: boolean;
    view_education: boolean;
    view_household: boolean;
  };
  expiresInDays: number;
  inviteCode: string;
  createdAt: string;
}

export async function createViewerInvite(
  profileId: string,
  input: {
    inviteeName: string;
    targetProfileName?: string;
    viewHealth?: boolean;
    viewFinance?: boolean;
    viewEducation?: boolean;
    viewHousehold?: boolean;
    expiresInDays?: number;
  }
): Promise<ViewerInvite> {
  const randomBytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  }
  const hexCode = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  const invite: ViewerInvite = {
    id: `inv-${Date.now()}`,
    inviteeName: input.inviteeName.trim(),
    targetProfileId: profileId,
    targetProfileName: input.targetProfileName || profileId,
    permissions: {
      view_health: Boolean(input.viewHealth ?? true),
      view_finance: Boolean(input.viewFinance ?? false),
      view_education: Boolean(input.viewEducation ?? false),
      view_household: Boolean(input.viewHousehold ?? false),
    },
    expiresInDays: input.expiresInDays || 30,
    inviteCode: `yv-inv-${hexCode || 'LOCAL1'}`,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('yarvelle_viewer_invitations');
      const list = stored ? JSON.parse(stored) : [];
      list.push(invite);
      window.localStorage.setItem('yarvelle_viewer_invitations', JSON.stringify(list));
    } catch {}
  }

  return invite;
}

export async function revokeViewerInvite(profileId: string, inviteId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('yarvelle_viewer_invitations');
      if (stored) {
        const list = JSON.parse(stored);
        const filtered = list.filter((i: any) => i.id !== inviteId);
        window.localStorage.setItem('yarvelle_viewer_invitations', JSON.stringify(filtered));
      }
    } catch {}
  }
  return true;
}

