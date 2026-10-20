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

export interface IcsAppointmentInput {
  id: string;
  title: string;
  providerName?: string;
  specialty?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  status?: string;
}

/**
 * Format a JavaScript Date or ISO string into an RFC 5545 UTC timestamp (YYYYMMDDTHHMMSSZ).
 */
export function formatIcsDate(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date input for ICS conversion: ${String(dateInput)}`);
  }
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escapes characters per RFC 5545 Section 3.3.11 (TEXT values: \, ;, ,).
 */
export function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant iCalendar string (.ics) with CRLF (\r\n) line endings.
 */
export function generateIcsCalendar(
  appointments: IcsAppointmentInput[],
  options?: {
    profileId?: string;
    prodId?: string;
    now?: Date;
  }
): string {
  const now = options?.now || new Date();
  const nowStr = formatIcsDate(now);
  const prodId = options?.prodId || '-//Yarvelle//Personal Health Schedule//EN';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const a of appointments) {
    const startStr = formatIcsDate(a.startTime);
    const endStr = a.endTime
      ? formatIcsDate(a.endTime)
      : formatIcsDate(new Date(new Date(a.startTime).getTime() + 3600000));

    const descParts: string[] = [];
    if (a.specialty) descParts.push(a.specialty);
    if (a.providerName) descParts.push(`with ${a.providerName}`);
    const description = descParts.join(' ');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${a.id}@yarvelle.local`);
    lines.push(`DTSTAMP:${nowStr}`);
    lines.push(`DTSTART:${startStr}`);
    lines.push(`DTEND:${endStr}`);
    lines.push(`SUMMARY:${escapeIcsText(a.title)}`);
    if (description) {
      lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    }
    if (a.location) {
      lines.push(`LOCATION:${escapeIcsText(a.location)}`);
    }
    lines.push(`STATUS:${a.status?.toUpperCase() === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // RFC 5545 §3.1 requires CRLF line terminators
  return lines.join('\r\n') + '\r\n';
}

/**
 * Validates whether an ICS string satisfies core RFC 5545 syntactic constraints.
 */
export function validateIcsFormat(icsContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!icsContent.includes('BEGIN:VCALENDAR')) {
    errors.push('Missing BEGIN:VCALENDAR tag');
  }
  if (!icsContent.includes('END:VCALENDAR')) {
    errors.push('Missing END:VCALENDAR tag');
  }
  if (!icsContent.includes('VERSION:2.0')) {
    errors.push('Missing VERSION:2.0 property (RFC 5545 requirement)');
  }
  if (!/PRODID:.+/.test(icsContent)) {
    errors.push('Missing PRODID property (RFC 5545 requirement)');
  }

  const veventBlocks = icsContent.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  for (let i = 0; i < veventBlocks.length; i++) {
    const block = veventBlocks[i];
    if (!/UID:.+/.test(block)) {
      errors.push(`VEVENT[${i}] missing mandatory UID`);
    }
    if (!/DTSTAMP:\d{8}T\d{6}Z/.test(block)) {
      errors.push(`VEVENT[${i}] missing or invalid DTSTAMP format`);
    }
    if (!/DTSTART:\d{8}T\d{6}Z/.test(block)) {
      errors.push(`VEVENT[${i}] missing or invalid DTSTART format`);
    }
  }

  // Check CRLF terminators
  if (!icsContent.includes('\r\n')) {
    errors.push('ICS content does not use RFC 5545 standard CRLF (\\r\\n) line endings');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Client-side download helper for generated ICS content.
 */
export function downloadIcsCalendar(icsContent: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
