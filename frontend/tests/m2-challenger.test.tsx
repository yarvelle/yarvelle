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
import { render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';

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
import {
  DEFAULT_HOUSEHOLD_PROFILES,
  HOUSEHOLD_PROFILES_STORAGE_KEY,
} from '../src/lib/familyProfiles';

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

function getFilesRecursively(dir: string, ext = ['.ts', '.tsx']): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFilesRecursively(fullPath, ext));
    } else if (entry.isFile() && ext.some((e) => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

const srcDir = path.resolve(__dirname, '../src');
const slotDirs = ['finance', 'education', 'household'];
const slotFiles = slotDirs.flatMap((d) => getFilesRecursively(path.join(srcDir, d)));

describe('Challenger M2-2: Token Lint & Architectural Purity Scanner', () => {
  it('verifies 0 raw Tailwind palette color classes in slot packages', () => {
    const palettePattern =
      /\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/g;
    const violations: Array<{ file: string; match: string }> = [];

    for (const filePath of slotFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(palettePattern);
      if (matches) {
        matches.forEach((m) =>
          violations.push({ file: path.relative(srcDir, filePath), match: m })
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it('verifies 0 hardcoded #hex colors in slot components', () => {
    const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
    const violations: Array<{ file: string; match: string }> = [];

    for (const filePath of slotFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(hexPattern);
      if (matches) {
        matches.forEach((m) =>
          violations.push({ file: path.relative(srcDir, filePath), match: m })
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it('verifies 0 dark: Tailwind variant classes in slot packages', () => {
    const darkPattern = /\bdark:/g;
    const violations: Array<{ file: string; match: string }> = [];

    for (const filePath of slotFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(darkPattern);
      if (matches) {
        matches.forEach((m) =>
          violations.push({ file: path.relative(srcDir, filePath), match: m })
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it('verifies 0 physical-direction classes in slot packages (logical RTL enforcement)', () => {
    const physicalPattern =
      /\b(ml-|mr-|pl-|pr-|left-[0-9]|right-[0-9]|left-0|right-0|left-1|right-1|left-2|right-2|left-3|right-3|left-4|right-4)\b/g;
    const violations: Array<{ file: string; match: string }> = [];

    for (const filePath of slotFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(physicalPattern);
      if (matches) {
        matches.forEach((m) =>
          violations.push({ file: path.relative(srcDir, filePath), match: m })
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it('verifies 0 cross-pack imports between domain slots', () => {
    const violations: Array<{ file: string; invalidImport: string }> = [];
    const packNames = ['finance', 'education', 'household', 'health-ui'];

    for (const pack of packNames) {
      const dirPath = path.join(srcDir, pack);
      const files = getFilesRecursively(dirPath);

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
          if (!line.trim().startsWith('import')) continue;

          for (const otherPack of packNames) {
            if (otherPack === pack) continue;

            const importPattern = new RegExp(
              `from\\s+['"][^'"]*\\b(${otherPack}|@carefold\\/health-ui)['"]`
            );
            if (importPattern.test(line)) {
              violations.push({
                file: path.relative(srcDir, filePath),
                invalidImport: line.trim(),
              });
            }
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('verifies 0 occurrences of banned 4-letter keyword (k-i-d-s) across all frontend source files', () => {
    const allFrontendFiles = getFilesRecursively(srcDir);
    const bannedPattern = new RegExp(['k', 'i', 'd', 's'].join(''), 'i');
    const violations: string[] = [];

    for (const file of allFrontendFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (bannedPattern.test(line)) {
          violations.push(`${path.relative(srcDir, file)}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });
});

describe('Challenger M2-2: Multi-Profile Routing & Persona Reactivity', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockPush.mockClear();
    mockStorage.setItem(
      HOUSEHOLD_PROFILES_STORAGE_KEY,
      JSON.stringify(DEFAULT_HOUSEHOLD_PROFILES)
    );
  });

  it('correctly loads and displays profile "/p/me" (Leo, Self, Adult, ColorSlot 1)', async () => {
    await renderDashboard(<HomeDashboardClient profileId="me" />);

    const heroHeading = await screen.findByRole('heading', { level: 1 });
    expect(heroHeading.textContent).toContain('Leo');

    const meta = screen.getByText(/self · Self · 38 · adult/i);
    expect(meta).toBeDefined();

    const avatar = screen.getByRole('img', { name: 'Leo' });
    expect(avatar).toBeDefined();
    expect(avatar.className).toContain('bg-[var(--cf-member-1-bg)]');
    expect(avatar.textContent).toBe('LE');
  });

  it('correctly loads and displays profile "/p/rosa" (Rosa, Partner, Guardian, ColorSlot 2)', async () => {
    await renderDashboard(<HomeDashboardClient profileId="rosa" />);

    const heroHeading = await screen.findByRole('heading', { level: 1 });
    expect(heroHeading.textContent).toContain('Rosa');

    const meta = screen.getByText(/guardian · Partner · 36 · adult/i);
    expect(meta).toBeDefined();

    const avatar = screen.getByRole('img', { name: 'Rosa' });
    expect(avatar).toBeDefined();
    expect(avatar.className).toContain('bg-[var(--cf-member-2-bg)]');
    expect(avatar.textContent).toBe('RO');
  });

  it('correctly loads and displays profile "/p/maya" (Maya, Daughter, Teen, ColorSlot 3)', async () => {
    await renderDashboard(<HomeDashboardClient profileId="maya" />);

    const heroHeading = await screen.findByRole('heading', { level: 1 });
    expect(heroHeading.textContent).toContain('Maya');

    const meta = screen.getByText(/member · Daughter · 15 · teen/i);
    expect(meta).toBeDefined();

    const avatar = screen.getByRole('img', { name: 'Maya' });
    expect(avatar).toBeDefined();
    expect(avatar.className).toContain('bg-[var(--cf-member-3-bg)]');
    expect(avatar.textContent).toBe('MA');
  });

  it('correctly loads and displays profile "/p/sam" (Sam, Son, Child, ColorSlot 4)', async () => {
    await renderDashboard(<HomeDashboardClient profileId="sam" />);

    const heroHeading = await screen.findByRole('heading', { level: 1 });
    expect(heroHeading.textContent).toContain('Sam');

    const meta = screen.getByText(/member · Son · 9 · child/i);
    expect(meta).toBeDefined();

    const avatar = screen.getByRole('img', { name: 'Sam' });
    expect(avatar).toBeDefined();
    expect(avatar.className).toContain('bg-[var(--cf-member-4-bg)]');
    expect(avatar.textContent).toBe('SA');
  });

  it('correctly hosts RootDashboardPage ("/") mapping to profile "me"', async () => {
    await renderDashboard(<RootDashboardPage />);

    const heroHeading = await screen.findByRole('heading', { level: 1 });
    expect(heroHeading.textContent).toContain('Leo');

    const meta = screen.getByText(/self · Self · 38 · adult/i);
    expect(meta).toBeDefined();
  });

  it('dynamically switches profile props and rerenders persona metadata without unmounting', async () => {
    const { rerender } = await renderDashboard(<HomeDashboardClient profileId="me" />);
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toContain('Leo');

    // Switch to Rosa
    rerender(
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <HomeDashboardClient profileId="rosa" />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Rosa');
    });
    expect(screen.getByText(/guardian · Partner · 36 · adult/i)).toBeDefined();

    // Switch to Sam
    rerender(
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <HomeDashboardClient profileId="sam" />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Sam');
    });
    expect(screen.getByText(/member · Son · 9 · child/i)).toBeDefined();
  });
});

describe('Challenger M2-2: Hydration Stability & SSR Invariants', () => {
  it('verifies suppressHydrationWarning is declared on greeting display heading', () => {
    const filePath = path.join(srcDir, 'app/p/[profileId]/HomeDashboardClient.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Heading must have suppressHydrationWarning
    const headingBlock = content.match(/<h1[\s\S]*?suppressHydrationWarning[\s\S]*?>[\s\S]*?{greeting},/);
    expect(headingBlock).not.toBeNull();
  });

  it('renders time-of-day greetings across morning, afternoon, and evening without crashing', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      // 8 AM (morning)
      vi.setSystemTime(new Date(2026, 9, 24, 8, 0, 0));
      const { unmount: unmountMorning } = await renderDashboard(<HomeDashboardClient profileId="me" />);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Good morning/i);
      unmountMorning();

      // 2 PM (afternoon)
      vi.setSystemTime(new Date(2026, 9, 24, 14, 0, 0));
      const { unmount: unmountAfternoon } = await renderDashboard(<HomeDashboardClient profileId="me" />);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Good afternoon/i);
      unmountAfternoon();

      // 8 PM (evening)
      vi.setSystemTime(new Date(2026, 9, 24, 20, 0, 0));
      const { unmount: unmountEvening } = await renderDashboard(<HomeDashboardClient profileId="me" />);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Good evening/i);
      unmountEvening();
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders SSR HTML string without throwing hydration-sensitive exceptions', () => {
    // 1. SSR with default auth fallback (fully loaded synchronous render)
    const ssrHtml = renderToString(
      <ThemeProvider>
        <I18nProvider>
          <HomeDashboardClient profileId="me" />
        </I18nProvider>
      </ThemeProvider>
    );

    expect(ssrHtml).toContain('font-display');
    expect(ssrHtml).toContain('OCT');
    expect(ssrHtml).toContain('24');
    expect(ssrHtml).toContain('Cardiology follow-up');
    expect(ssrHtml).toContain('role="progressbar"');

    // 2. SSR with AuthProvider wrapper (skeleton initial state)
    const ssrWithAuth = renderToString(
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <HomeDashboardClient profileId="me" />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    );

    expect(ssrWithAuth).toContain('data-testid="dashboard-loading"');
  });
});
