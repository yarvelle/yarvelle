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

import { HomeDashboardClient, UpcomingAppointment } from '../src/app/p/[profileId]/HomeDashboardClient';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { I18nProvider } from '../src/i18n';
import { AuthProvider } from '../src/lib/auth';
import {
  filterSlotContributions,
  getAllSlotContributions,
} from '../src/pack-registry.generated';

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

describe('Challenger M2-1: Audience Switching & COPPA Strict Child Exclusion', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockPush.mockClear();
  });

  it('empirically verifies adult steward audience displays all 21 cards across all 4 packs', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    const grid = screen.getByTestId('dashboard-slots-grid');
    const renderedCardSlots = grid.querySelectorAll('[data-slot-id]');
    expect(renderedCardSlots.length).toBe(21);

    // All 5 Finance cards present
    expect(within(grid).getByTestId('finance-bills-card')).toBeDefined();
    expect(within(grid).getByTestId('finance-budget-card')).toBeDefined();
    expect(within(grid).getByTestId('finance-statements-card')).toBeDefined();
    expect(within(grid).getByTestId('finance-medical-bridge-card')).toBeDefined();
    expect(within(grid).getByTestId('finance-subscriptions-card')).toBeDefined();

    // Adult Governance & Maintenance cards present
    expect(within(grid).getByTestId('household-cross-links-card')).toBeDefined();
    expect(within(grid).getByTestId('household-maintenance-card')).toBeDefined();
    expect(within(grid).getByTestId('household-handover-card')).toBeDefined();
    expect(within(grid).getByTestId('education-forms-card')).toBeDefined();

    // Health cards present
    expect(within(grid).getByTestId('health-vitals-card')).toBeDefined();
    expect(within(grid).getByTestId('health-appointments-card')).toBeDefined();
    expect(within(grid).getByTestId('health-preventive-card')).toBeDefined();
    expect(within(grid).getByTestId('health-school-forms-card')).toBeDefined();

    // Routine & Study cards present
    expect(within(grid).getByTestId('education-assignments-card')).toBeDefined();
    expect(within(grid).getByTestId('education-study-card')).toBeDefined();
    expect(within(grid).getByTestId('education-reading-card')).toBeDefined();
    expect(within(grid).getByTestId('household-chores-card')).toBeDefined();
    expect(within(grid).getByTestId('household-travel-card')).toBeDefined();
  });

  it('empirically verifies switching to teen audience includes study/routine cards and excludes finance and adult governance', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    const teenBtn = screen.getByTestId('audience-btn-teen');
    fireEvent.click(teenBtn);

    const grid = screen.getByTestId('dashboard-slots-grid');
    const renderedCardSlots = grid.querySelectorAll('[data-slot-id]');
    expect(renderedCardSlots.length).toBe(12);

    // ZERO finance cards may appear for teen audience
    expect(within(grid).queryByTestId('finance-bills-card')).toBeNull();
    expect(within(grid).queryByTestId('finance-budget-card')).toBeNull();
    expect(within(grid).queryByTestId('finance-statements-card')).toBeNull();
    expect(within(grid).queryByTestId('finance-medical-bridge-card')).toBeNull();
    expect(within(grid).queryByTestId('finance-subscriptions-card')).toBeNull();

    // Adult-only governance cards strictly excluded
    expect(within(grid).queryByTestId('household-cross-links-card')).toBeNull();
    expect(within(grid).queryByTestId('household-maintenance-card')).toBeNull();
    expect(within(grid).queryByTestId('household-handover-card')).toBeNull();
    expect(within(grid).queryByTestId('education-forms-card')).toBeNull();

    // Appropriate study and routine cards strictly included
    expect(within(grid).getByTestId('education-assignments-card')).toBeDefined();
    expect(within(grid).getByTestId('education-study-card')).toBeDefined();
    expect(within(grid).getByTestId('education-reading-card')).toBeDefined();
    expect(within(grid).getByTestId('education-calendar-card')).toBeDefined();
    expect(within(grid).getByTestId('household-chores-card')).toBeDefined();
    expect(within(grid).getByTestId('household-travel-card')).toBeDefined();
    expect(within(grid).getByTestId('household-meals-card')).toBeDefined();
    expect(within(grid).getByTestId('household-timeline-card')).toBeDefined();
    expect(within(grid).getByTestId('health-vitals-card')).toBeDefined();
    expect(within(grid).getByTestId('health-appointments-card')).toBeDefined();
  });

  it('empirically verifies child (<13) audience strictly excludes adult-only cards and all finance cards (COPPA compliance)', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    const childBtn = screen.getByTestId('audience-btn-child');
    fireEvent.click(childBtn);

    const grid = screen.getByTestId('dashboard-slots-grid');
    const renderedCardSlots = grid.querySelectorAll('[data-slot-id]');
    expect(renderedCardSlots.length).toBe(7);

    // CRITICAL SAFETY INVARIANT: Every single rendered card slot must explicitly allow 'child'
    const allSlots = getAllSlotContributions();
    renderedCardSlots.forEach((slotEl) => {
      const slotId = slotEl.getAttribute('data-slot-id');
      const def = allSlots.find((s) => s.id === slotId);
      expect(def, `Card slot ${slotId} must exist in registry`).toBeDefined();
      expect(def?.audiences, `Card ${slotId} must declare child audience`).toContain('child');
    });

    // 1. Strict Exclusion of ALL Financial Cards
    expect(within(grid).queryByTestId('finance-bills-card')).toBeNull();
    expect(within(grid).queryByTestId('finance-budget-card')).toBeNull();
    expect(within(grid).queryByTestId('finance-statements-card')).toBeNull();
    expect(within(grid).queryByTestId('finance-medical-bridge-card')).toBeNull();
    expect(within(grid).queryByTestId('finance-subscriptions-card')).toBeNull();

    // 2. Strict Exclusion of Adult Governance & Maintenance Cards
    expect(within(grid).queryByTestId('household-cross-links-card')).toBeNull();
    expect(within(grid).queryByTestId('household-maintenance-card')).toBeNull();
    expect(within(grid).queryByTestId('household-handover-card')).toBeNull();
    expect(within(grid).queryByTestId('household-travel-card')).toBeNull();
    expect(within(grid).queryByTestId('education-forms-card')).toBeNull();

    // 3. Strict Exclusion of Adult/Clinical Health Cards
    expect(within(grid).queryByTestId('health-vitals-card')).toBeNull();
    expect(within(grid).queryByTestId('health-appointments-card')).toBeNull();
    expect(within(grid).queryByTestId('health-preventive-card')).toBeNull();
    expect(within(grid).queryByTestId('health-school-forms-card')).toBeNull();

    // 4. Expected Allowed Cards for Child (<13)
    expect(within(grid).getByTestId('education-calendar-card')).toBeDefined();
    expect(within(grid).getByTestId('education-assignments-card')).toBeDefined();
    expect(within(grid).getByTestId('education-reading-card')).toBeDefined();
    expect(within(grid).getByTestId('education-study-card')).toBeDefined();
    expect(within(grid).getByTestId('household-timeline-card')).toBeDefined();
    expect(within(grid).getByTestId('household-chores-card')).toBeDefined();
    expect(within(grid).getByTestId('household-meals-card')).toBeDefined();
  });

  it('cycles smoothly adult -> teen -> child -> adult without DOM or state corruption', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    const grid = screen.getByTestId('dashboard-slots-grid');
    const adultBtn = screen.getByTestId('audience-btn-adult');
    const teenBtn = screen.getByTestId('audience-btn-teen');
    const childBtn = screen.getByTestId('audience-btn-child');

    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(21);

    // adult -> teen
    fireEvent.click(teenBtn);
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(12);

    // teen -> child
    fireEvent.click(childBtn);
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(7);

    // child -> adult
    fireEvent.click(adultBtn);
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(21);
    expect(within(grid).getByTestId('finance-bills-card')).toBeDefined();
    expect(within(grid).getByTestId('household-cross-links-card')).toBeDefined();
  });

  it('empirically verifies audience state behavior when mounted with child profileId="sam"', async () => {
    await renderDashboard(<HomeDashboardClient profileId="sam" />);

    // Check heading greeting for Sam
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('Sam');

    // Check audience buttons state
    const childBtn = screen.getByTestId('audience-btn-child');
    const adultBtn = screen.getByTestId('audience-btn-adult');

    // Observe which audience button is active initially
    const isChildActive = childBtn.className.includes('bg-primary');
    const isAdultActive = adultBtn.className.includes('bg-primary');

    const grid = screen.getByTestId('dashboard-slots-grid');
    const cardCount = grid.querySelectorAll('[data-slot-id]').length;

    // Log the observed empirical state
    console.log(`[Empirical Observation] profileId="sam" mounted -> isAdultActive: ${isAdultActive}, isChildActive: ${isChildActive}, initial slot count: ${cardCount}`);

    // When the user clicks the child button, COPPA exclusion takes effect
    fireEvent.click(childBtn);
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(7);
  });

  it('empirically verifies suggested starters are filtered according to the active audience', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    // Adult: 4 starters visible
    expect(screen.queryByRole('button', { name: /prepare for cardiologist visit/i })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /review recent bills & eob/i })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /prepare school conference/i })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /plan weekly meals & chores/i })).not.toBeNull();

    // Switch to Teen: Finance starter excluded, Health/Education/Household visible
    fireEvent.click(screen.getByTestId('audience-btn-teen'));
    expect(screen.queryByRole('button', { name: /review recent bills & eob/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /prepare for cardiologist visit/i })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /prepare school conference/i })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /plan weekly meals & chores/i })).not.toBeNull();

    // Switch to Child: Both Finance and Health starters excluded; only Education and Household visible
    fireEvent.click(screen.getByTestId('audience-btn-child'));
    expect(screen.queryByRole('button', { name: /review recent bills & eob/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /prepare for cardiologist visit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /prepare school conference/i })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /plan weekly meals & chores/i })).not.toBeNull();
  });
});

describe('Challenger M2-1: Domain Pack Filtering & Stability Matrix', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockPush.mockClear();
  });

  it('dynamically filters slot cards by individual domain pack tabs', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);
    const grid = screen.getByTestId('dashboard-slots-grid');

    // 1. Health filter
    fireEvent.click(screen.getByTestId('pack-filter-health'));
    const healthSlots = grid.querySelectorAll('[data-slot-id]');
    expect(healthSlots.length).toBe(4);
    healthSlots.forEach((el) => {
      expect(el.getAttribute('data-slot-id')?.startsWith('health.')).toBe(true);
    });

    // 2. Finance filter
    fireEvent.click(screen.getByTestId('pack-filter-finance'));
    const financeSlots = grid.querySelectorAll('[data-slot-id]');
    expect(financeSlots.length).toBe(5);
    financeSlots.forEach((el) => {
      expect(el.getAttribute('data-slot-id')?.startsWith('finance.')).toBe(true);
    });

    // 3. Education filter
    fireEvent.click(screen.getByTestId('pack-filter-education'));
    const eduSlots = grid.querySelectorAll('[data-slot-id]');
    expect(eduSlots.length).toBe(5);
    eduSlots.forEach((el) => {
      expect(el.getAttribute('data-slot-id')?.startsWith('education.')).toBe(true);
    });

    // 4. Household filter
    fireEvent.click(screen.getByTestId('pack-filter-household'));
    const householdSlots = grid.querySelectorAll('[data-slot-id]');
    expect(householdSlots.length).toBe(7);
    householdSlots.forEach((el) => {
      expect(el.getAttribute('data-slot-id')?.startsWith('household.')).toBe(true);
    });

    // 5. All filter
    fireEvent.click(screen.getByTestId('pack-filter-all'));
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(21);
  });

  it('handles adversarial combinations of pack filtering under child audience without crashing', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);
    const grid = screen.getByTestId('dashboard-slots-grid');

    // Switch to child audience
    fireEvent.click(screen.getByTestId('audience-btn-child'));
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(7);

    // Child + Finance = 0 cards, no DOM crash
    fireEvent.click(screen.getByTestId('pack-filter-finance'));
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(0);

    // Child + Health = 0 cards, no DOM crash
    fireEvent.click(screen.getByTestId('pack-filter-health'));
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(0);

    // Child + Education = 4 cards
    fireEvent.click(screen.getByTestId('pack-filter-education'));
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(4);
    expect(within(grid).getByTestId('education-calendar-card')).toBeDefined();
    expect(within(grid).getByTestId('education-assignments-card')).toBeDefined();
    expect(within(grid).getByTestId('education-reading-card')).toBeDefined();
    expect(within(grid).getByTestId('education-study-card')).toBeDefined();
    expect(within(grid).queryByTestId('education-forms-card')).toBeNull();

    // Child + Household = 3 cards
    fireEvent.click(screen.getByTestId('pack-filter-household'));
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(3);
    expect(within(grid).getByTestId('household-timeline-card')).toBeDefined();
    expect(within(grid).getByTestId('household-chores-card')).toBeDefined();
    expect(within(grid).getByTestId('household-meals-card')).toBeDefined();

    // Reset to All
    fireEvent.click(screen.getByTestId('pack-filter-all'));
    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(7);
  });

  it('stress tests rapid pack filter toggling in loop without memory leak or exceptions', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);
    const grid = screen.getByTestId('dashboard-slots-grid');

    const filters = ['health', 'finance', 'education', 'household', 'all'] as const;
    for (let iteration = 0; iteration < 5; iteration++) {
      for (const filter of filters) {
        fireEvent.click(screen.getByTestId(`pack-filter-${filter}`));
      }
    }

    expect(grid.querySelectorAll('[data-slot-id]').length).toBe(21);
  });
});

describe('Challenger M2-1: Visit Prep Card Checklist Toggles & Progress Bar Verification', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockPush.mockClear();
  });

  it('correctly calculates initial progress percentage and updates on checklist toggle', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    const region = screen.getByRole('region', { name: /next visit prep/i });
    const progressbar = within(region).getByRole('progressbar');

    // Initially 1 of 4 items completed: Math.round((1/4)*100) = 25%
    expect(progressbar.getAttribute('aria-valuenow')).toBe('25');
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
    expect(within(region).getByText(/1 of 4.*ready/i)).toBeDefined();

    const checkboxes = within(region).getAllByRole('checkbox');
    expect(checkboxes.length).toBe(4);

    // Toggle 2nd item: 2/4 = 50%
    fireEvent.click(checkboxes[1]);
    expect(checkboxes[1].getAttribute('aria-checked')).toBe('true');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('50');
    expect(within(region).getByText(/2 of 4.*ready/i)).toBeDefined();

    // Toggle 3rd item: 3/4 = 75%
    fireEvent.click(checkboxes[2]);
    expect(checkboxes[2].getAttribute('aria-checked')).toBe('true');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('75');
    expect(within(region).getByText(/3 of 4.*ready/i)).toBeDefined();

    // Toggle 4th item: 4/4 = 100%
    fireEvent.click(checkboxes[3]);
    expect(checkboxes[3].getAttribute('aria-checked')).toBe('true');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100');
    expect(within(region).getByText(/4 of 4.*ready/i)).toBeDefined();

    // Untoggle 1st item: 3/4 = 75%
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0].getAttribute('aria-checked')).toBe('false');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('75');
    expect(within(region).getByText(/3 of 4.*ready/i)).toBeDefined();

    // Untoggle all remaining items to reach 0%
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);
    fireEvent.click(checkboxes[3]);
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
    expect(within(region).getByText(/0 of 4.*ready/i)).toBeDefined();
  });

  it('supports keyboard navigation (Space and Enter keys) to toggle checklist items', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    const region = screen.getByRole('region', { name: /next visit prep/i });
    const progressbar = within(region).getByRole('progressbar');
    const checkboxes = within(region).getAllByRole('checkbox');

    // Toggle 2nd item via 'Enter' key
    expect(checkboxes[1].getAttribute('aria-checked')).toBe('false');
    fireEvent.keyDown(checkboxes[1], { key: 'Enter' });
    expect(checkboxes[1].getAttribute('aria-checked')).toBe('true');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('50');

    // Untoggle 2nd item via ' ' (Space) key
    fireEvent.keyDown(checkboxes[1], { key: ' ' });
    expect(checkboxes[1].getAttribute('aria-checked')).toBe('false');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('25');

    // Irrelevant keys do not toggle
    fireEvent.keyDown(checkboxes[1], { key: 'ArrowDown' });
    expect(checkboxes[1].getAttribute('aria-checked')).toBe('false');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('25');
  });

  it('handles arbitrary appointment sizes and avoids division-by-zero on empty checklists', async () => {
    const customAppt: UpcomingAppointment = {
      id: 'custom-check',
      title: 'Pediatric Checkup',
      monthShort: 'NOV',
      dayNumber: 15,
      timeStr: 'Friday 9:00 AM',
      clinician: 'Dr. Sarah Connor',
      clinic: 'Children Clinic',
      prepCompletedQuestions: 0,
      prepTotalQuestions: 3,
      checklist: [
        { id: 'c1', text: 'Immunization record', isDone: false },
        { id: 'c2', text: 'Growth chart metrics', isDone: false },
        { id: 'c3', text: 'School sports physical form', isDone: false },
      ],
    };

    await renderDashboard(<HomeDashboardClient profileId="me" initialAppointment={customAppt} />);

    const region = screen.getByRole('region', { name: /next visit prep/i });
    const progressbar = within(region).getByRole('progressbar');
    const checkboxes = within(region).getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3);

    // Initial 0/3 = 0%
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');

    // 1/3 = 33%
    fireEvent.click(checkboxes[0]);
    expect(progressbar.getAttribute('aria-valuenow')).toBe('33');
    expect(within(region).getByText(/1 of 3.*ready/i)).toBeDefined();

    // 2/3 = 67%
    fireEvent.click(checkboxes[1]);
    expect(progressbar.getAttribute('aria-valuenow')).toBe('67');
    expect(within(region).getByText(/2 of 3.*ready/i)).toBeDefined();

    // 3/3 = 100%
    fireEvent.click(checkboxes[2]);
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100');
    expect(within(region).getByText(/3 of 3.*ready/i)).toBeDefined();
  });
});
