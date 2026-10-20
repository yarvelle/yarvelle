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

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface CalendarEvent {
  id: string;
  title: string;
  domain: 'health' | 'finance' | 'education' | 'household';
  domainLabel: string;
  member: string;
  date: string;
  time: string;
  location?: string;
  profileId: string;
}

const HOUSEHOLD_EVENTS: CalendarEvent[] = [
  {
    id: 'e-1',
    title: 'Dr. Sarah Chen Cardiology Follow-up',
    domain: 'health',
    domainLabel: 'Health',
    member: 'Leo',
    profileId: 'me',
    date: 'Oct 23, 2026',
    time: '9:30 AM',
    location: 'Northwest Heart Pavilion',
  },
  {
    id: 'e-2',
    title: 'Water & Sewer Statement Auto-Pay',
    domain: 'finance',
    domainLabel: 'Finance',
    member: 'Household',
    profileId: 'me',
    date: 'Oct 24, 2026',
    time: 'Auto-Pay ($86.40)',
  },
  {
    id: 'e-3',
    title: 'AP Biology Photosynthesis Lab Report Due',
    domain: 'education',
    domainLabel: 'Education',
    member: 'Maya',
    profileId: 'maya',
    date: 'Oct 23, 2026',
    time: '11:59 PM',
  },
  {
    id: 'e-4',
    title: 'Soccer Practice & Athletic Clearances',
    domain: 'household',
    domainLabel: 'Household',
    member: 'Sam',
    profileId: 'sam',
    date: 'Oct 25, 2026',
    time: '10:00 AM',
    location: 'Community Park Field 2',
  },
];

export default function CalendarPage() {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  const filteredEvents = HOUSEHOLD_EVENTS.filter(
    (e) => selectedDomain === 'all' || e.domain === selectedDomain
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)]">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">Household Calendar</h1>
            <p className="text-xs text-[var(--cf-text-muted)] mt-0.5">
              Unified schedule across appointments, bill payment deadlines, extracurriculars, and school dates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'health', 'finance', 'education', 'household'] as const).map((dom) => (
            <button
              key={dom}
              type="button"
              onClick={() => setSelectedDomain(dom)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition ${
                selectedDomain === dom
                  ? 'bg-[var(--cf-primary)] text-[var(--cf-primary-contrast)]'
                  : 'text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] hover:bg-[var(--cf-surface-muted)]'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-7 gap-px bg-[var(--cf-border)] rounded-xl overflow-hidden text-center text-xs font-semibold py-2">
          <div className="bg-[var(--cf-surface)] py-2 text-[var(--cf-text-muted)]">Sun</div>
          <div className="bg-[var(--cf-surface)] py-2 text-[var(--cf-text-muted)]">Mon</div>
          <div className="bg-[var(--cf-surface)] py-2 text-[var(--cf-text-muted)]">Tue</div>
          <div className="bg-[var(--cf-surface)] py-2 text-[var(--cf-text-muted)]">Wed</div>
          <div className="bg-[var(--cf-surface)] py-2 text-[var(--cf-text-muted)]">Thu</div>
          <div className="bg-[var(--cf-surface)] py-2 text-[var(--cf-text-muted)]">Fri</div>
          <div className="bg-[var(--cf-surface)] py-2 text-[var(--cf-text-muted)]">Sat</div>
        </div>

        <div className="divide-y divide-[var(--cf-border)] pt-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Badge variant={event.domain === 'health' ? 'danger' : event.domain === 'finance' ? 'success' : event.domain === 'education' ? 'info' : 'neutral'}>
                  {event.domainLabel}
                </Badge>
                <div>
                  <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">{event.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--cf-text-muted)] mt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-[var(--cf-primary)]" /> {event.member}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {event.date} · {event.time}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[var(--cf-accent)]" /> {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href={`/p/${event.profileId}/appointments`}
                className="text-xs text-[var(--cf-primary)] hover:underline whitespace-nowrap self-end sm:self-center"
              >
                View in Schedule &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
