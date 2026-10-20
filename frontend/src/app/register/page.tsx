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
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';
import { cn } from '@/lib/utils';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, allowRegistration, authProvider, needsAdminSetup } = useAuth();
  const isSetupMode = needsAdminSetup || searchParams.get('mode') === 'admin-setup';

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = evaluatePasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (!strength.isValid) {
      setError(
        'Password does not satisfy complexity requirements (minimum 10 characters, mixed case, and number/special character).'
      );
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await register({
        email: email.trim(),
        username: username.trim(),
        password,
        full_name: fullName.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => {
        if (isSetupMode || newUser.role === 'admin') {
          router.push('/');
        } else {
          router.push('/login');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email or username may already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 sm:p-8 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] shadow-xl space-y-6">
      {/* Brand & Heading */}
      <div className="text-center space-y-2">
        <div
          className={cn(
            'inline-flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-md mx-auto',
            isSetupMode ? 'bg-purple-600' : 'bg-[var(--cf-primary)] text-[var(--cf-fg-on-primary)]'
          )}
        >
          {isSetupMode ? <ShieldCheck className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        </div>
        <h1 className="font-serif text-2xl font-bold text-[var(--cf-fg)] tracking-tight">
          {isSetupMode ? 'Administrator Setup' : 'Create an Account'}
        </h1>
        <p className="text-xs text-[var(--cf-fg-muted)]">
          {isSetupMode
            ? 'Create the primary administrator account for your Yarvelle workspace'
            : 'Sign up for personalized family records, consultation prep, and navigation'}
        </p>
        {isSetupMode && (
          <div
            data-testid="admin-setup-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Role: Primary Administrator</span>
          </div>
        )}
      </div>

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
            Yarvelle is currently operating in offline local mode. Registration is optional.
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

      {/* Registration Disabled Notice */}
      {!allowRegistration && !isSetupMode && authProvider !== 'disabled' && (
        <div
          role="alert"
          data-testid="registration-disabled-alert"
          className="p-3.5 rounded-xl bg-[var(--cf-surface-2)] border border-amber-300 text-xs text-amber-800 space-y-2"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Self-Registration is Closed</span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--cf-fg-muted)]">
            New account registration is currently disabled by the system administrator.
            Please contact your administrator for an invitation code.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
          >
            <span>Back to Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          data-testid="register-error-alert"
          className="p-3 rounded-xl bg-[var(--cf-surface-2)] border border-rose-300 text-xs text-rose-800 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div
          role="status"
          data-testid="register-success-alert"
          className="p-3 rounded-xl bg-[var(--cf-surface-2)] border border-emerald-300 text-xs text-emerald-800 flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            {isSetupMode
              ? 'Administrator account initialized! Logging you in and redirecting to Workspace...'
              : 'Account created successfully! Redirecting to sign in...'}
          </span>
        </div>
      )}

      {/* Register Form */}
      {(allowRegistration || isSetupMode) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-full-name"
              className="block text-xs font-semibold text-[var(--cf-fg)]"
            >
              Full Name (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-[var(--cf-fg-subtle)]">
                <User className="w-4 h-4" />
              </div>
              <input
                id="register-full-name"
                data-testid="register-fullname-input"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jordan Parker"
                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] placeholder:text-[var(--cf-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition min-h-[44px]"
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-username"
              className="block text-xs font-semibold text-[var(--cf-fg)]"
            >
              Username <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-[var(--cf-fg-subtle)]">
                <User className="w-4 h-4" />
              </div>
              <input
                id="register-username"
                data-testid="register-username-input"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jordan"
                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] placeholder:text-[var(--cf-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition min-h-[44px]"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold text-[var(--cf-fg)]"
            >
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-[var(--cf-fg-subtle)]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email"
                data-testid="register-email-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@example.com"
                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] placeholder:text-[var(--cf-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition min-h-[44px]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-password"
              className="block text-xs font-semibold text-[var(--cf-fg)]"
            >
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-[var(--cf-fg-subtle)]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-password"
                data-testid="register-password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 10 characters, mixed case & numbers"
                className="w-full ps-9 pe-9 py-2 text-xs rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] placeholder:text-[var(--cf-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition min-h-[44px]"
              />
              <button
                type="button"
                data-testid="toggle-register-password-visibility"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-[var(--cf-fg-subtle)] hover:text-[var(--cf-fg)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* 4-Tier Password Strength Meter Bar */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1" data-testid="password-strength-container">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--cf-fg-muted)]">Strength:</span>
                  <span
                    data-testid="password-strength-label"
                    className={cn(
                      'font-semibold capitalize',
                      strength.score <= 1
                        ? 'text-rose-600'
                        : strength.score === 2
                        ? 'text-amber-600'
                        : strength.score === 3
                        ? 'text-blue-600'
                        : 'text-emerald-600'
                    )}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
                  {[1, 2, 3, 4].map((step) => {
                    const isActive = strength.score >= step;
                    return (
                      <div
                        key={step}
                        data-testid={`strength-bar-${step}`}
                        className={cn(
                          'rounded-full transition-colors',
                          isActive
                            ? strength.score <= 1
                              ? 'bg-rose-500'
                              : strength.score === 2
                              ? 'bg-amber-500'
                              : strength.score === 3
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                            : 'bg-[var(--cf-border)]'
                        )}
                      />
                    );
                  })}
                </div>

                {/* Criteria Checklist */}
                <div className="grid grid-cols-2 gap-1 pt-1.5 text-xs text-[var(--cf-fg-muted)]">
                  <div className="flex items-center gap-1.5">
                    {strength.criteria.minLength ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-[var(--cf-fg-subtle)]" />
                    )}
                    <span>10+ characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {strength.criteria.hasUpper && strength.criteria.hasLower ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-[var(--cf-fg-subtle)]" />
                    )}
                    <span>Upper & lowercase</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {strength.criteria.hasDigit ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-[var(--cf-fg-subtle)]" />
                    )}
                    <span>Numbers (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {strength.criteria.hasSpecial ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-[var(--cf-fg-subtle)]" />
                    )}
                    <span>Special symbol (!@#$)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-confirm-password"
              className="block text-xs font-semibold text-[var(--cf-fg)]"
            >
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-[var(--cf-fg-subtle)]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-confirm-password"
                data-testid="register-confirm-password-input"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={cn(
                  'w-full ps-9 pe-9 py-2 text-xs rounded-xl border bg-[var(--cf-surface)] text-[var(--cf-fg)] placeholder:text-[var(--cf-fg-subtle)] transition min-h-[44px]',
                  confirmPassword.length > 0 && !passwordsMatch
                    ? 'border-rose-500 focus:border-rose-600'
                    : 'border-[var(--cf-border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)]'
                )}
              />
              <button
                type="button"
                data-testid="toggle-register-confirm-password-visibility"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-[var(--cf-fg-subtle)] hover:text-[var(--cf-fg)] cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-rose-600">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            data-testid="register-submit-btn"
            disabled={isSubmitting || !strength.isValid || !passwordsMatch}
            className={cn(
              'w-full py-2.5 px-4 text-xs font-semibold rounded-xl text-white shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]',
              isSetupMode
                ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                : 'bg-[var(--cf-primary)] text-[var(--cf-fg-on-primary)] hover:bg-[var(--cf-primary-hover)]'
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isSetupMode ? 'Initializing Administrator...' : 'Creating Account...'}</span>
              </>
            ) : isSetupMode ? (
              <>
                <span>Initialize Administrator Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <span>Register</span>
            )}
          </button>
        </form>
      )}

      {/* Links */}
      <div className="pt-2 text-center text-xs text-[var(--cf-fg-muted)] border-t border-[var(--cf-border)]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6 sm:py-10 px-3.5 sm:px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] shadow-xl flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
