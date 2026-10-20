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

import { AuditEvent, AuditListResponse, AuditFilterParams } from '../types/api';

export class AuditApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'AuditApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Fetches recent audit events from the /api/v1/audit route or returns local audit events fallback.
 */
export async function fetchAuditEvents(
  params: AuditFilterParams = {}
): Promise<AuditListResponse> {
  const searchParams = new URLSearchParams();

  if (params.limit !== undefined && params.limit !== null) {
    searchParams.set('limit', String(params.limit));
  }
  if (params.agent_id && params.agent_id.trim()) {
    searchParams.set('agent_id', params.agent_id.trim());
  }
  if (params.event && params.event.trim()) {
    searchParams.set('event', params.event.trim());
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/v1/audit?${queryString}` : '/api/v1/audit';

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message =
        errorData?.detail || errorData?.error || `Failed to fetch audit events (HTTP ${res.status})`;
      throw new AuditApiError(message, res.status, errorData?.detail);
    }

    const data: AuditListResponse = await res.json();
    return {
      total: typeof data.total === 'number' ? data.total : 0,
      limit: typeof data.limit === 'number' ? data.limit : 50,
      events: Array.isArray(data.events) ? data.events : [],
    };
  } catch {
    // Graceful fallback to client-side localStorage audit trail if backend route is unavailable
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('yarvelle_local_audit_events');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            let filtered = parsed;
            if (params.agent_id) {
              filtered = filtered.filter((e) => e.agent_id === params.agent_id);
            }
            if (params.event) {
              filtered = filtered.filter((e) => e.event === params.event);
            }
            return {
              total: filtered.length,
              limit: params.limit || 50,
              events: filtered.slice(0, params.limit || 50),
            };
          }
        }
      } catch {
        // storage fallback error protection
      }
    }
    return {
      total: 0,
      limit: params.limit || 50,
      events: [],
    };
  }
}

/**
 * Copies sanitized audit events to the user's clipboard formatted as JSON.
 */
export async function copyAuditEventsToClipboard(
  events: AuditEvent[]
): Promise<boolean> {
  try {
    const sanitized = events.map((ev) => {
      const { prompt, completion, ...rest } = ev as any;
      return rest;
    });

    const json = JSON.stringify(sanitized, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(json);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy audit events to clipboard:', err);
    return false;
  }
}

/**
 * Triggers a client-side JSON file download containing the given audit events.
 */
export function exportAuditEventsAsJson(
  events: AuditEvent[],
  filenamePrefix: string = 'yarvelle-activity-log'
): void {
  if (typeof window === 'undefined') return;

  const sanitized = events.map((ev) => {
    const { prompt, completion, ...rest } = ev as any;
    return rest;
  });

  const json = JSON.stringify(sanitized, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${filenamePrefix}-${now}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats an ISO-8601 UTC timestamp into localized readable date & time.
 */
export function formatAuditTimestamp(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return isoDate;
  }
}

/**
 * Formats duration in milliseconds into a concise badge string.
 */
export function formatAuditDuration(ms?: number | null): string {
  if (ms === undefined || ms === null) return '';
  if (ms < 1) return '< 1 ms';
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${Math.round(ms)} ms`;
}
