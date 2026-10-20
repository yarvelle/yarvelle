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

import React, { act } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';

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

// Mock matchMedia
let prefersDarkScheme = false;
let mediaQueryListeners: Array<(e: { matches: boolean }) => void> = [];

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
  return {
    ok: true,
    json: async () => ([]),
  };
}) as any;

window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: query.includes('dark') ? prefersDarkScheme : !prefersDarkScheme,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn((event: string, handler: any) => {
    if (event === 'change') {
      mediaQueryListeners.push(handler);
    }
  }),
  removeEventListener: vi.fn((event: string, handler: any) => {
    mediaQueryListeners = mediaQueryListeners.filter((h) => h !== handler);
  }),
  dispatchEvent: vi.fn(),
})) as any;

// Mock navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/p/me',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

import {
  ThemeProvider,
  useTheme,
  useOptionalTheme,
} from '../src/components/ThemeProvider';
import { ThemeScript, THEME_SCRIPT_CONTENT } from '../src/components/ThemeScript';
import { THEME_STORAGE_KEY, getStoredTheme, setStoredTheme, applyThemeToDOM } from '../src/lib/theme';
import { AppLayout } from '../src/components/layout/AppLayout';
import { AppRail } from '../src/components/layout/AppRail';
import { MobileTopBar } from '../src/components/layout/MobileTopBar';
import { MobileTabBar } from '../src/components/layout/MobileTabBar';
import { I18nProvider } from '../src/i18n';
import { AuthProvider } from '../src/lib/auth';

function renderWithShell(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>{ui}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

describe('Challenger M1-1: Theme Switching Lifecycle & HTML Attributes', () => {
  beforeEach(() => {
    mockStorage.clear();
    prefersDarkScheme = false;
    mediaQueryListeners = [];
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  it('initializes with dark theme from storage and sets .dark class and data-theme="dark"', async () => {
    mockStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('initializes with light theme from storage and removes .dark class and sets data-theme="light"', async () => {
    mockStorage.setItem(THEME_STORAGE_KEY, 'light');
    document.documentElement.classList.add('dark');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggles theme between light and dark, updating DOM attributes and localStorage', async () => {
    mockStorage.setItem(THEME_STORAGE_KEY, 'light');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
    });

    expect(result.current.resolvedTheme).toBe('light');

    // Toggle to dark
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(mockStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // Toggle back to light
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(mockStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('resolves system theme based on OS preference (dark)', async () => {
    prefersDarkScheme = true;
    mockStorage.setItem(THEME_STORAGE_KEY, 'system');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    });

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('resolves system theme based on OS preference (light)', async () => {
    prefersDarkScheme = false;
    mockStorage.setItem(THEME_STORAGE_KEY, 'system');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    });

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('handles corrupted theme values gracefully by falling back to defaultTheme', () => {
    mockStorage.setItem(THEME_STORAGE_KEY, 'invalid_rainbow_mode');
    expect(getStoredTheme('system')).toBe('system');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    });

    expect(result.current.theme).toBe('system');
  });

  it('synchronizes theme across tabs via window storage event', () => {
    mockStorage.setItem(THEME_STORAGE_KEY, 'light');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
    });

    expect(result.current.resolvedTheme).toBe('light');

    // Simulate storage event from another browser tab
    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: 'dark',
      });
      window.dispatchEvent(storageEvent);
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('updates dynamically when OS prefers-color-scheme changes under system mode', () => {
    prefersDarkScheme = false;
    mockStorage.setItem(THEME_STORAGE_KEY, 'system');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
    });

    expect(result.current.resolvedTheme).toBe('light');

    // Simulate OS switching to dark mode
    act(() => {
      for (const listener of mediaQueryListeners) {
        listener({ matches: true });
      }
    });

    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('throws a helpful descriptive error when useTheme is called outside ThemeProvider', () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
  });

  it('returns undefined when useOptionalTheme is called outside ThemeProvider', () => {
    const { result } = renderHook(() => useOptionalTheme());
    expect(result.current).toBeUndefined();
  });
});

describe('Challenger M1-1: Hydration Theme Flash Prevention & ThemeScript', () => {
  it('renders ThemeScript element with id="yarvelle-theme-init"', () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector('#yarvelle-theme-init');
    expect(script).toBeDefined();
    expect(script?.textContent).toContain(THEME_STORAGE_KEY);
    expect(script?.textContent).toContain('prefers-color-scheme: dark');
    expect(script?.textContent).toContain('data-theme');
  });

  it('ThemeScript inline script execution correctly applies .dark and data-theme synchronously', () => {
    mockStorage.setItem(THEME_STORAGE_KEY, 'dark');

    // Execute script logic directly
    eval(THEME_SCRIPT_CONTENT);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Switch to light
    mockStorage.setItem(THEME_STORAGE_KEY, 'light');
    eval(THEME_SCRIPT_CONTENT);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

describe('Challenger M1-1: Responsive Breakpoints & Shell Architecture', () => {
  it('AppLayout applies responsive breakpoint classes: hidden md:flex for AppRail and md:hidden for mobile bars', () => {
    const { container } = renderWithShell(
      <AppLayout>
        <div data-testid="test-child">Content</div>
      </AppLayout>
    );

    // AppRail must have hidden md:flex
    const rail = screen.getByTestId('app-rail');
    expect(rail.className).toContain('hidden');
    expect(rail.className).toContain('md:flex');

    // Mobile top bar must have md:hidden
    const mobileHeader = container.querySelector('header');
    expect(mobileHeader).toBeDefined();
    expect(mobileHeader?.className).toContain('md:hidden');

    // Mobile tab bar must have md:hidden
    const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(mobileNav).toBeDefined();
    expect(mobileNav.className).toContain('md:hidden');
  });

  it('AppRail collapses to w-[72px] when collapsed and expands to w-64 when expanded', () => {
    const { rerender } = renderWithShell(<AppRail isCollapsed={false} />);
    const rail = screen.getByTestId('app-rail');
    expect(rail.className).toContain('w-64');

    rerender(
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <AppRail isCollapsed={true} />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    );

    expect(rail.className).toContain('w-[72px]');
  });

  it('verifies touch target sizes: action buttons have min 44x44px touch targets', () => {
    const { container } = renderWithShell(<MobileTopBar />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Profile switcher pill and action buttons
    for (const el of Array.from(buttons)) {
      expect(el.className).toContain('min-h-[44px]');
      expect(el.className).toContain('min-w-[44px]');
    }

    // Settings and theme toggle buttons have min-w-[44px]
    const themeBtn = screen.getByRole('button', { name: /switch theme/i });
    expect(themeBtn.className).toContain('min-h-[44px]');
    expect(themeBtn.className).toContain('min-w-[44px]');
  });

  it('verifies MobileTopBar brand logo link has min-w-[44px]', () => {
    renderWithShell(<MobileTopBar />);
    const brandLink = screen.getByRole('link', { name: /yarvelle home/i });
    expect(brandLink.className).toContain('min-h-[44px]');
    expect(brandLink.className).toContain('min-w-[44px]');
  });

  it('MobileTabBar has 5 tabs with min 44px touch targets', () => {
    renderWithShell(<MobileTabBar />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(5);

    const labels = links.map((l) => l.getAttribute('aria-label') || l.textContent);
    expect(labels.some((l) => l?.includes('Home'))).toBe(true);
    expect(labels.some((l) => l?.includes('Chat'))).toBe(true);
    expect(labels.some((l) => l?.includes('Specialists'))).toBe(true);
    expect(labels.some((l) => l?.includes('Family'))).toBe(true);
    expect(labels.some((l) => l?.includes('Settings'))).toBe(true);
  });

  it('AppLayout provides accessible skip to main content link', () => {
    renderWithShell(
      <AppLayout>
        <div data-testid="test-child">Child</div>
      </AppLayout>
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(screen.getByRole('main').getAttribute('id')).toBe('main-content');
  });
});

describe('Challenger M1-1: WCAG AA Contrast Audit across --cf-* Tokens', () => {
  function hexToRgb(hex: string): [number, number, number] {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const num = parseInt(c, 16);
    return [num >> 16, (num >> 8) & 255, num & 255];
  }

  function parseColor(str: string, bgRgb: [number, number, number] = [255, 255, 255]): [number, number, number] {
    str = str.trim();
    if (str.startsWith('#')) return hexToRgb(str);
    const rgbaMatch = str.match(/rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\)/) ||
                      str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1], 10);
      const g = parseInt(rgbaMatch[2], 10);
      const b = parseInt(rgbaMatch[3], 10);
      const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
      return [
        Math.round(r * a + bgRgb[0] * (1 - a)),
        Math.round(g * a + bgRgb[1] * (1 - a)),
        Math.round(b * a + bgRgb[2] * (1 - a)),
      ];
    }
    throw new Error('Unknown color: ' + str);
  }

  function getLuminance([r, g, b]: [number, number, number]): number {
    const [rs, gs, bs] = [r, g, b].map((v) => {
      v = v / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function getContrast(fg: string, bg: string, surfaceRgb: [number, number, number] = [255, 255, 255]): number {
    const bgRgb = typeof bg === 'string' ? parseColor(bg, surfaceRgb) : bg;
    const fgRgb = typeof fg === 'string' ? parseColor(fg, bgRgb) : fg;
    const l1 = getLuminance(fgRgb);
    const l2 = getLuminance(bgRgb);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  it('verifies light mode surfaces meet WCAG AA (>= 4.5:1) for fg, fg-muted, fg-subtle, and fg-link', () => {
    const surfaces = ['#f7faf8', '#ffffff', '#f1f5f4', '#e7eeeb', '#f2f7f4'];
    const textColors = [
      { name: 'fg', val: '#0f172a' },
      { name: 'fg-muted', val: '#475569' },
      { name: 'fg-subtle', val: '#5b6b7f' },
      { name: 'fg-link', val: '#047857' },
    ];

    for (const s of surfaces) {
      for (const t of textColors) {
        const ratio = getContrast(t.val, s);
        expect(ratio, `Light ${t.name} on ${s}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('verifies light mode status callouts and member identity meet WCAG AA (>= 4.5:1)', () => {
    // Status
    expect(getContrast('#3730a3', '#eef2ff')).toBeGreaterThanOrEqual(4.5); // info
    expect(getContrast('#92400e', '#fffbeb')).toBeGreaterThanOrEqual(4.5); // warn
    expect(getContrast('#b91c1c', '#fef2f2')).toBeGreaterThanOrEqual(4.5); // danger
    expect(getContrast('#065f46', '#ecfdf5')).toBeGreaterThanOrEqual(4.5); // success
    expect(getContrast('#ffffff', '#b91c1c')).toBeGreaterThanOrEqual(4.5); // emergency

    // Members
    expect(getContrast('#065f46', '#d1fae5')).toBeGreaterThanOrEqual(4.5); // member 1
    expect(getContrast('#5b21b6', '#ede9fe')).toBeGreaterThanOrEqual(4.5); // member 2
    expect(getContrast('#92400e', '#fef3c7')).toBeGreaterThanOrEqual(4.5); // member 3
    expect(getContrast('#075985', '#e0f2fe')).toBeGreaterThanOrEqual(4.5); // member 4
    expect(getContrast('#9f1239', '#ffe4e6')).toBeGreaterThanOrEqual(4.5); // member 5
  });

  it('verifies dark mode --cf-fg-subtle (#8897ad) on --cf-surface-3 (#1d2a45) meets WCAG AA (>= 4.5:1)', () => {
    const ratio = getContrast('#8897ad', '#1d2a45');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThan(4.7);
  });

  it('verifies dark mode primary button and link contrast meet WCAG AA (>= 4.5:1)', () => {
    // Dark primary button: dark ink #04201a on mint #10b981
    const darkBtnRatio = getContrast('#04201a', '#10b981');
    expect(darkBtnRatio).toBeGreaterThanOrEqual(4.5);

    // Dark link #34d399 on dark surface #111a2b
    const darkLinkRatio = getContrast('#34d399', '#111a2b');
    expect(darkLinkRatio).toBeGreaterThanOrEqual(4.5);
  });
});

