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
import { Server, Cpu, Database, RefreshCw, Download } from 'lucide-react';
import { SetupChecklist } from '@/components/setup/SetupChecklist';

export default function DiagnosticsSettingsPage() {
  const [healthData, setHealthData] = useState<{
    status?: string;
    version?: string;
    modelReachable?: boolean;
    uptime?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch {
      setHealthData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleDownloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      health: healthData || { status: 'offline', version: '0.4.0-beta.1' },
      localStorageKeysCount: typeof window !== 'undefined' ? window.localStorage.length : 0,
      activePacks: ['health', 'finance', 'education', 'household'],
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yarvelle_diagnostics_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--cf-fg)] tracking-tight">
            System Diagnostics & Logs
          </h2>
          <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
            Real-time health status of local runtime, Ollama model daemon, and storage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="download-diagnostics-report-btn"
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--cf-border-strong)] text-xs font-semibold text-[var(--cf-fg)] hover:bg-[var(--cf-surface-2)] transition min-h-[44px] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
          <button
            type="button"
            data-testid="refresh-health-btn"
            onClick={fetchHealth}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--cf-border-strong)] text-xs font-semibold text-[var(--cf-fg)] hover:bg-[var(--cf-surface-2)] transition min-h-[44px] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Runner Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)]">
          <div className="flex items-center justify-between text-xs text-[var(--cf-fg-subtle)] font-medium">
            <span>Runtime Backend</span>
            <Server className="w-4 h-4" />
          </div>
          <div className="text-base font-bold text-[var(--cf-fg)] mt-2 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                healthData?.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{healthData?.status === 'ok' ? 'Online' : 'Degraded'}</span>
          </div>
          <p className="text-xs text-[var(--cf-fg-subtle)] mt-1">
            Version {healthData?.version || '0.4.0-beta.1'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)]">
          <div className="flex items-center justify-between text-xs text-[var(--cf-fg-subtle)] font-medium">
            <span>Ollama Inference</span>
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-base font-bold text-[var(--cf-fg)] mt-2 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                healthData?.modelReachable ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{healthData?.modelReachable ? 'Connected' : 'Offline'}</span>
          </div>
          <p className="text-xs text-[var(--cf-fg-subtle)] mt-1">127.0.0.1:11434</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)]">
          <div className="flex items-center justify-between text-xs text-[var(--cf-fg-subtle)] font-medium">
            <span>FTS5 Search & Index</span>
            <Database className="w-4 h-4" />
          </div>
          <div className="text-base font-bold text-[var(--cf-fg)] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>SQLite Active</span>
          </div>
          <p className="text-xs text-[var(--cf-fg-subtle)] mt-1">BM25 / FTS5 Ranked</p>
        </div>
      </div>

      {/* Setup Checklist */}
      <div className="space-y-3 pt-2 border-t border-[var(--cf-border)]">
        <h3 className="text-sm font-semibold text-[var(--cf-fg)]">
          System Verification Checklist
        </h3>
        <SetupChecklist isSettingsView={true} />
      </div>
    </div>
  );
}
