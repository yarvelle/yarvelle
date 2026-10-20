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
import {
  Activity,
  Calendar,
  Mail,
  FolderLock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectorItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultStatus: 'connected' | 'available' | 'disconnected';
  badgeColor: string;
}

const CONNECTORS: ConnectorItem[] = [
  {
    id: 'health-sync',
    name: 'Apple Health & Android Health Connect',
    description: 'Sync blood pressure diurnal readings, resting heart rate, and glucose metrics from paired devices.',
    category: 'Health',
    icon: Activity,
    defaultStatus: 'available',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'calendar-sync',
    name: 'Calendar Sync (Google & CalDAV)',
    description: 'Bi-directional synchronization for upcoming clinical visits, academic deadlines, and bills calendar.',
    category: 'Household',
    icon: Calendar,
    defaultStatus: 'connected',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'email-mcp',
    name: 'Email MCP Connector (Stateless Relay)',
    description: 'Read-only detection of medical invoices, utility bills, and school permission notices without credentials storage.',
    category: 'Finance & School',
    icon: Mail,
    defaultStatus: 'available',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'file-sandbox',
    name: 'Encrypted Local File Sandbox',
    description: 'Local Content-Addressed Storage (CAS) for lab records, EOBs, tax statements, and school forms.',
    category: 'System',
    icon: FolderLock,
    defaultStatus: 'connected',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
];

export default function ConnectionsSettingsPage() {
  const [connections, setConnections] = useState<Record<string, 'connected' | 'available' | 'disconnected'>>({
    'health-sync': 'available',
    'calendar-sync': 'connected',
    'email-mcp': 'available',
    'file-sandbox': 'connected',
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  const toggleConnection = (id: string) => {
    setConnections((prev) => {
      const nextStatus = prev[id] === 'connected' ? 'disconnected' : 'connected';
      setFeedback(`Connector ${id} updated to ${nextStatus}`);
      setTimeout(() => setFeedback(null), 2500);
      return { ...prev, [id]: nextStatus };
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[var(--cf-fg)] tracking-tight">
          External Connections & Sync
        </h2>
        <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
          Manage local-first data ingress, paired mobile sync, and scoped connectors
        </p>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-[var(--cf-surface-2)] border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {feedback}
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:no-underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Security Reassurance */}
      <div className="p-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-sm font-semibold text-[var(--cf-fg)]">
            Scoped Connector Sandbox
          </span>
          <p className="text-xs text-[var(--cf-fg-muted)] leading-relaxed">
            All connectors run in an egress-allowlisted sandbox with read-only scopes.
            Credentials are encrypted with per-profile DEKs and never sent to cloud relays.
          </p>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="space-y-3">
        {CONNECTORS.map((c) => {
          const Icon = c.icon;
          const status = connections[c.id] || c.defaultStatus;
          const isConnected = status === 'connected';

          return (
            <div
              key={c.id}
              data-testid={`connector-card-${c.id}`}
              className="p-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-[var(--cf-surface-2)] border border-[var(--cf-border)] shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-[var(--cf-fg)]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[var(--cf-fg)]">
                      {c.name}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                        c.badgeColor
                      )}
                    >
                      {c.category}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-[var(--cf-surface-2)] text-[var(--cf-fg-subtle)] border-[var(--cf-border)]'
                      )}
                    >
                      {isConnected ? 'Active' : 'Disconnected'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--cf-fg-muted)] mt-1 leading-relaxed">
                    {c.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  data-testid={`toggle-connector-${c.id}`}
                  onClick={() => toggleConnection(c.id)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer min-h-[36px]',
                    isConnected
                      ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                      : 'border-[var(--cf-border-strong)] text-[var(--cf-fg)] bg-[var(--cf-surface-2)] hover:bg-[var(--cf-surface-3)]'
                  )}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
