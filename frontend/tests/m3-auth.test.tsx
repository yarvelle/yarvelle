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

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage, { sanitizeRedirect } from '@/app/login/page';
import RegisterPage from '@/app/register/page';
import ForgotPasswordPage from '@/app/forgot-password/page';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';
import { AuthProvider } from '@/lib/auth';

class MemoryStorage implements Storage {
  private data: Record<string, string> = {};
  get length() {
    return Object.keys(this.data).length;
  }
  clear() {
    this.data = {};
  }
  getItem(key: string) {
    return this.data[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.data[key] = String(value);
  }
  removeItem(key: string) {
    delete this.data[key];
  }
  key(index: number) {
    return Object.keys(this.data)[index] ?? null;
  }
}

const mockStorage = new MemoryStorage();
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    configurable: true,
    writable: true,
  });
}
Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  configurable: true,
  writable: true,
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/login',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Milestone 3 — Auth Shell & Credential Governance', () => {
  beforeEach(() => {
    mockStorage.clear();
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/v1/auth/providers')) {
        return {
          ok: true,
          json: async () => ({
            active_provider: 'disabled',
            sso_providers: [],
            registration_enabled: true,
          }),
        };
      }
      if (url.includes('/api/v1/auth/me')) {
        return {
          ok: true,
          json: async () => ({
            user: {
              id: '00000000-0000-0000-0000-000000000000',
              email: 'steward@local.yarvelle',
              username: 'steward',
              full_name: 'Care Steward',
              role: 'admin',
              status: 'active',
              auth_provider: 'disabled',
              created_at: '2026-10-01T00:00:00Z',
            },
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  describe('Redirect Sanitizer', () => {
    it('returns default root for null, empty, or external urls', () => {
      expect(sanitizeRedirect(null)).toBe('/');
      expect(sanitizeRedirect('')).toBe('/');
      expect(sanitizeRedirect('   ')).toBe('/');
      expect(sanitizeRedirect('https://malicious.site/phish')).toBe('/');
      expect(sanitizeRedirect('//malicious.site')).toBe('/');
      expect(sanitizeRedirect('javascript:alert(1)')).toBe('/');
      expect(sanitizeRedirect('data:text/html,evil')).toBe('/');
    });

    it('preserves legitimate internal relative paths', () => {
      expect(sanitizeRedirect('/chat')).toBe('/chat');
      expect(sanitizeRedirect('/settings/model')).toBe('/settings/model');
      expect(sanitizeRedirect('/p/me/vitals')).toBe('/p/me/vitals');
      expect(sanitizeRedirect('/family')).toBe('/family');
    });
  });

  describe('Password Complexity Evaluator', () => {
    it('evaluates weak passwords under 10 characters', () => {
      const result = evaluatePasswordStrength('Ab1!');
      expect(result.score).toBeLessThanOrEqual(2);
      expect(result.isValid).toBe(false);
      expect(result.criteria.minLength).toBe(false);
    });

    it('evaluates passwords missing symbols or numbers', () => {
      const result = evaluatePasswordStrength('LongPasswordWithoutNumbers');
      expect(result.criteria.hasDigit).toBe(false);
      expect(result.criteria.hasSpecial).toBe(false);
    });

    it('evaluates robust passwords satisfying all 4 tiers', () => {
      const result = evaluatePasswordStrength('Yarvelle#Steward2026');
      expect(result.score).toBe(4);
      expect(result.label).toBe('Strong');
      expect(result.isValid).toBe(true);
      expect(result.criteria.minLength).toBe(true);
      expect(result.criteria.hasUpper).toBe(true);
      expect(result.criteria.hasLower).toBe(true);
      expect(result.criteria.hasDigit).toBe(true);
      expect(result.criteria.hasSpecial).toBe(true);
    });
  });

  describe('Login Page (/login)', () => {
    it('renders login form with username, password, and action links', () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      expect(screen.getByRole('heading', { name: 'Sign In to Yarvelle' })).toBeDefined();
      expect(screen.getByTestId('login-username-input')).toBeDefined();
      expect(screen.getByTestId('login-password-input')).toBeDefined();
      expect(screen.getByTestId('login-submit-btn')).toBeDefined();
    });
  });

  describe('Register Page (/register)', () => {
    it('renders registration form with live password strength checklist', () => {
      render(
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      );

      expect(screen.getByRole('heading', { name: 'Create an Account' })).toBeDefined();
      expect(screen.getByTestId('register-fullname-input')).toBeDefined();
      expect(screen.getByTestId('register-username-input')).toBeDefined();
      expect(screen.getByTestId('register-email-input')).toBeDefined();
      expect(screen.getByTestId('register-password-input')).toBeDefined();
      expect(screen.getByTestId('register-confirm-password-input')).toBeDefined();

      const passwordInput = screen.getByTestId('register-password-input');
      fireEvent.change(passwordInput, { target: { value: 'StrongPass#2026' } });

      expect(screen.getByText('10+ characters')).toBeDefined();
      expect(screen.getByText('Upper & lowercase')).toBeDefined();
      expect(screen.getByText('Numbers (0-9)')).toBeDefined();
      expect(screen.getByText('Special symbol (!@#$)')).toBeDefined();
      expect(screen.getByTestId('strength-bar-4')).toBeDefined();
    });
  });

  describe('Forgot Password Page (/forgot-password)', () => {
    it('renders password recovery form and generates local reset token', async () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeDefined();

      const emailInput = screen.getByTestId('forgot-email-input');
      fireEvent.change(emailInput, { target: { value: 'steward@example.com' } });

      const submitBtn = screen.getByTestId('forgot-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('forgot-password-success')).toBeDefined();
      });
    });
  });
});
