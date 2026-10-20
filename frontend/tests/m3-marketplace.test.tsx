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
import { AgentsClient } from '@/app/agents/AgentsClient';
import { getAllSpecialists, getAllSkills } from '@/lib/catalog';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/agents',
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Milestone 3 — Marketplace (Agents, Helpers & Skills Catalog)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides static catalog with comprehensive specialists and 45 modular skills', () => {
    const specialists = getAllSpecialists();
    const skills = getAllSkills();

    expect(specialists.length).toBeGreaterThanOrEqual(34);
    expect(skills.length).toBe(45);

    // Verify key multi-domain agents
    const ids = specialists.map((s) => s.id);
    expect(ids).toContain('visit-steward');
    expect(ids).toContain('cardiology-guide');
    expect(ids).toContain('finance-organizer');
    expect(ids).toContain('education-navigator');
    expect(ids).toContain('study-companion');
    expect(ids).toContain('household-steward');
    expect(ids).toContain('orchestrator');
  });

  it('renders all specialists by default in AgentsClient', () => {
    const all = getAllSpecialists();
    render(
      <AgentsClient
        initialAgents={all}
        initialSkills={getAllSkills()}
      />
    );

    expect(screen.getByText('Specialists & Skills')).toBeDefined();
    expect(screen.getByTestId('specialist-grid')).toBeDefined();

    // Check count of rendered specialist cards
    const cards = screen.getAllByTestId(/^specialist-card-/);
    expect(cards.length).toBe(all.length);
  });

  it('filters specialists by domain when domain chips are clicked', () => {
    render(
      <AgentsClient
        initialAgents={getAllSpecialists()}
        initialSkills={getAllSkills()}
      />
    );

    // Filter by Finance
    const financeChip = screen.getByTestId('domain-filter-finance');
    fireEvent.click(financeChip);

    let cards = screen.getAllByTestId(/^specialist-card-/);
    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('specialist-card-finance-organizer')).toBeDefined();

    // Filter by Education
    const educationChip = screen.getByTestId('domain-filter-education');
    fireEvent.click(educationChip);

    cards = screen.getAllByTestId(/^specialist-card-/);
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId('specialist-card-education-navigator')).toBeDefined();
    expect(screen.getByTestId('specialist-card-study-companion')).toBeDefined();

    // Filter by Household
    const householdChip = screen.getByTestId('domain-filter-household');
    fireEvent.click(householdChip);

    cards = screen.getAllByTestId(/^specialist-card-/);
    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('specialist-card-household-steward')).toBeDefined();

    // Reset to All
    const allChip = screen.getByTestId('domain-filter-all');
    fireEvent.click(allChip);

    cards = screen.getAllByTestId(/^specialist-card-/);
    expect(cards.length).toBe(getAllSpecialists().length);
  });

  it('switches to Skills tab and displays the 45 skills catalog', () => {
    render(
      <AgentsClient
        initialAgents={getAllSpecialists()}
        initialSkills={getAllSkills()}
      />
    );

    const skillsTab = screen.getByTestId('marketplace-tab-skills');
    fireEvent.click(skillsTab);

    expect(screen.getByTestId('skills-grid')).toBeDefined();
    const skillCards = screen.getAllByTestId(/^skill-card-/);
    expect(skillCards.length).toBe(45);
  });

  it('navigates to chat studio when Consult Specialist button is clicked', () => {
    render(
      <AgentsClient
        initialAgents={getAllSpecialists()}
        initialSkills={getAllSkills()}
      />
    );

    const consultBtn = screen.getByTestId('consult-specialist-visit-steward');
    const link = consultBtn.closest('a');
    expect(link?.getAttribute('href')).toBe('/chat?agent=visit-steward');
  });

  it('filters specialists via live search input', () => {
    render(
      <AgentsClient
        initialAgents={getAllSpecialists()}
        initialSkills={getAllSkills()}
      />
    );

    const searchInput = screen.getByTestId('marketplace-search-input');
    fireEvent.change(searchInput, { target: { value: 'cardiology' } });

    const cards = screen.getAllByTestId(/^specialist-card-/);
    expect(cards.length).toBe(1);
    expect(screen.getByTestId('specialist-card-cardiology-guide')).toBeDefined();
  });
});
