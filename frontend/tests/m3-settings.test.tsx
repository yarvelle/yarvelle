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
import PacksSettingsPage from '@/app/settings/packs/page';
import ModelSettingsPage from '@/app/settings/model/page';
import PrivacySettingsPage from '@/app/settings/privacy/page';
import DisplaySettingsPage from '@/app/settings/display/page';
import DiagnosticsSettingsPage from '@/app/settings/diagnostics/page';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/i18n';

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
  usePathname: () => '/settings/packs',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Milestone 3 — Settings Shell & Domain Pack Configuration', () => {
  beforeEach(() => {
    mockStorage.clear();
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/v1/health')) {
        return {
          ok: true,
          json: async () => ({
            status: 'healthy',
            version: '0.4.0-beta.1',
            modelReachable: true,
            ollama: { reachable: true, availableModels: ['llama3.2:3b', 'mistral:7b'] },
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  describe('Domain Pack Toggles (/settings/packs)', () => {
    it('renders all four domain pack master switches', () => {
      render(<PacksSettingsPage />);

      expect(screen.getByRole('heading', { name: 'Domain Pack Toggles' })).toBeDefined();
      expect(screen.getAllByText('Health & Clinical Pack').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Finance & Bills Pack').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Education & Study Pack').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Household Operations Pack').length).toBeGreaterThanOrEqual(1);

      expect(screen.getByTestId('pack-toggle-health')).toBeDefined();
      expect(screen.getByTestId('pack-toggle-finance')).toBeDefined();
      expect(screen.getByTestId('pack-toggle-education')).toBeDefined();
      expect(screen.getByTestId('pack-toggle-household')).toBeDefined();
    });

    it('toggles pack state and updates localStorage on switch click', () => {
      render(<PacksSettingsPage />);

      const financeToggle = screen.getByTestId('pack-toggle-finance');
      expect(financeToggle.getAttribute('aria-checked')).toBe('true');

      fireEvent.click(financeToggle);
      expect(financeToggle.getAttribute('aria-checked')).toBe('false');

      const stored = mockStorage.getItem('yarvelle_active_packs_v1');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.finance).toBe(false);
    });

    it('renders contributed settings sections from domain packs via slot composition', () => {
      render(<PacksSettingsPage />);

      expect(screen.getByText('Pack Extension Settings')).toBeDefined();
    });
  });

  describe('Model & Endpoint Settings (/settings/model)', () => {
    it('renders local Ollama controls and API key inputs', async () => {
      render(<ModelSettingsPage />);

      expect(screen.getByRole('heading', { name: 'Model & Runtime Configuration' })).toBeDefined();
      expect(screen.getByTestId('ollama-url-input')).toBeDefined();
      expect(screen.getByTestId('gemini-key-input')).toBeDefined();
      expect(screen.getByTestId('anthropic-key-input')).toBeDefined();
      expect(screen.getByTestId('openai-key-input')).toBeDefined();
    });

    it('toggles API key field visibility between password and text', () => {
      render(<ModelSettingsPage />);

      const geminiInput = screen.getByTestId('gemini-key-input');
      expect(geminiInput.getAttribute('type')).toBe('password');

      const toggleGeminiBtn = screen.getByTestId('toggle-gemini-key');
      fireEvent.click(toggleGeminiBtn);
      expect(geminiInput.getAttribute('type')).toBe('text');

      fireEvent.click(toggleGeminiBtn);
      expect(geminiInput.getAttribute('type')).toBe('password');
    });

    it('saves updated settings to localStorage', () => {
      render(<ModelSettingsPage />);

      const saveBtn = screen.getByTestId('save-settings-btn');
      fireEvent.submit(saveBtn.closest('form')!);

      const stored = mockStorage.getItem('yarvelle_user_settings_v1');
      expect(stored).not.toBeNull();
      expect(screen.getByText('Changes saved successfully')).toBeDefined();
    });
  });

  describe('Privacy & Clinical Consents (/settings/privacy)', () => {
    it('renders data residency status, storage summary, and consent management', () => {
      render(<PrivacySettingsPage />);

      expect(screen.getByRole('heading', { name: 'Privacy & Data Residency' })).toBeDefined();
      expect(screen.getByTestId('storage-overview-card')).toBeDefined();
      expect(screen.getByTestId('clinical-consent-settings')).toBeDefined();
    });

    it('displays confirmation modal when Clear all conversations is clicked', () => {
      render(<PrivacySettingsPage />);

      const clearConvsBtn = screen.getByTestId('clear-conversations-btn');
      fireEvent.click(clearConvsBtn);

      expect(screen.getByText('Confirm Data Deletion')).toBeDefined();
      expect(screen.getByText(/Are you sure you want to delete all saved conversations/i)).toBeDefined();

      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);

      expect(screen.queryByText('Confirm Data Deletion')).toBeNull();
    });
  });

  describe('Display & Localization (/settings/display)', () => {
    it('renders theme selector and language picker', () => {
      render(
        <ThemeProvider>
          <I18nProvider>
            <DisplaySettingsPage />
          </I18nProvider>
        </ThemeProvider>
      );

      expect(screen.getByRole('heading', { name: 'Display & Appearance' })).toBeDefined();
      expect(screen.getByTestId('theme-selector-group')).toBeDefined();
      expect(screen.getByTestId('theme-option-light')).toBeDefined();
      expect(screen.getByTestId('theme-option-dark')).toBeDefined();
      expect(screen.getByTestId('theme-option-system')).toBeDefined();
      expect(screen.getByTestId('locale-selector-group')).toBeDefined();
    });

    it('displays live formatted date and number preview in the chosen locale', () => {
      render(
        <ThemeProvider>
          <I18nProvider>
            <DisplaySettingsPage />
          </I18nProvider>
        </ThemeProvider>
      );

      expect(screen.getByTestId('locale-format-preview')).toBeDefined();
      expect(screen.getByText('Date format:')).toBeDefined();
      expect(screen.getByText('Number format:')).toBeDefined();
    });
  });

  describe('Diagnostics & System Health (/settings/diagnostics)', () => {
    it('renders system status cards, setup checklist, and download report button', async () => {
      render(<DiagnosticsSettingsPage />);

      expect(screen.getByRole('heading', { name: 'System Diagnostics & Logs' })).toBeDefined();
      expect(screen.getByText('Runtime Backend')).toBeDefined();
      expect(screen.getByText('Ollama Inference')).toBeDefined();
      expect(screen.getByText('FTS5 Search & Index')).toBeDefined();
      expect(screen.getByTestId('setup-checklist')).toBeDefined();
      expect(screen.getByTestId('download-diagnostics-report-btn')).toBeDefined();
    });
  });
});
