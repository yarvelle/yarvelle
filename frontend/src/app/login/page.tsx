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

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function sanitizeRedirect(target: string | null): string {
  if (!target) return '/';
  const trimmed = target.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes(':') &&
    !trimmed.includes('\\') &&
    !trimmed.includes('\0')
  ) {
    return trimmed;
  }
  return '/';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = sanitizeRedirect(searchParams.get('redirect'));

  const {
    login,
    user,
    isAuthenticated,
    authProvider,
    allowRegistration,
    needsAdminSetup,
  } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (needsAdminSetup) {
      setError(
        'No administrator account exists yet. Please set up your primary steward account above.'
      );
      return;
    }

    if (!usernameOrEmail.trim()) {
      setError('Username or email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ username_or_email: usernameOrEmail.trim(), password });
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 sm:p-8 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] shadow-xl space-y-6">
      {/* Brand & Heading */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--cf-primary)] text-[var(--cf-fg-on-primary)] shadow-md mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[var(--cf-fg)] tracking-tight">
          Sign In to Yarvelle
        </h1>
        <p className="text-xs text-[var(--cf-fg-muted)]">
          Private, local-first intelligence across Health, Finance, Education, and Household
        </p>
      </div>

      {/* First-Run Setup Banner */}
      {needsAdminSetup && (
        <div
          data-testid="needs-admin-setup-banner"
          className="p-4 rounded-xl bg-[var(--cf-surface-2)] border border-purple-300 text-xs text-[var(--cf-fg)] space-y-2.5"
        >
          <div className="flex items-center gap-2 font-bold text-purple-700">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>First-Time Setup Required</span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--cf-fg-muted)]">
            No administrator account exists yet. Create your primary administrator account to initialize your household workspace.
          </p>
          <Link
            href="/register?mode=admin-setup"
            data-testid="first-run-setup-btn"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition"
          >
            <span>Set Up Administrator Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Disabled Mode Banner */}
      {authProvider === 'disabled' && (
        <div
          data-testid="disabled-mode-banner"
          className="p-3.5 rounded-xl bg-[var(--cf-surface-2)] border border-emerald-300 text-xs text-[var(--cf-fg)] space-y-2"
        >
          <div className="flex items-center gap-2 font-semibold text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Single-User Local Mode</span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--cf-fg-muted)]">
            Yarvelle is currently running in local offline mode. Login is optional and all features are accessible.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
          >
            <span>Proceed to Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Already Signed In Banner */}
      {isAuthenticated && user && authProvider !== 'disabled' && (
        <div className="p-3.5 rounded-xl bg-[var(--cf-surface-2)] border border-[var(--cf-border)] text-xs text-[var(--cf-fg)] space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Signed in as @{user.username} ({user.role})</span>
          </div>
          <p className="text-xs text-[var(--cf-fg-muted)]">
            You are already authenticated. You can return to your dashboard or sign in as a different user.
          </p>
          <Link
            href={redirectPath}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
          >
            <span>Continue to application</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Service Unavailable Alert */}
      {searchParams.get('error') === 'service_unavailable' && (
        <div
          role="alert"
          data-testid="service-unavailable-alert"
          className="p-3.5 rounded-xl bg-[var(--cf-surface-2)] border border-amber-300 text-xs text-amber-800 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Yarvelle service is currently unavailable</span>
            <span className="leading-relaxed block text-[var(--cf-fg-muted)]">
              The backend service could not be reached. Please verify the backend service is running and try again.
            </span>
          </div>
        </div>
      )}

      {/* Session Expired Alert */}
      {searchParams.get('error') === 'session_expired' && (
        <div
          role="alert"
          data-testid="session-expired-alert"
          className="p-3.5 rounded-xl bg-[var(--cf-surface-2)] border border-[var(--cf-border)] text-xs text-[var(--cf-fg)] flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-[var(--cf-fg-subtle)] shrink-0 mt-0.5" />
          <span className="leading-relaxed">Your session has expired or is invalid. Please sign in again.</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          data-testid="login-error-alert"
          className="p-3 rounded-xl bg-[var(--cf-surface-2)] border border-rose-300 text-xs text-rose-800 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username or Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="username-or-email"
            className="block text-xs font-semibold text-[var(--cf-fg)]"
          >
            Username or Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-[var(--cf-fg-subtle)]">
              <User className="w-4 h-4" />
            </div>
            <input
              id="username-or-email"
              data-testid="login-username-input"
              type="text"
              autoComplete="username"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="username or user@example.com"
              className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] placeholder:text-[var(--cf-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition min-h-[44px]"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label
              htmlFor="password"
              className="font-semibold text-[var(--cf-fg)]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-emerald-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-[var(--cf-fg-subtle)]">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              data-testid="login-password-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full ps-9 pe-9 py-2 text-xs rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] placeholder:text-[var(--cf-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition min-h-[44px]"
            />
            <button
              type="button"
              data-testid="toggle-password-visibility"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 end-0 pe-3 flex items-center text-[var(--cf-fg-subtle)] hover:text-[var(--cf-fg)] cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          data-testid="login-submit-btn"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl text-[var(--cf-fg-on-primary)] bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Links */}
      {allowRegistration && (
        <div className="pt-2 text-center text-xs text-[var(--cf-fg-muted)] border-t border-[var(--cf-border)]">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Create an account
          </Link>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <Suspense fallback={<div className="text-xs text-[var(--cf-fg-muted)] text-center">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
