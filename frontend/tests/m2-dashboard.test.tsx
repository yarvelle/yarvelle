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
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

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

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/p/me',
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

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
  if (url.includes('/api/health')) {
    return {
      ok: true,
      json: async () => ({
        status: 'ok',
        version: '0.4.0',
      }),
    };
  }
  return {
    ok: true,
    json: async () => ([]),
  };
}) as any;

import { HomeDashboardClient } from '../src/app/p/[profileId]/HomeDashboardClient';
import RootDashboardPage from '../src/app/page';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { I18nProvider } from '../src/i18n';
import { AuthProvider } from '../src/lib/auth';
import { Button } from '../src/components/ui/Button';
import { Badge } from '../src/components/ui/Badge';
import { Chip } from '../src/components/ui/Chip';
import { EmptyState } from '../src/components/ui/EmptyState';
import { Calendar } from 'lucide-react';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>{ui}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

async function renderDashboard(ui: React.ReactElement) {
  const result = renderWithProviders(ui);
  await waitFor(() => {
    expect(screen.queryByTestId('dashboard-loading')).toBeNull();
  });
  return result;
}

describe('Milestone 2 — Supporting UI Primitives', () => {
  it('renders Button with variants, sizes, and left/right icons', () => {
    const { rerender } = render(
      <Button variant="primary" size="md">
        Click Me
      </Button>
    );
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeDefined();

    rerender(
      <Button variant="secondary" size="sm" leftIcon={<span data-testid="left-icon">L</span>}>
        Secondary
      </Button>
    );
    expect(screen.getByTestId('left-icon')).toBeDefined();
    expect(screen.getByRole('button', { name: /secondary/i })).toBeDefined();
  });

  it('renders Badge with variants and dot indicators', () => {
    render(
      <Badge variant="success" dot>
        Active Status
      </Badge>
    );
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('Active Status')).toBeDefined();
  });

  it('renders Chip with domain scope variants and handles click events', () => {
    const handleClick = vi.fn();
    render(
      <Chip variant="household" onClick={handleClick}>
        Household Scope
      </Chip>
    );
    const chip = screen.getByRole('button', { name: 'Household Scope' });
    expect(chip).toBeDefined();
    fireEvent.click(chip);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders EmptyState with icon, title, description, and action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        icon={<Calendar className="w-6 h-6" />}
        title="Empty Schedule"
        description="No events booked for today."
        action={{ label: 'Add Event', onClick: handleAction }}
      />
    );
    expect(screen.getByText('Empty Schedule')).toBeDefined();
    expect(screen.getByText('No events booked for today.')).toBeDefined();
    const actionBtn = screen.getByRole('button', { name: 'Add Event' });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});

describe('Milestone 2 — HomeDashboardClient & Asymmetric Hero Grid', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockPush.mockClear();
  });

  it('renders the Person Greeting Hero with display name, avatar, and lock chip', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    // Greeting heading
    const heroHeading = await screen.findByRole('heading', { level: 1 });
    expect(heroHeading).toBeDefined();
    expect(heroHeading.textContent).toMatch(/Good (morning|afternoon|evening)/i);

    // Lock chip
    expect(screen.getByText(/Private on this computer/i)).toBeDefined();

    // Manage profile button
    const manageBtn = screen.getByRole('button', { name: /manage profile/i });
    expect(manageBtn).toBeDefined();
  });

  it('renders Audience Switcher with adult, teen, and child (<13) options', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    const adultBtn = screen.getByTestId('audience-btn-adult');
    const teenBtn = screen.getByTestId('audience-btn-teen');
    const childBtn = screen.getByTestId('audience-btn-child');

    expect(adultBtn).toBeDefined();
    expect(teenBtn).toBeDefined();
    expect(childBtn).toBeDefined();
    expect(childBtn.textContent).toContain('Child (<13)');

    // Switch to teen audience
    fireEvent.click(teenBtn);
    // Switch to child audience
    fireEvent.click(childBtn);
  });

  it('renders Domain Pack Filter Bar and filters slot cards', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    const allFilter = screen.getByTestId('pack-filter-all');
    const healthFilter = screen.getByTestId('pack-filter-health');
    const financeFilter = screen.getByTestId('pack-filter-finance');
    const educationFilter = screen.getByTestId('pack-filter-education');
    const householdFilter = screen.getByTestId('pack-filter-household');

    expect(allFilter).toBeDefined();
    expect(healthFilter).toBeDefined();
    expect(financeFilter).toBeDefined();
    expect(educationFilter).toBeDefined();
    expect(householdFilter).toBeDefined();

    // Filter to household
    fireEvent.click(householdFilter);
    const slotsGrid = screen.getByTestId('dashboard-slots-grid');
    expect(slotsGrid).toBeDefined();
  });

  it('renders Next Priority / Visit Preparation Card with checklist and progress bar', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    // Date badge
    expect(screen.getByText('OCT')).toBeDefined();
    expect(screen.getByText('24')).toBeDefined();

    // Appointment info
    expect(screen.getByText('Cardiology follow-up')).toBeDefined();
    expect(screen.getByText(/Dr. Elena Whitfield/i)).toBeDefined();

    const visitSection = screen.getByRole('region', { name: /next visit prep/i });

    // Progress bar
    const progressbar = within(visitSection).getByRole('progressbar');
    expect(progressbar).toBeDefined();
    const initialVal = progressbar.getAttribute('aria-valuenow');
    expect(initialVal).toBeDefined();

    // Checkable checklist items
    const checkboxes = within(visitSection).getAllByRole('checkbox');
    expect(checkboxes.length).toBe(4);

    // Toggle the second checkbox
    const secondItem = checkboxes[1];
    expect(secondItem.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(secondItem);
    expect(secondItem.getAttribute('aria-checked')).toBe('true');
    expect(Number(progressbar.getAttribute('aria-valuenow'))).toBeGreaterThan(Number(initialVal));

    // CTAs
    expect(within(visitSection).getByRole('button', { name: /continue prep/i })).toBeDefined();
    expect(within(visitSection).getByRole('button', { name: /print prep sheet/i })).toBeDefined();
  });

  it('renders Ask Yarvelle composer card with suggested starters launching into chat', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    // Ask textarea
    const textarea = screen.getByRole('textbox', { name: /ask yarvelle about/i });
    expect(textarea).toBeDefined();

    // Ask helper button
    const askBtn = screen.getByTestId('ask-helper-btn');
    expect(askBtn).toBeDefined();

    // Suggested starters
    const starterBtn = screen.getByRole('button', { name: /prepare for cardiologist visit/i });
    expect(starterBtn).toBeDefined();
    fireEvent.click(starterBtn);

    // Textarea updated with starter prompt
    expect((textarea as HTMLTextAreaElement).value).toBe(
      'Prepare questions for cardiologist visit on Tuesday'
    );

    // Submit ask form
    fireEvent.click(askBtn);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/chat?prompt='));
  });

  it('renders EmptyState fallback when no appointment exists', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" isEmpty={true} />);

    expect(screen.getByText(/no upcoming visits scheduled/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /prepare with visit steward/i })).toBeDefined();
  });

  it('opens ProfileEditModal when Manage profile button is clicked', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    const manageBtn = screen.getByRole('button', { name: /manage profile/i });
    fireEvent.click(manageBtn);

    // Modal dialog title
    expect(screen.getByText('Manage Care Profile')).toBeDefined();
    expect(screen.getByLabelText(/full name/i)).toBeDefined();
  });

  it('renders RootDashboardPage hosting HomeDashboardClient with profileId="me"', async () => {
    await renderDashboard(<RootDashboardPage />);

    expect(screen.getByTestId('dashboard-slots-grid')).toBeDefined();
    expect(screen.getByTestId('audience-btn-adult')).toBeDefined();
    expect(screen.getByTestId('pack-filter-all')).toBeDefined();
  });
});
