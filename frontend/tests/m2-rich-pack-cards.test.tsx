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
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

import {
  UnifiedTimelineCard,
  CrossDomainLinksCard,
  ChoresRotationCard,
  MealPlannerCard,
  HomeMaintenanceCard,
  TravelItinerariesCard,
  CaregiverHandoverCard,
  PanelTogglesSection,
} from '../src/household';

import {
  BillsCalendarCard,
  MonthlyBudgetCard,
  StatementsCard,
  MedicalCostBridgeCard,
  SubscriptionsCard,
} from '../src/finance';

import {
  AcademicCalendarCard,
  AssignmentsCard,
  ReadingLogCard,
  StudyQuizHelperCard,
  SchoolFormsCard,
} from '../src/education';

const defaultSlotProps = { profileId: 'me', scopes: [] };

describe('Milestone 2 — Rich Household Pack Cards', () => {
  it('renders UnifiedTimelineCard with chronological feed and domain filtering', () => {
    render(<UnifiedTimelineCard {...defaultSlotProps} />);
    const card = screen.getByTestId('household-timeline-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Unified Family Timeline')).toBeDefined();
    expect(screen.getByText(/Dr. Chen Cardiology Consultation/i)).toBeDefined();
    expect(screen.getByText(/HVAC Air Filter Replacement/i)).toBeDefined();

    // Domain filter pill
    const healthPill = within(card).getByRole('button', { name: 'Health' });
    fireEvent.click(healthPill);
    expect(screen.getByText(/Dr. Chen Cardiology Consultation/i)).toBeDefined();
  });

  it('renders CrossDomainLinksCard with YV-X-3 schedule conflict alerts and cross-domain links', () => {
    render(<CrossDomainLinksCard {...defaultSlotProps} />);
    const card = screen.getByTestId('household-cross-links-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Cross-Domain Links & Alerts')).toBeDefined();
    expect(screen.getByText(/Simultaneous Event Overlap/i)).toBeDefined();
    expect(screen.getByText(/Medical Prep Boundary Conflict/i)).toBeDefined();

    // Active cross links
    expect(screen.getByText(/Cardiology Visit/i)).toBeDefined();
    expect(screen.getByText(/EOB Claim No. 94821/i)).toBeDefined();
    expect(screen.getByText(/Sports Physical Clearance/i)).toBeDefined();
  });

  it('renders ChoresRotationCard with 7-day streak tracker and checkable routines', () => {
    render(<ChoresRotationCard {...defaultSlotProps} />);
    const card = screen.getByTestId('household-chores-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Chores & Routines')).toBeDefined();
    expect(screen.getByText(/5-day streak/i)).toBeDefined();

    // Progress bar
    const progressbar = within(card).getByRole('progressbar', { name: /daily chore completion progress/i });
    expect(progressbar).toBeDefined();

    // Checkboxes
    const checkboxes = within(card).getAllByRole('checkbox');
    expect(checkboxes.length).toBe(4);

    // Toggle 3rd chore
    expect(checkboxes[2].getAttribute('aria-checked')).toBe('false');
    fireEvent.click(checkboxes[2]);
    expect(checkboxes[2].getAttribute('aria-checked')).toBe('true');
  });

  it('renders MealPlannerCard with allergen safety badges and grocery items', () => {
    render(<MealPlannerCard {...defaultSlotProps} />);
    const card = screen.getByTestId('household-meals-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Meal Planner & Groceries')).toBeDefined();
    expect(screen.getByText('Nut-Free Facility')).toBeDefined();
    expect(screen.getByText(/Wild Salmon with Asparagus/i)).toBeDefined();
    expect(screen.getByText('Needed Grocery Items')).toBeDefined();
  });

  it('renders HomeMaintenanceCard with filter lifecycles and warranties', () => {
    render(<HomeMaintenanceCard {...defaultSlotProps} />);
    const card = screen.getByTestId('household-maintenance-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Home Maintenance')).toBeDefined();
    expect(screen.getByText(/HVAC Main Air Filter/i)).toBeDefined();
    expect(screen.getByText('Carrier Infinity 19 Heat Pump')).toBeDefined();
  });

  it('renders TravelItinerariesCard with milestones and packing progress', () => {
    render(<TravelItinerariesCard {...defaultSlotProps} />);
    const card = screen.getByTestId('household-travel-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Travel & Trips')).toBeDefined();
    expect(screen.getByText(/Olympic Coast & Mountain Cabin/i)).toBeDefined();
    expect(within(card).getByRole('progressbar', { name: /trip packing progress/i })).toBeDefined();
  });

  it('renders CaregiverHandoverCard with emergency contacts and critical allergen notice', () => {
    render(<CaregiverHandoverCard {...defaultSlotProps} />);
    const card = screen.getByTestId('household-handover-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Caregiver Handover Binder')).toBeDefined();
    expect(screen.getByText('Critical Allergen Notice')).toBeDefined();
    expect(screen.getByText(/Severe Peanut Allergy/i)).toBeDefined();
    expect(screen.getByText('Emergency Contact Directory')).toBeDefined();
    expect(screen.getByText('Martha Davis')).toBeDefined();
  });

  it('renders PanelTogglesSection with domain pack switches and slot controls', () => {
    render(<PanelTogglesSection {...defaultSlotProps} />);
    const card = screen.getByTestId('household-panel-toggles');
    expect(card).toBeDefined();

    expect(screen.getByText('Household Domain Toggles')).toBeDefined();
    expect(screen.getByText('Domain Pack Activations')).toBeDefined();
    expect(screen.getByText('Health & Clinical Pack')).toBeDefined();
    expect(screen.getByText('Household Dashboard Cards Visibility')).toBeDefined();

    const switches = within(card).getAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(10);
    fireEvent.click(switches[0]);
  });
});

describe('Milestone 2 — Rich Finance Pack Cards', () => {
  it('renders BillsCalendarCard with amounts, due dates, and reminders', () => {
    render(<BillsCalendarCard {...defaultSlotProps} />);
    const card = screen.getByTestId('finance-bills-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Bills & Due Dates')).toBeDefined();
    expect(screen.getByText('Apex Home Mortgage')).toBeDefined();
    expect(screen.getByText('$1,850.00')).toBeDefined();

    // Reminder toggle
    const reminderBtns = within(card).getAllByRole('button', { name: /reminder/i });
    expect(reminderBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(reminderBtns[0]);
  });

  it('renders MonthlyBudgetCard with envelope progress bars', () => {
    render(<MonthlyBudgetCard {...defaultSlotProps} />);
    const card = screen.getByTestId('finance-budget-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Monthly Budget')).toBeDefined();
    expect(screen.getByText('Housing & Mortgage')).toBeDefined();
    expect(screen.getByText('Medical & HSA Expenses')).toBeDefined();
  });

  it('renders StatementsCard with account summaries and OCR extractions', () => {
    render(<StatementsCard {...defaultSlotProps} />);
    const card = screen.getByTestId('finance-statements-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Receipts & Statements')).toBeDefined();
    expect(screen.getByText(/Health Savings Account/i)).toBeDefined();
  });

  it('renders MedicalCostBridgeCard with deductible and OOP max trackers', () => {
    render(<MedicalCostBridgeCard {...defaultSlotProps} />);
    const card = screen.getByTestId('finance-medical-bridge-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Medical-Cost Bridge')).toBeDefined();
    expect(screen.getByText(/Cardiology Specialist Consult/i)).toBeDefined();
  });

  it('renders SubscriptionsCard with monthly recurring totals', () => {
    render(<SubscriptionsCard {...defaultSlotProps} />);
    const card = screen.getByTestId('finance-subscriptions-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Subscriptions & Memberships')).toBeDefined();
    expect(screen.getByText(/Family Cloud Storage/i)).toBeDefined();
  });
});

describe('Milestone 2 — Rich Education Pack Cards', () => {
  it('renders AcademicCalendarCard with term milestones and exam countdowns', () => {
    render(<AcademicCalendarCard {...defaultSlotProps} />);
    const card = screen.getByTestId('education-calendar-card');
    expect(card).toBeDefined();

    expect(screen.getByText('School Calendar & Events')).toBeDefined();
    expect(screen.getByText(/Midterm Science Assessment/i)).toBeDefined();
  });

  it('renders AssignmentsCard with subject badges and completion check-offs', () => {
    render(<AssignmentsCard {...defaultSlotProps} />);
    const card = screen.getByTestId('education-assignments-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Assignments & Due Dates')).toBeDefined();
    expect(screen.getByText(/Photosynthesis Lab/i)).toBeDefined();

    const taskButtons = within(card).getAllByRole('button', { name: /mark/i });
    expect(taskButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(taskButtons[0]);
  });

  it('renders ReadingLogCard with 7-day streak and personal book goal', () => {
    render(<ReadingLogCard {...defaultSlotProps} />);
    const card = screen.getByTestId('education-reading-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Reading & Growth Log')).toBeDefined();
    expect(screen.getByText(/Weekly Reading Streak/i)).toBeDefined();
    expect(screen.getByText(/The Phantom Tollbooth/i)).toBeDefined();
  });

  it('renders StudyQuizHelperCard with topic selection and flashcards', () => {
    render(<StudyQuizHelperCard {...defaultSlotProps} />);
    const card = screen.getByTestId('education-study-card');
    expect(card).toBeDefined();

    expect(screen.getByText('Practice Quizzes & Flashcards')).toBeDefined();
    expect(screen.getByText('Biology')).toBeDefined();
    expect(screen.getByText(/Socratic Hint/i)).toBeDefined();
  });

  it('renders SchoolFormsCard with permission slips and action links', () => {
    render(<SchoolFormsCard {...defaultSlotProps} />);
    const card = screen.getByTestId('education-forms-card');
    expect(card).toBeDefined();

    expect(screen.getByText('School & Field Trip Forms')).toBeDefined();
    expect(screen.getByText(/Sports Physical Clearance Waiver/i)).toBeDefined();
  });
});
