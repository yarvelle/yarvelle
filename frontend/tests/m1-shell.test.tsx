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
import { render, screen, fireEvent } from '@testing-library/react';

class MemoryStorage implements Storage {
  private data: Record<string, string> = {};
  get length() { return Object.keys(this.data).length; }
  clear() { this.data = {}; }
  getItem(key: string) { return this.data[key] ?? null; }
  setItem(key: string, value: string) { this.data[key] = String(value); }
  removeItem(key: string) { delete this.data[key]; }
  key(index: number) { return Object.keys(this.data)[index] ?? null; }
}

const mockStorage = new MemoryStorage();
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: mockStorage, configurable: true, writable: true });
}
Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, configurable: true, writable: true });

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
  if (url.includes('/api/v1/health')) {
    return {
      ok: true,
      json: async () => ({
        status: 'ok',
        version: '0.1.0',
        modelReachable: true,
      }),
    };
  }
  return {
    ok: true,
    json: async () => ([]),
  };
}) as any;

vi.mock('next/navigation', () => ({
  usePathname: () => '/p/me',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

import { AppRail } from '../src/components/layout/AppRail';
import { ProfileSwitcher } from '../src/components/layout/ProfileSwitcher';
import { MobileTopBar } from '../src/components/layout/MobileTopBar';
import { MobileTabBar } from '../src/components/layout/MobileTabBar';
import { AppLayout } from '../src/components/layout/AppLayout';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { I18nProvider } from '../src/i18n';
import { AuthProvider } from '../src/lib/auth';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>{ui}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

describe('Milestone 1 — AppRail Shell Parity', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('renders desktop AppRail with Yarvelle branding, local badge, and collapse button', () => {
    renderWithProviders(<AppRail isCollapsed={false} />);
    const rail = screen.getByTestId('app-rail');
    expect(rail).toBeDefined();

    expect(screen.getByText('Yarvelle')).toBeDefined();
    expect(screen.getByText('LOCAL')).toBeDefined();
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeDefined();
  });

  it('renders Section 1 Caring navigation across all 4 domains (9 routes)', () => {
    renderWithProviders(<AppRail isCollapsed={false} />);

    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Chat')).toBeDefined();
    expect(screen.getByText('Schedule & Calendar')).toBeDefined();
    expect(screen.getByText('Health & Vitals')).toBeDefined();
    expect(screen.getByText('Finance & Bills')).toBeDefined();
    expect(screen.getByText('Education & Study')).toBeDefined();
    expect(screen.getByText('Household & Chores')).toBeDefined();
    expect(screen.getByText('Library & Notes')).toBeDefined();
    expect(screen.getByText('Activity & Undo')).toBeDefined();
  });

  it('renders Section 2 Household navigation (Specialists, Family, Settings)', () => {
    renderWithProviders(<AppRail isCollapsed={false} />);

    expect(screen.getByText('Specialists & Skills')).toBeDefined();
    expect(screen.getByText('Family & Permissions')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders quiet non-clinical and non-advisory safety notice', () => {
    renderWithProviders(<AppRail isCollapsed={false} />);

    const note = screen.getByText(/Yarvelle helps you coordinate & prepare/i);
    expect(note).toBeDefined();
    expect(note.textContent).toContain('911 / 988');
  });

  it('renders Data Residency status badge and opens privacy explainer popover', () => {
    renderWithProviders(<AppRail isCollapsed={false} />);

    const badgeBtn = screen.getByTestId('provider-status-badge');
    expect(badgeBtn).toBeDefined();

    const residencyBadge = screen.getByTestId('data-residency-badge');
    expect(residencyBadge.textContent).toBe('On-Device');
    expect(screen.getByText(/Ollama · llama3.2 · on-device/i)).toBeDefined();

    fireEvent.click(badgeBtn);

    const popover = screen.getByTestId('privacy-explainer-popover');
    expect(popover).toBeDefined();

    const destination = screen.getByTestId('data-residency-destination');
    expect(destination.textContent).toBe('On-Device Data Residency');

    const desc = screen.getByTestId('data-residency-description');
    expect(desc.textContent).toContain('local machine');
  });
});

describe('Milestone 1 — ProfileSwitcher Listbox Modal', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('renders trigger button displaying active person details', () => {
    renderWithProviders(<ProfileSwitcher renderTrigger={true} />);

    const trigger = screen.getByTestId('profile-switcher-trigger');
    expect(trigger).toBeDefined();
    expect(trigger.getAttribute('aria-label')).toContain('Switch person');
  });

  it('opens listbox modal on trigger click with accessible options and checkmark', () => {
    renderWithProviders(<ProfileSwitcher renderTrigger={true} />);

    const trigger = screen.getByTestId('profile-switcher-trigger');
    fireEvent.click(trigger);

    const listbox = screen.getByTestId('profile-switcher-listbox');
    expect(listbox).toBeDefined();
    expect(listbox.getAttribute('role')).toBe('listbox');

    const optionMe = screen.getByTestId('profile-option-me');
    expect(optionMe).toBeDefined();
    expect(optionMe.getAttribute('role')).toBe('option');

    const activeCheck = screen.getByTestId('profile-active-check');
    expect(activeCheck).toBeDefined();

    const liveRegion = screen.getByTestId('profile-switcher-live-region');
    expect(liveRegion).toBeDefined();
  });

  it('opens visible ProfileSwitcher listbox modal from AppRail without hidden ancestor', () => {
    renderWithProviders(<AppRail isCollapsed={false} />);

    const personTrigger = screen.getAllByRole('button', { name: /switch person/i })[0];
    expect(personTrigger).toBeDefined();

    fireEvent.click(personTrigger);

    const listbox = screen.getByTestId('profile-switcher-listbox');
    expect(listbox).toBeDefined();
    expect(listbox.getAttribute('role')).toBe('listbox');

    // Verify listbox has NO hidden ancestor
    let current: HTMLElement | null = listbox;
    let hasHiddenAncestor = false;
    while (current && current !== document.body) {
      if (current.classList.contains('hidden') || current.style.display === 'none') {
        hasHiddenAncestor = true;
        break;
      }
      current = current.parentElement;
    }
    expect(hasHiddenAncestor).toBe(false);
  });

  it('opens visible ProfileSwitcher mobile-sheet from MobileTopBar without hidden ancestor', () => {
    renderWithProviders(<MobileTopBar />);

    const pillTrigger = screen.getByRole('button', { name: /switch profile/i });
    expect(pillTrigger).toBeDefined();

    fireEvent.click(pillTrigger);

    const listbox = screen.getByTestId('profile-switcher-listbox');
    expect(listbox).toBeDefined();

    let current: HTMLElement | null = listbox;
    let hasHiddenAncestor = false;
    while (current && current !== document.body) {
      if (current.classList.contains('hidden') || current.style.display === 'none') {
        hasHiddenAncestor = true;
        break;
      }
      current = current.parentElement;
    }
    expect(hasHiddenAncestor).toBe(false);
  });

  it('traps focus inside ProfileSwitcher modal on Tab and Shift+Tab key navigation', () => {
    renderWithProviders(<ProfileSwitcher defaultOpen={true} />);

    const listbox = screen.getByTestId('profile-switcher-listbox');
    expect(listbox).toBeDefined();

    // Query focusables inside listbox
    const focusables = Array.from(
      listbox.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    expect(focusables.length).toBeGreaterThan(0);

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // Shift+Tab from listbox root or first wraps to last focusable
    first.focus();
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(listbox, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);

    // Tab from last wraps to first focusable
    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(listbox, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(first);
  });

  it('closes ProfileSwitcher on window-level Escape key press and restores focus', () => {
    const { unmount } = renderWithProviders(<ProfileSwitcher renderTrigger={true} />);

    const trigger = screen.getByTestId('profile-switcher-trigger');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(screen.getByTestId('profile-switcher-listbox')).toBeDefined();

    // Fire window-level Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('profile-switcher-listbox')).toBeNull();

    // Verify focus returned to trigger
    expect(document.activeElement).toBe(trigger);
    unmount();
  });
});

describe('Milestone 1 — Mobile Top Bar & Tab Bar', () => {
  it('renders MobileTopBar with brand, profile trigger pill, and actions', () => {
    renderWithProviders(<MobileTopBar />);

    expect(screen.getByLabelText('Mobile header')).toBeDefined();
    expect(screen.getByLabelText('Yarvelle Home')).toBeDefined();
    expect(screen.getByLabelText(/Switch profile/i)).toBeDefined();
    expect(screen.getByLabelText('Open settings')).toBeDefined();
    expect(screen.getByLabelText('Switch theme')).toBeDefined();
  });

  it('renders MobileTabBar with 5 accessible touch tabs', () => {
    renderWithProviders(<MobileTabBar />);

    const nav = screen.getByLabelText('Mobile navigation');
    expect(nav).toBeDefined();

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Chat')).toBeDefined();
    expect(screen.getByText('Specialists')).toBeDefined();
    expect(screen.getByText('Family')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });
});

describe('Milestone 1 — AppLayout Shell', () => {
  it('renders skip link and main viewport container', () => {
    renderWithProviders(
      <AppLayout>
        <div data-testid="page-child">Test Page Content</div>
      </AppLayout>
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute('href')).toBe('#main-content');

    const main = document.getElementById('main-content');
    expect(main).toBeDefined();
    expect(screen.getByTestId('page-child')).toBeDefined();
  });
});
