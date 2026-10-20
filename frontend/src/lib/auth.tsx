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

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { UserProfile, AuthProvidersInfo } from '../types/api';
import { setStorageUserId, getStorageUserId, detachUserSession } from './storageNamespace';
import { fetchHouseholdProfiles } from './familyProfiles';

export const DEFAULT_STEWARD_USER: UserProfile = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'steward@local.yarvelle',
  username: 'steward',
  full_name: 'Care Steward',
  role: 'admin',
  status: 'active',
  auth_provider: 'disabled',
  created_at: '2026-10-01T00:00:00Z',
};

export interface LoginOptions {
  username?: string;
  email?: string;
  username_or_email?: string;
  password: string;
}

export interface RegisterOptions {
  email: string;
  username: string;
  password: string;
  full_name?: string | null;
  fullName?: string | null;
}

export interface ChangePasswordOptions {
  current_password?: string;
  currentPassword?: string;
  new_password?: string;
  newPassword?: string;
}

export interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSteward: boolean;
  authProvider: 'disabled' | 'local' | 'oidc' | string;
  activeProvider: 'disabled' | 'local' | 'oidc' | string;
  registrationEnabled: boolean;
  allowRegistration: boolean;
  minPasswordLength: number;
  ssoProviders: string[];
  hasAdmin: boolean;
  needsAdminSetup: boolean;
  login: (usernameOrOpts: string | LoginOptions, password?: string) => Promise<UserProfile>;
  register: (
    emailOrOpts: string | RegisterOptions,
    username?: string,
    password?: string,
    fullName?: string | null
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  changePassword: (
    currentOrOpts: string | ChangePasswordOptions,
    newPass?: string
  ) => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const userRef = useRef<UserProfile | null>(null);
  userRef.current = user;
  const isLoggingOutRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [providersInfo, setProvidersInfo] = useState<AuthProvidersInfo>({
    active_provider: 'local',
    sso_providers: [],
    registration_enabled: true,
  });

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    if (isLoggingOutRef.current) {
      return null;
    }
    let activeMode: string = 'local';
    try {
      try {
        const provRes = await fetch('/api/v1/auth/providers', { cache: 'no-store' });
        if (provRes.ok) {
          const provData: AuthProvidersInfo = await provRes.json();
          setProvidersInfo(provData);
          activeMode = provData.active_provider || 'local';
        }
      } catch {}

      if (isLoggingOutRef.current) {
        return null;
      }

      const meRes = await fetch('/api/v1/auth/me', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (isLoggingOutRef.current) {
        return null;
      }

      if (meRes.ok) {
        const data = await meRes.json();
        const loadedUser: UserProfile = data.user || data;
        if (isLoggingOutRef.current) {
          return null;
        }
        setUser(loadedUser);
        try {
          await fetchHouseholdProfiles();
        } catch {}
        return loadedUser;
      } else {
        if (activeMode === 'disabled' && !isLoggingOutRef.current) {
          setUser(DEFAULT_STEWARD_USER);
          return DEFAULT_STEWARD_USER;
        } else {
          setUser(null);
          if (typeof document !== 'undefined') {
            document.cookie = 'yarvelle_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'yarvelle_active_profile=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
          return null;
        }
      }
    } catch {
      if (activeMode === 'disabled' && !isLoggingOutRef.current) {
        setUser(DEFAULT_STEWARD_USER);
        return DEFAULT_STEWARD_USER;
      }
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (usernameOrOpts: string | LoginOptions, password?: string): Promise<UserProfile> => {
      isLoggingOutRef.current = false;
      let payload: Record<string, any>;
      if (typeof usernameOrOpts === 'string') {
        payload = { username: usernameOrOpts, password: password || '' };
      } else {
        payload = {
          username: usernameOrOpts.username || usernameOrOpts.username_or_email || usernameOrOpts.email,
          password: usernameOrOpts.password,
        };
      }

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || 'Authentication failed. Please verify your credentials.');
      }

      const data = await res.json();
      const authenticatedUser: UserProfile = data.user || data;
      setUser(authenticatedUser);
      try {
        await fetchHouseholdProfiles();
      } catch {}
      return authenticatedUser;
    },
    []
  );

  const register = useCallback(
    async (
      emailOrOpts: string | RegisterOptions,
      username?: string,
      password?: string,
      fullName?: string | null
    ): Promise<UserProfile> => {
      isLoggingOutRef.current = false;
      let payload: Record<string, any>;
      if (typeof emailOrOpts === 'string') {
        payload = {
          email: emailOrOpts,
          username: username || '',
          password: password || '',
          full_name: fullName || null,
        };
      } else {
        payload = {
          email: emailOrOpts.email,
          username: emailOrOpts.username,
          password: emailOrOpts.password,
          full_name: emailOrOpts.full_name || emailOrOpts.fullName || null,
        };
      }

      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || 'Registration failed.');
      }

      const data = await res.json();
      const newUser: UserProfile = data.user || data;
      if (data.is_initial_admin || data.token) {
        setUser(newUser);
        try {
          await refreshUser();
          await fetchHouseholdProfiles();
        } catch {}
      }
      return newUser;
    },
    [refreshUser]
  );

  useEffect(() => {
    if (user?.id) {
      setStorageUserId(user.id);
    } else {
      setStorageUserId(null);
    }
  }, [user?.id]);

  const logout = useCallback(async (): Promise<void> => {
    isLoggingOutRef.current = true;
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
    } catch {
    } finally {
      const activeId = userRef.current?.id || user?.id || getStorageUserId();
      detachUserSession(activeId);
      setStorageUserId(null);

      if (typeof document !== 'undefined') {
        document.cookie = 'yarvelle_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'yarvelle_active_profile=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }

      setUser(null);

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, [user?.id]);

  const changePassword = useCallback(
    async (currentOrOpts: string | ChangePasswordOptions, newPass?: string): Promise<void> => {
      let payload: Record<string, string>;
      if (typeof currentOrOpts === 'string') {
        payload = {
          current_password: currentOrOpts,
          new_password: newPass || '',
        };
      } else {
        payload = {
          current_password: currentOrOpts.current_password || currentOrOpts.currentPassword || '',
          new_password: currentOrOpts.new_password || currentOrOpts.newPassword || '',
        };
      }

      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || 'Password update failed.');
      }
    },
    []
  );

  const registrationEnabled =
    providersInfo.registration_enabled !== undefined
      ? providersInfo.registration_enabled
      : providersInfo.allow_registration ?? true;

  const hasAdmin = providersInfo.has_admin ?? true;
  const needsAdminSetup =
    providersInfo.needs_admin_setup !== undefined
      ? providersInfo.needs_admin_setup
      : !hasAdmin && providersInfo.active_provider !== 'disabled';

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isSteward: user?.role === 'admin' || user?.role === 'steward',
      authProvider: providersInfo.active_provider,
      activeProvider: providersInfo.active_provider,
      registrationEnabled,
      allowRegistration: registrationEnabled,
      minPasswordLength: providersInfo.min_password_length ?? 10,
      ssoProviders: providersInfo.sso_providers || [],
      hasAdmin,
      needsAdminSetup,
      login,
      register,
      logout,
      changePassword,
      refreshUser,
    }),
    [
      user,
      isLoading,
      providersInfo,
      registrationEnabled,
      hasAdmin,
      needsAdminSetup,
      login,
      register,
      logout,
      changePassword,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const DEFAULT_AUTH_FALLBACK: AuthContextValue = {
  user: DEFAULT_STEWARD_USER,
  isLoading: false,
  isAuthenticated: true,
  isAdmin: true,
  isSteward: true,
  authProvider: 'disabled',
  activeProvider: 'disabled',
  registrationEnabled: true,
  allowRegistration: true,
  minPasswordLength: 10,
  ssoProviders: [],
  hasAdmin: true,
  needsAdminSetup: false,
  login: async () => DEFAULT_STEWARD_USER,
  register: async () => DEFAULT_STEWARD_USER,
  logout: async () => {},
  changePassword: async () => {},
  refreshUser: async () => DEFAULT_STEWARD_USER,
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  return context || DEFAULT_AUTH_FALLBACK;
}
