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
import { FamilyClient } from '@/app/family/FamilyClient';
import { DEFAULT_HOUSEHOLD_PROFILES } from '@/lib/familyProfiles';

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
  usePathname: () => '/family',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Milestone 3 — Family Management Hub & Multi-Domain Governance', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockStorage.setItem(
      'yarvelle_household_profiles_v1',
      JSON.stringify(DEFAULT_HOUSEHOLD_PROFILES)
    );
  });

  it('renders all household member cards in the members grid', () => {
    render(<FamilyClient initialProfiles={DEFAULT_HOUSEHOLD_PROFILES} />);

    expect(
      screen.getByRole('heading', { name: 'Family & Permissions' })
    ).toBeDefined();
    expect(screen.getByTestId('members-grid')).toBeDefined();

    // Verify member cards for Leo, Rosa, Maya, Sam
    expect(screen.getByTestId('member-card-me')).toBeDefined();
    expect(screen.getByTestId('member-card-rosa')).toBeDefined();
    expect(screen.getByTestId('member-card-maya')).toBeDefined();
    expect(screen.getByTestId('member-card-sam')).toBeDefined();
  });

  it('renders multi-domain access governance matrix across all four domains', () => {
    render(<FamilyClient initialProfiles={DEFAULT_HOUSEHOLD_PROFILES} />);

    const matrixTable = screen.getByTestId('role-matrix-table');
    expect(matrixTable).toBeDefined();

    // Verify domain capabilities legend cards
    expect(screen.getByText('Health & Clinical Vitals')).toBeDefined();
    expect(screen.getByText('Finance & Medical Bridge')).toBeDefined();
    expect(screen.getByText('Education & Study Decks')).toBeDefined();
    expect(screen.getByText('Household & Chores')).toBeDefined();
  });

  it('opens ViewerInviteModal when Invite Viewer button is clicked', () => {
    render(<FamilyClient initialProfiles={DEFAULT_HOUSEHOLD_PROFILES} />);

    const inviteBtn = screen.getByTestId('invite-viewer-btn');
    fireEvent.click(inviteBtn);

    expect(screen.getByText('Invite Guest Viewer')).toBeDefined();
    expect(screen.getByTestId('generate-invite-code-btn')).toBeDefined();
  });

  it('generates a new viewer invite code and appends to invitations list', async () => {
    render(<FamilyClient initialProfiles={DEFAULT_HOUSEHOLD_PROFILES} />);

    const inviteBtn = screen.getByTestId('invite-viewer-btn');
    fireEvent.click(inviteBtn);

    const nameInput = screen.getByTestId('invitee-name-input');
    fireEvent.change(nameInput, { target: { value: 'Grandma Helen' } });

    const generateBtn = screen.getByTestId('generate-invite-code-btn');
    fireEvent.click(generateBtn);

    // Modal displays generated code and user clicks Done
    const doneBtn = await screen.findByText('Done');
    fireEvent.click(doneBtn);

    // Invitations list displays new invite code
    expect(screen.getByTestId('invitations-list')).toBeDefined();
    const revokeButtons = screen.getAllByTestId(/^revoke-invite-/);
    expect(revokeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('revokes an existing invitation when Revoke button is clicked', async () => {
    render(<FamilyClient initialProfiles={DEFAULT_HOUSEHOLD_PROFILES} />);

    // Generate an invite first
    fireEvent.click(screen.getByTestId('invite-viewer-btn'));
    fireEvent.change(screen.getByTestId('invitee-name-input'), { target: { value: 'Math Tutor' } });
    fireEvent.click(screen.getByTestId('generate-invite-code-btn'));
    const doneBtn = await screen.findByText('Done');
    fireEvent.click(doneBtn);

    const revokeButtons = await screen.findAllByTestId(/^revoke-invite-/);
    const initialCount = revokeButtons.length;

    fireEvent.click(revokeButtons[0]);

    await waitFor(() => {
      const remainingRevokeButtons = screen.queryAllByTestId(/^revoke-invite-/);
      expect(remainingRevokeButtons.length).toBe(initialCount - 1);
    });
  });
});
