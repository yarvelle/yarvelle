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

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Plus,
  Clock,
  MapPin,
  Phone,
  CheckSquare,
  Square,
  Trash2,
  Bell,
  HelpCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { ScopedStorage } from '@/lib/storageNamespace';
import { generateIcsCalendar, downloadIcsCalendar } from '@/lib/ics';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

export interface Appointment {
  id: string;
  profileId: string;
  title: string;
  providerName: string;
  specialty: string;
  location: string;
  clinicPhone: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'scheduled' | 'cancelled' | 'completed';
  checklist: Array<{ id: string; label: string; checked: boolean }>;
  notes?: string;
}

export interface ReminderItem {
  id: string;
  profileId: string;
  title: string;
  category: 'medication' | 'vitals' | 'appointment' | 'prep' | 'general';
  nextDueAt: string;
  status: 'pending' | 'completed' | 'snoozed';
  snoozedUntil?: string;
}

export interface AppointmentsClientProps {
  profileId: string;
}

const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    profileId: 'me',
    title: 'Cardiovascular Comprehensive Consultation',
    providerName: 'Dr. Sarah Chen, MD, FACC',
    specialty: 'Cardiology',
    location: 'Northwest Heart Pavilion, Suite 410',
    clinicPhone: '(555) 349-2041',
    startTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 3 + 3600000).toISOString(),
    status: 'confirmed',
    checklist: [
      { id: 'c-1', label: 'Bring 14-day blood pressure log', checked: true },
      { id: 'c-2', label: 'Bring current medication list and supplements', checked: false },
      { id: 'c-3', label: 'Prepare questions about morning chest tightness', checked: false },
    ],
    notes: 'Arrive 15 minutes early for check-in and intake vitals.',
  },
  {
    id: 'apt-2',
    profileId: 'me',
    title: 'Annual Preventative Health & Eye Exam',
    providerName: 'Dr. Marcus Vance, OD',
    specialty: 'Ophthalmology',
    location: 'Metro Eye Care Center',
    clinicPhone: '(555) 782-9901',
    startTime: new Date(Date.now() + 86400000 * 12).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 12 + 2700000).toISOString(),
    status: 'scheduled',
    checklist: [
      { id: 'c-4', label: 'Bring current pair of prescription glasses', checked: false },
      { id: 'c-5', label: 'Arrange driver if dilation drops are needed', checked: false },
    ],
  },
];

const DEFAULT_REMINDERS: ReminderItem[] = [
  {
    id: 'rem-1',
    profileId: 'me',
    title: 'Morning resting blood pressure reading',
    category: 'vitals',
    nextDueAt: 'Tomorrow, 8:00 AM',
    status: 'pending',
  },
  {
    id: 'rem-2',
    profileId: 'me',
    title: 'Request cardiologist referral authorization from primary care',
    category: 'prep',
    nextDueAt: 'Friday, 2:00 PM',
    status: 'pending',
  },
  {
    id: 'rem-3',
    profileId: 'me',
    title: 'Pick up CoQ10 & multivitamin refills at pharmacy',
    category: 'medication',
    nextDueAt: 'In 3 days',
    status: 'pending',
  },
];

export function AppointmentsClient({ profileId }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(DEFAULT_APPOINTMENTS);
  const [reminders, setReminders] = useState<ReminderItem[]>(DEFAULT_REMINDERS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBookingAppt, setSelectedBookingAppt] = useState<Appointment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Appointment form state
  const [formTitle, setFormTitle] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDate, setFormDate] = useState('');

  const apptStorageKey = `appointments_${profileId}`;
  const reminderStorageKey = `reminders_${profileId}`;

  useEffect(() => {
    try {
      const storage = new ScopedStorage();
      const savedAppts = storage.getItem<Appointment[]>(apptStorageKey, []);
      if (savedAppts && savedAppts.length > 0) {
        setAppointments(savedAppts);
      }
      const savedReminders = storage.getItem<ReminderItem[]>(reminderStorageKey, []);
      if (savedReminders && savedReminders.length > 0) {
        setReminders(savedReminders);
      }
    } catch {
      // Graceful fallback
    }
  }, [apptStorageKey, reminderStorageKey]);

  const saveAppointments = (updated: Appointment[]) => {
    setAppointments(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(apptStorageKey, updated);
    } catch {}
  };

  const saveReminders = (updated: ReminderItem[]) => {
    setReminders(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(reminderStorageKey, updated);
    } catch {}
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const toggleChecklistItem = (apptId: string, checkId: string) => {
    const updated = appointments.map((a) => {
      if (a.id === apptId) {
        return {
          ...a,
          checklist: a.checklist.map((c) =>
            c.id === checkId ? { ...c, checked: !c.checked } : c
          ),
        };
      }
      return a;
    });
    saveAppointments(updated);
  };

  const toggleReminderComplete = (id: string) => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, status: (r.status === 'completed' ? 'pending' : 'completed') as ReminderItem['status'] } : r
    );
    saveReminders(updated);
  };

  const snoozeReminder = (id: string, intervalLabel: string) => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, status: 'snoozed' as const, snoozedUntil: intervalLabel } : r
    );
    saveReminders(updated);
  };

  const deleteReminderItem = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    saveReminders(updated);
  };

  const exportIcsCalendar = () => {
    const icsContent = generateIcsCalendar(appointments, { profileId });
    downloadIcsCalendar(icsContent, `yarvelle-schedule-${profileId}.ics`);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const start = formDate ? new Date(formDate).toISOString() : new Date(Date.now() + 86400000 * 7).toISOString();
    const end = new Date(new Date(start).getTime() + 3600000).toISOString();

    const newAppt: Appointment = {
      id: `apt-${Date.now()}`,
      profileId,
      title: formTitle.trim(),
      providerName: formProvider.trim() || 'Attending Physician',
      specialty: formSpecialty.trim() || 'General Practice',
      location: formLocation.trim() || 'Medical Center Suite 100',
      clinicPhone: formPhone.trim() || '(555) 123-4567',
      startTime: start,
      endTime: end,
      status: 'scheduled',
      checklist: [
        { id: `c-${Date.now()}-1`, label: 'Review past visit notes and lab questions', checked: false },
        { id: `c-${Date.now()}-2`, label: 'Confirm insurance copay & coverage details', checked: false },
      ],
    };

    saveAppointments([newAppt, ...appointments]);
    setIsAddModalOpen(false);
    setFormTitle('');
    setFormProvider('');
    setFormSpecialty('');
    setFormLocation('');
    setFormPhone('');
    setFormDate('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)]">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="schedule-page-heading" className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              Schedule & Appointments
            </h1>
            <p className="text-xs text-[var(--cf-text-muted)]">
              Upcoming clinical consultations, preparation checklists, and preventive reminders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={exportIcsCalendar}
            data-testid="export-calendar-ics-btn"
            className="text-xs text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)]"
          >
            <Download className="w-4 h-4 me-1.5" />
            Export (.ics)
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            data-testid="schedule-refresh-btn"
            aria-label="Refresh schedule"
            className="text-[var(--cf-text-muted)]"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            data-testid="add-appointment-btn"
          >
            <Plus className="w-4 h-4 me-1.5" />
            Add Appointment
          </Button>
        </div>
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upcoming Visits (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 data-testid="upcoming-visits-heading" className="text-sm font-semibold text-[var(--cf-text-primary)]">
              Upcoming Visits & Consultations
            </h2>
            <span className="text-xs text-[var(--cf-text-muted)]">{appointments.length} scheduled</span>
          </div>

          {appointments.length === 0 ? (
            <div data-testid="appointments-empty" className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-8 text-center text-xs text-[var(--cf-text-muted)]">
              No upcoming appointments. Click "Add Appointment" to schedule your next visit.
            </div>
          ) : (
            <div data-testid="appointments-list" className="space-y-4">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  data-testid={`appointment-card-${appt.id}`}
                  className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-[var(--cf-text-primary)]">{appt.title}</h3>
                        <Badge variant={appt.status === 'confirmed' ? 'success' : 'neutral'}>
                          {appt.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--cf-text-secondary)] mt-0.5">
                        {appt.providerName} · {appt.specialty}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBookingAppt(appt)}
                      data-testid="how-to-book-btn"
                      className="text-xs text-[var(--cf-primary)]"
                    >
                      <HelpCircle className="w-3.5 h-3.5 me-1" />
                      How to Book
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--cf-text-muted)] border-y border-[var(--cf-border)] py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--cf-primary)] shrink-0" />
                      <span>{new Date(appt.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--cf-accent)] shrink-0" />
                      <span className="truncate">{appt.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[var(--cf-primary)] shrink-0" />
                      <span>{appt.clinicPhone}</span>
                    </div>
                  </div>

                  {/* Preparation Checklist */}
                  {appt.checklist && appt.checklist.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-[var(--cf-text-secondary)]">
                        Visit Preparation Checklist
                      </span>
                      <ul className="space-y-1.5">
                        {appt.checklist.map((item) => (
                          <li
                            key={item.id}
                            onClick={() => toggleChecklistItem(appt.id, item.id)}
                            className="flex items-center gap-2 text-xs text-[var(--cf-text-primary)] cursor-pointer hover:opacity-80 transition"
                          >
                            {item.checked ? (
                              <CheckSquare className="w-4 h-4 text-[var(--cf-primary)] shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-[var(--cf-border-strong)] shrink-0" />
                            )}
                            <span className={item.checked ? 'line-through text-[var(--cf-text-muted)]' : ''}>
                              {item.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {appt.notes && (
                    <p className="text-xs text-[var(--cf-text-muted)] bg-[var(--cf-surface-muted)] p-2.5 rounded-xl">
                      {appt.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Reminders & Preventive Tasks (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 data-testid="reminders-heading" className="text-sm font-semibold text-[var(--cf-text-primary)]">
              Reminders & Preventive Tasks
            </h2>
            <span className="text-xs text-[var(--cf-text-muted)]">{reminders.length} active</span>
          </div>

          <div data-testid="reminders-checklist" className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-4 shadow-xs space-y-3">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                data-testid={`reminder-item-${rem.id}`}
                className="flex items-start justify-between gap-2 p-2.5 rounded-xl hover:bg-[var(--cf-surface-muted)] transition"
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleReminderComplete(rem.id)}
                    data-testid={`complete-reminder-${rem.id}`}
                    aria-label={`Toggle reminder ${rem.title}`}
                    className="mt-0.5 text-[var(--cf-primary)]"
                  >
                    {rem.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--cf-primary)]" />
                    ) : (
                      <Square className="w-4 h-4 text-[var(--cf-border-strong)]" />
                    )}
                  </button>
                  <div>
                    <p className={`text-xs font-medium text-[var(--cf-text-primary)] ${rem.status === 'completed' ? 'line-through text-[var(--cf-text-muted)]' : ''}`}>
                      {rem.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[var(--cf-text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rem.status === 'snoozed' ? `Snoozed until ${rem.snoozedUntil}` : rem.nextDueAt}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--cf-surface-elevated)] border border-[var(--cf-border)] text-[var(--cf-text-muted)]">
                        {rem.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => snoozeReminder(rem.id, 'tomorrow 9:00 AM')}
                    data-testid={`snooze-reminder-${rem.id}`}
                    aria-label="Snooze reminder"
                    className="p-1 text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] rounded"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReminderItem(rem.id)}
                    data-testid={`delete-reminder-${rem.id}`}
                    aria-label="Delete reminder"
                    className="p-1 text-[var(--cf-text-muted)] hover:text-[var(--cf-danger-text)] rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How To Book Sheet */}
      <Sheet open={Boolean(selectedBookingAppt)} onOpenChange={(open) => !open && setSelectedBookingAppt(null)} side="end">
        <SheetContent data-testid="how-to-book-sheet" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>How to Book with {selectedBookingAppt?.providerName || 'Provider'}</SheetTitle>
            <SheetDescription>
              Step-by-step guidance, telephone scripts, and required intake documentation.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pt-4 text-xs text-[var(--cf-text-primary)]">
            <div className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-muted)] p-3 space-y-1.5">
              <span className="font-semibold text-[var(--cf-text-primary)]">Direct Clinic Scheduling Line</span>
              <p className="text-sm font-bold text-[var(--cf-primary)]">{selectedBookingAppt?.clinicPhone || '(555) 000-0000'}</p>
              <p className="text-[10px] text-[var(--cf-text-muted)]">Hours: Monday – Friday, 8:00 AM – 5:00 PM local time</p>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-[var(--cf-text-primary)]">Recommended Telephone Script</span>
              <blockquote className="italic border-s-2 border-[var(--cf-primary)] ps-3 py-1 text-[var(--cf-text-secondary)] bg-[var(--cf-surface)] rounded-e">
                "Hello, I am scheduling a consultation for {selectedBookingAppt?.specialty || 'specialist care'}. I have my insurance member ID ready and a referral on file from my primary care provider. My preferred timing is mornings."
              </blockquote>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-[var(--cf-text-primary)]">Documents to Have Prepared</span>
              <ul className="list-disc list-inside space-y-1 text-[var(--cf-text-muted)]">
                <li>Government-issued photo identification</li>
                <li>Health insurance primary & secondary card</li>
                <li>Referral authorization letter (if required by insurance plan)</li>
                <li>Recent relevant lab results, imaging discs, or specialist notes</li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Appointment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent data-testid="add-appointment-modal" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Health Appointment</DialogTitle>
            <DialogDescription>
              Schedule an upcoming clinical consultation or checkup.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAppointment} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Appointment Title *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Cardiology Follow-up"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Provider Name
                </label>
                <input
                  type="text"
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value)}
                  placeholder="Dr. Smith"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  value={formSpecialty}
                  onChange={(e) => setFormSpecialty(e.target.value)}
                  placeholder="Cardiology"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Clinic Phone
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Clinic Location
              </label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="100 Medical Plaza, Suite 200"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Appointment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
