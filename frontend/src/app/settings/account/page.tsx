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

import React, { useState } from 'react';
import { KeyRound, Shield, CheckCircle2, Laptop, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';

export default function AccountSettingsPage() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const strength = evaluatePasswordStrength(newPassword);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!strength.isValid) {
      setPasswordError('Please meet all password complexity requirements before saving.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-fraunces text-[var(--cf-text-primary)]">
              Primary Account Profile
            </h2>
            <p className="text-xs text-[var(--cf-text-muted)]">
              Household primary steward account and credential management.
            </p>
          </div>
          <Badge variant="success">Steward</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-3 rounded-xl bg-[var(--cf-surface-muted)] border border-[var(--cf-border)]">
            <span className="text-[10px] text-[var(--cf-text-muted)] uppercase font-semibold">Full Name</span>
            <p className="font-semibold text-[var(--cf-text-primary)] mt-0.5">{user?.full_name || 'Leo'}</p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--cf-surface-muted)] border border-[var(--cf-border)]">
            <span className="text-[10px] text-[var(--cf-text-muted)] uppercase font-semibold">Username</span>
            <p className="font-semibold text-[var(--cf-text-primary)] mt-0.5">@{user?.username || 'leo'}</p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--cf-surface-muted)] border border-[var(--cf-border)]">
            <span className="text-[10px] text-[var(--cf-text-muted)] uppercase font-semibold">Email Address</span>
            <p className="font-semibold text-[var(--cf-text-primary)] mt-0.5">{user?.email || 'leo@yarvelle.local'}</p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--cf-surface-muted)] border border-[var(--cf-border)]">
            <span className="text-[10px] text-[var(--cf-text-muted)] uppercase font-semibold">Account Role</span>
            <p className="font-semibold text-[var(--cf-text-primary)] mt-0.5 capitalize">{user?.role || 'steward'}</p>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold font-fraunces text-[var(--cf-text-primary)] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[var(--cf-primary)]" />
            Change Local Master Password
          </h2>
          <p className="text-xs text-[var(--cf-text-muted)] mt-1">
            Used to derive Argon2id encryption keys for local vault and attachment sandbox isolation.
          </p>
        </div>

        {passwordSaved && (
          <div className="p-3 rounded-xl bg-[var(--cf-primary-subtle)] border border-[var(--cf-primary)] text-xs text-[var(--cf-primary)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Master password updated successfully.</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-xl bg-[var(--cf-surface-elevated)] border border-[var(--cf-warning-text)] text-xs text-[var(--cf-warning-text)] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md pt-2">
          <div>
            <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
            />

            {/* Live Password Strength Meter */}
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[var(--cf-text-muted)]">Strength:</span>
                  <span className="font-semibold text-[var(--cf-text-primary)]">{strength.label}</span>
                </div>
                <div className="w-full bg-[var(--cf-surface-muted)] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      strength.score <= 1
                        ? 'bg-[var(--cf-danger-text)]'
                        : strength.score === 2
                        ? 'bg-[var(--cf-warning-text)]'
                        : strength.score === 3
                        ? 'bg-[var(--cf-accent)]'
                        : 'bg-[var(--cf-primary)]'
                    }`}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  />
                </div>
                <ul className="grid grid-cols-2 gap-1 text-[10px] text-[var(--cf-text-muted)] pt-1">
                  <li className={strength.criteria.minLength ? 'text-[var(--cf-primary)]' : ''}>
                    ✓ 10+ characters
                  </li>
                  <li className={strength.criteria.hasUpper ? 'text-[var(--cf-primary)]' : ''}>
                    ✓ Uppercase letter
                  </li>
                  <li className={strength.criteria.hasLower ? 'text-[var(--cf-primary)]' : ''}>
                    ✓ Lowercase letter
                  </li>
                  <li className={strength.criteria.hasDigit || strength.criteria.hasSpecial ? 'text-[var(--cf-primary)]' : ''}>
                    ✓ Number or symbol
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
            />
          </div>

          <Button type="submit" variant="primary" size="sm" disabled={!strength.isValid}>
            Update Password
          </Button>
        </form>
      </div>

      {/* Active Device Sessions */}
      <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-fraunces text-[var(--cf-text-primary)]">
              Active Authorized Sessions
            </h2>
            <p className="text-xs text-[var(--cf-text-muted)]">
              Local web instances and connected companion clients currently logged into your household.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-[var(--cf-danger-text)]">
            Sign out other sessions
          </Button>
        </div>

        <div className="space-y-3 pt-2">
          <div className="p-3 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-muted)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Laptop className="w-5 h-5 text-[var(--cf-primary)]" />
              <div>
                <p className="text-xs font-semibold text-[var(--cf-text-primary)]">macOS Web Browser (Current Session)</p>
                <p className="text-[10px] text-[var(--cf-text-muted)]">Next.js 16 · Local Host (127.0.0.1) · Active now</p>
              </div>
            </div>
            <Badge variant="success">Current</Badge>
          </div>

          <div className="p-3 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[var(--cf-text-muted)]" />
              <div>
                <p className="text-xs font-semibold text-[var(--cf-text-primary)]">iOS HealthKit Companion Client</p>
                <p className="text-[10px] text-[var(--cf-text-muted)]">Paired local device · Last synced 2 hours ago</p>
              </div>
            </div>
            <Badge variant="neutral">Paired</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
