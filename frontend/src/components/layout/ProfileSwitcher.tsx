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

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Check, Users, ChevronsUpDown, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth, DEFAULT_STEWARD_USER } from '@/lib/auth';
import {
  type HouseholdProfile,
  loadHouseholdProfiles,
  fetchHouseholdProfiles,
  switchProfileRoute,
  HOUSEHOLD_PROFILES_CHANGED_EVENT,
} from '@/lib/familyProfiles';

export interface ProfileSwitcherProps {
  activeProfileId?: string;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: 'desktop-popover' | 'mobile-sheet' | 'auto';
  onProfileSelect?: (profile: HouseholdProfile) => void;
  renderTrigger?: boolean;
  hideDefaultTrigger?: boolean;
  className?: string;
}

export function ProfileSwitcher({
  activeProfileId: activeProfileIdProp,
  isOpen: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  mode = 'auto',
  onProfileSelect,
  renderTrigger = true,
  hideDefaultTrigger = false,
  className,
}: ProfileSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const [profiles, setProfiles] = useState<HouseholdProfile[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);

  const listboxRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  const shouldRenderTrigger = renderTrigger && !hideDefaultTrigger;

  const derivedProfileId = useMemo(() => {
    if (activeProfileIdProp) return activeProfileIdProp;
    const match = pathname.match(/^\/p\/([^/]+)/);
    return match ? match[1] : 'me';
  }, [activeProfileIdProp, pathname]);

  const activeProfile = useMemo(() => {
    const userFallbackName = user?.full_name?.trim() || user?.username?.trim() || 'Me';
    const primarySelfProfile = profiles.find((p) => p.role === 'self' || p.relationship?.toLowerCase() === 'self');
    const matched =
      profiles.find((p) => p.id === derivedProfileId) ||
      (derivedProfileId === 'me' ? primarySelfProfile : undefined) ||
      profiles[0];

    if (matched) {
      const isSelf = matched.role === 'self' || matched.relationship?.toLowerCase() === 'self' || derivedProfileId === 'me';
      const resolvedName = (isSelf && (matched.name === 'Me' || !matched.name)) ? userFallbackName : matched.name;
      return {
        ...matched,
        name: resolvedName,
        shortName: matched.shortName || (resolvedName ? resolvedName.split(/\s+/)[0] : 'Me'),
      };
    }

    const fallback: HouseholdProfile = {
      id: derivedProfileId,
      name: derivedProfileId === 'me' ? userFallbackName : derivedProfileId,
      relationship: 'Self',
      role: 'self',
      audience: 'adult',
      colorSlot: 1,
    };
    return fallback;
  }, [profiles, derivedProfileId, user]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    const refresh = () => {
      setProfiles(loadHouseholdProfiles());
    };
    refresh();
    fetchHouseholdProfiles().catch(() => {});
    window.addEventListener(HOUSEHOLD_PROFILES_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(HOUSEHOLD_PROFILES_CHANGED_EVENT, refresh);
    };
  }, []);

  // Sequential "G then P" keyboard shortcut
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT'
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const now = Date.now();

      if (lastKey === 'g' && key === 'p' && now - lastKeyTime < 1000) {
        e.preventDefault();
        handleOpenChange(true);
        lastKey = '';
        lastKeyTime = 0;
        return;
      }

      if (key === 'g') {
        lastKey = 'g';
        lastKeyTime = now;
      } else {
        lastKey = '';
        lastKeyTime = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenChange]);

  const handleSelectProfile = (profile: HouseholdProfile) => {
    setAnnouncement(`Switched active profile to ${profile.name}`);
    onProfileSelect?.(profile);
    handleOpenChange(false);
    const targetUrl = switchProfileRoute(pathname, profile.id);
    router.push(targetUrl);
  };

  const handleListboxKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    if (e.key === 'Tab') {
      if (!listboxRef.current) return;
      const focusables = Array.from(
        listboxRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');

      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === listboxRef.current) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % Math.max(1, profiles.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + profiles.length) % Math.max(1, profiles.length));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (profiles[focusedIndex]) {
        handleSelectProfile(profiles[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleOpenChange(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, handleOpenChange]);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      const activeIdx = profiles.findIndex((p) => p.id === derivedProfileId);
      setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
      listboxRef.current?.focus();
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
      previousActiveElement.current = null;
    }
  }, [isOpen, profiles, derivedProfileId]);

  return (
    <>
      {/* Screen Reader Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
        data-testid="profile-switcher-live-region"
      >
        {announcement}
      </div>

      {/* Default Trigger Button (only rendered when shouldRenderTrigger is true) */}
      {shouldRenderTrigger && (
        <div className={cn('relative inline-block w-full', className)}>
          <button
            type="button"
            onClick={() => handleOpenChange(!isOpen)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls="profile-switcher-listbox"
            aria-label={`Switch person. Current: ${activeProfile.name}`}
            data-testid="profile-switcher-trigger"
            className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[var(--cf-surface)] border border-[var(--cf-border)] shadow-sm text-left hover:bg-[var(--cf-surface-2)] hover:border-[var(--cf-border-strong)] transition-all min-h-[56px] focus-visible:outline-2 focus-visible:outline-[var(--cf-focus)]"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar
                name={activeProfile.name}
                colorSlot={activeProfile.colorSlot || 1}
                size="md"
                className="shrink-0"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-[var(--cf-fg)] truncate">
                  {activeProfile.name}
                </span>
                <span className="text-xs text-[var(--cf-fg-subtle)] truncate">
                  <span>{activeProfile.relationship || 'Self'}</span>
                  {activeProfile.age ? ` · ${activeProfile.age}` : ''}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-[var(--cf-fg-subtle)] shrink-0" />
          </button>
        </div>
      )}

      {/* Modal Dialog & Overlay (Always rendered in an unhidden viewport container) */}
      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 z-50 flex',
            mode === 'mobile-sheet'
              ? 'items-end sm:items-center sm:justify-center'
              : 'items-start justify-start'
          )}
        >
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
            onClick={() => handleOpenChange(false)}
            aria-hidden="true"
          />

          {/* Listbox Container */}
          <div
            ref={listboxRef}
            id="profile-switcher-listbox"
            role="listbox"
            aria-label="Care profiles"
            tabIndex={0}
            onKeyDown={handleListboxKeyDown}
            data-testid="profile-switcher-listbox"
            className={cn(
              'relative z-50 w-72 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] shadow-xl p-2 focus:outline-none transition-all',
              mode === 'mobile-sheet'
                ? 'fixed inset-x-0 bottom-0 start-0 end-0 w-full rounded-b-none border-x-0 border-b-0 max-h-[85vh] duration-200'
                : 'mt-20 ms-3'
            )}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--cf-border)] mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--cf-fg-subtle)]">
                Care Profiles
              </span>
              <kbd className="text-xs font-mono px-1.5 py-0.5 rounded bg-[var(--cf-surface-2)] text-[var(--cf-fg-subtle)] border border-[var(--cf-border)]">
                G then P
              </kbd>
            </div>

            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto py-1">
              {profiles.map((profile, index) => {
                const isSelected = profile.id === derivedProfileId;
                const isFocused = index === focusedIndex;
                const audienceLabel = profile.audience
                  ? profile.audience.charAt(0).toUpperCase() + profile.audience.slice(1)
                  : profile.role === 'self'
                  ? 'Personal'
                  : profile.role === 'guardian'
                  ? 'Managed'
                  : 'Viewer';

                return (
                  <div
                    key={profile.id}
                    role="option"
                    id={`profile-option-${profile.id}`}
                    aria-selected={isSelected}
                    onClick={() => handleSelectProfile(profile)}
                    data-testid={`profile-option-${profile.id}`}
                    className={cn(
                      'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer min-h-[56px] transition-all select-none',
                      isSelected ? 'bg-[var(--cf-surface-2)] text-[var(--cf-fg)] font-medium' : 'hover:bg-[var(--cf-surface-2)] text-[var(--cf-fg)]',
                      isFocused && !isSelected && 'ring-1 ring-[var(--cf-focus)]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar
                        name={profile.name}
                        colorSlot={profile.colorSlot || 1}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate text-[var(--cf-fg)]">
                          {profile.name}
                        </span>
                        <span className="text-xs text-[var(--cf-fg-subtle)] truncate">
                          {profile.relationship} {profile.age ? `· ${profile.age}` : ''} · {audienceLabel}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check
                        className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-label="Active"
                        data-testid="profile-active-check"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-[var(--cf-border)] mt-1 flex flex-col gap-1">
              <Link
                href="/family"
                onClick={() => handleOpenChange(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--cf-fg-muted)] hover:text-[var(--cf-fg)] hover:bg-[var(--cf-surface-2)] transition-all min-h-[38px]"
              >
                <Users className="w-4 h-4 text-[var(--cf-fg-subtle)]" />
                <span>Manage family &amp; profiles &rarr;</span>
              </Link>

              {Boolean(user && user.id !== DEFAULT_STEWARD_USER.id) ? (
                <button
                  type="button"
                  onClick={async () => {
                    handleOpenChange(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all min-h-[38px] text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign out (@{user?.username || 'user'})</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 pt-1">
                  <Link
                    href="/login"
                    onClick={() => handleOpenChange(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all min-h-[38px]"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => handleOpenChange(false)}
                    className="flex-1 flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold text-[var(--cf-fg)] bg-[var(--cf-surface-2)] hover:bg-[var(--cf-surface-3)] transition-all min-h-[38px]"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
