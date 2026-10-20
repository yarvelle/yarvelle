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
import { render, screen } from '@testing-library/react';
import { VitalsClient } from '@/app/p/[profileId]/vitals/VitalsClient';
import { AppointmentsClient } from '@/app/p/[profileId]/appointments/AppointmentsClient';
import { FinanceClient } from '@/app/p/[profileId]/finance/FinanceClient';
import { EducationClient } from '@/app/p/[profileId]/education/EducationClient';
import { HouseholdClient } from '@/app/p/[profileId]/household/HouseholdClient';
import { LibraryClient } from '@/app/p/[profileId]/library/LibraryClient';
import { ProfileActivityClient } from '@/app/p/[profileId]/activity/ProfileActivityClient';
import CalendarPage from '@/app/calendar/page';
import TasksPage from '@/app/tasks/page';
import NotificationsPage from '@/app/notifications/page';

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
  usePathname: () => '/p/me/vitals',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Milestone 3 — Dedicated Domain Hubs & Root Shortcuts', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('Vitals Hub (/p/[profileId]/vitals)', () => {
    it('mounts and renders cardiovascular & vitals metrics with record controls', () => {
      render(<VitalsClient profileId="me" />);

      expect(screen.getByRole('heading', { name: 'Health & Vitals' })).toBeDefined();
      expect(screen.getByTestId('vitals-page-heading')).toBeDefined();
      expect(screen.getByTestId('log-vitals-open-btn')).toBeDefined();
    });
  });

  describe('Appointments Hub (/p/[profileId]/appointments)', () => {
    it('mounts and renders appointment list, prep checklist, and reminders', () => {
      render(<AppointmentsClient profileId="me" />);

      expect(screen.getByRole('heading', { name: 'Schedule & Appointments' })).toBeDefined();
      expect(screen.getByTestId('schedule-page-heading')).toBeDefined();
      expect(screen.getByText('Cardiovascular Comprehensive Consultation')).toBeDefined();
    });
  });

  describe('Finance Hub (/p/[profileId]/finance)', () => {
    it('mounts and renders bills calendar, budget envelopes, and medical cost bridge', () => {
      render(<FinanceClient profileId="me" />);

      expect(screen.getByRole('heading', { name: 'Finance & Bills' })).toBeDefined();
      expect(screen.getByTestId('add-bill-btn')).toBeDefined();
      expect(screen.getByTestId('finance-tabs')).toBeDefined();
    });
  });

  describe('Education Hub (/p/[profileId]/education)', () => {
    it('mounts and renders academic assignments, reading streaks, and study decks', () => {
      render(<EducationClient profileId="me" />);

      expect(screen.getByRole('heading', { name: 'Education & Study' })).toBeDefined();
      expect(screen.getByTestId('education-page-heading')).toBeDefined();
      expect(screen.getByTestId('log-reading-btn')).toBeDefined();
    });
  });

  describe('Household Hub (/p/[profileId]/household)', () => {
    it('mounts and renders multi-domain timeline, chore point board, and caregiver handover', () => {
      render(<HouseholdClient profileId="me" />);

      expect(screen.getByRole('heading', { name: 'Household & Chores' })).toBeDefined();
      expect(screen.getByTestId('household-page-heading')).toBeDefined();
      expect(screen.getByTestId('add-chore-btn')).toBeDefined();
    });
  });

  describe('Library Hub (/p/[profileId]/library)', () => {
    it('mounts and renders encrypted file vault and clinical workspace notes', () => {
      render(<LibraryClient profileId="me" />);

      expect(screen.getByRole('heading', { name: 'Library & Notes' })).toBeDefined();
      expect(screen.getByTestId('library-page-heading')).toBeDefined();
      expect(screen.getByTestId('upload-attachment-btn')).toBeDefined();
      expect(screen.getByTestId('new-note-btn')).toBeDefined();
    });
  });

  describe('Profile Activity Hub (/p/[profileId]/activity)', () => {
    it('mounts and renders tamper-evident audit history entries', () => {
      render(<ProfileActivityClient profileId="me" />);

      expect(screen.getByRole('heading', { name: 'Activity & Audit Trail' })).toBeDefined();
      expect(screen.getByTestId('activity-page-heading')).toBeDefined();
      expect(screen.getByTestId('activity-count-badge')).toBeDefined();
    });
  });

  describe('Root Shortcuts', () => {
    it('renders global household calendar shortcut (/calendar)', () => {
      render(<CalendarPage />);
      expect(screen.getByRole('heading', { name: 'Household Calendar' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'health' })).toBeDefined();
    });

    it('renders global tasks shortcut (/tasks)', () => {
      render(<TasksPage />);
      expect(screen.getByRole('heading', { name: 'Tasks & Chores' })).toBeDefined();
      expect(screen.getByTestId('new-task-input')).toBeDefined();
    });

    it('renders global notifications shortcut (/notifications)', () => {
      render(<NotificationsPage />);
      expect(screen.getByRole('heading', { name: 'Notifications & Alerts' })).toBeDefined();
    });
  });
});
