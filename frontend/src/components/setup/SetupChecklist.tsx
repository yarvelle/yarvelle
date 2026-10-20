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

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Cloud,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  runSetupDiagnostics,
  markSetupComplete,
  type SetupDiagnosticsResult,
  type SetupCheckItem,
} from '@/lib/setup';

export interface SetupChecklistProps {
  isSettingsView?: boolean;
  initialStatus?: 'READY' | 'ACTION_REQUIRED' | 'DEGRADED';
  onDismiss?: () => void;
  className?: string;
}

function CopyButton({ text, testId }: { text: string; testId?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  return (
    <button
      type="button"
      data-testid={testId || 'copy-command-btn'}
      aria-label={`Copy command ${text}`}
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] text-[var(--cf-fg)] hover:bg-[var(--cf-surface-2)] transition cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-700">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-[var(--cf-fg-subtle)]" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function StepStatusIcon({
  status,
  isCloud,
}: {
  status: SetupCheckItem['status'];
  isCloud?: boolean;
}) {
  if (status === 'checking') {
    return <RotateCcw className="w-5 h-5 text-[var(--cf-fg-subtle)] animate-spin shrink-0" />;
  }
  if (status === 'pass') {
    if (isCloud) {
      return <Cloud className="w-5 h-5 text-sky-600 shrink-0" />;
    }
    return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
  }
  if (status === 'warn') {
    return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
  }
  return <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
}

function StepBadge({ badge }: { badge: SetupCheckItem['badge'] }) {
  let badgeStyles = 'bg-[var(--cf-surface-2)] text-[var(--cf-fg-muted)] border-[var(--cf-border)]';
  if (badge === '[READY]') {
    badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (badge === '[CLOUD ACTIVE]') {
    badgeStyles = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (badge === '[MISSING MODEL]' || badge === '[API KEY MISSING]') {
    badgeStyles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (badge === '[OFFLINE]') {
    badgeStyles = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span
      data-testid="status-badge"
      className={cn(
        'text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border uppercase',
        badgeStyles
      )}
    >
      {badge}
    </span>
  );
}

export function SetupChecklist({
  isSettingsView = false,
  initialStatus,
  onDismiss,
  className,
}: SetupChecklistProps) {
  const [diagnostics, setDiagnostics] = useState<SetupDiagnosticsResult | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);

  const checkConnectivity = useCallback(async () => {
    setIsChecking(true);
    setStatusAnnouncement('Checking system connectivity and model status...');
    try {
      const result = await runSetupDiagnostics();
      setDiagnostics(result);
      if (result.allPassed) {
        setStatusAnnouncement('All connectivity checks passed. System ready.');
      } else {
        setStatusAnnouncement(
          `Checks finished: Backend is ${result.backend.status}, Model is ${result.model.status}.`
        );
      }
    } catch {
      setStatusAnnouncement('Diagnostics failed to execute.');
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnectivity();
  }, [checkConnectivity]);

  const handleStarterClick = () => {
    if (!isSettingsView) {
      markSetupComplete('true');
      onDismiss?.();
    }
  };

  const isCollapsed =
    !isManuallyExpanded &&
    !isSettingsView &&
    (initialStatus === 'READY' ||
      (initialStatus !== 'ACTION_REQUIRED' &&
        initialStatus !== 'DEGRADED' &&
        Boolean(diagnostics?.allPassed)));

  if (isCollapsed) {
    return (
      <div
        data-testid="first-run-ready-compact"
        className={cn(
          'flex items-center justify-between gap-3 text-xs bg-[var(--cf-surface-2)] border border-emerald-200 rounded-xl px-4 py-3',
          className
        )}
      >
        <div data-testid="setup-collapsed-row" className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-semibold text-[var(--cf-fg)]">All set</span>
          <span className="text-[var(--cf-fg-subtle)]">•</span>
          <span className="text-[var(--cf-fg-muted)]">All systems ready — Ollama and backend connected</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="setup-expand-btn"
            onClick={() => setIsManuallyExpanded(true)}
            className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
          >
            View details
          </button>
          <button
            type="button"
            data-testid="setup-collapsed-recheck-btn"
            onClick={checkConnectivity}
            disabled={isChecking}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-[var(--cf-fg-muted)] hover:text-[var(--cf-fg)] hover:bg-[var(--cf-surface)] transition cursor-pointer"
            title="Re-check connectivity"
          >
            <RotateCcw
              className={cn('w-3.5 h-3.5', isChecking && 'animate-spin text-emerald-700')}
            />
            <span>Re-check</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="setup-checklist" className={cn('space-y-4', className)}>
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="setup-status-announcement"
      >
        {statusAnnouncement}
      </div>

      <div className="flex items-center justify-between pb-3 border-b border-[var(--cf-border)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--cf-fg)] flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            <span>
              {isSettingsView
                ? 'System Diagnostics & Connectivity'
                : 'First-Run Setup Checklist'}
            </span>
          </h3>
          <p className="text-xs text-[var(--cf-fg-muted)] mt-0.5">
            {isSettingsView
              ? 'Verify local runtime health and Ollama model availability anytime'
              : 'Ensure local backend and inference services are active before consultation'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {diagnostics?.allPassed && !isSettingsView && (
            <button
              type="button"
              data-testid="setup-collapse-btn"
              onClick={() => setIsManuallyExpanded(false)}
              className="text-xs font-semibold text-[var(--cf-fg-muted)] hover:underline cursor-pointer me-1"
            >
              Hide details
            </button>
          )}
          <button
            type="button"
            data-testid="setup-recheck-btn"
            aria-label="Re-check connectivity status"
            disabled={isChecking}
            onClick={checkConnectivity}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer min-h-[44px]',
              isChecking
                ? 'bg-[var(--cf-surface-2)] text-[var(--cf-fg-subtle)] border-[var(--cf-border)] cursor-not-allowed'
                : 'bg-[var(--cf-surface)] text-[var(--cf-fg)] border-[var(--cf-border-strong)] hover:bg-[var(--cf-surface-2)]'
            )}
          >
            <RotateCcw
              className={cn('w-3.5 h-3.5', isChecking && 'animate-spin text-emerald-600')}
            />
            <span>{isChecking ? 'Checking...' : 'Re-check'}</span>
          </button>
        </div>
      </div>

      {/* Step 1: Backend API Status */}
      <div
        data-testid="setup-step-backend"
        className={cn(
          'p-3.5 rounded-xl border transition-colors',
          diagnostics?.backend.status === 'pass'
            ? 'bg-[var(--cf-surface)] border-emerald-300'
            : diagnostics?.backend.status === 'fail'
            ? 'bg-[var(--cf-surface)] border-rose-300'
            : 'bg-[var(--cf-surface-2)] border-[var(--cf-border)]'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <StepStatusIcon status={diagnostics?.backend.status ?? 'checking'} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--cf-fg)]">
                  1. Backend API Runtime
                </span>
                <StepBadge badge={diagnostics?.backend.badge ?? '[CHECKING]'} />
              </div>
              <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
                {diagnostics?.backend.message ?? 'Probing backend runtime on port 8010...'}
              </p>

              {diagnostics?.backend.details && (
                <div className="mt-1 text-xs text-[var(--cf-fg-subtle)]">
                  {diagnostics.backend.details.map((d, idx) => (
                    <span key={idx} className="block">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {diagnostics?.backend.status === 'fail' && diagnostics.backend.fixCommand && (
          <div className="mt-3 pt-2.5 border-t border-rose-200 space-y-2">
            <span className="text-xs font-semibold text-rose-800 block">
              Actionable Fix:
            </span>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--cf-surface-2)] border border-rose-200 font-mono text-xs text-[var(--cf-fg)]">
              <span className="truncate">{diagnostics.backend.fixCommand}</span>
              <CopyButton text={diagnostics.backend.fixCommand} testId="copy-backend-command" />
            </div>
            {diagnostics.backend.docsLink && (
              <a
                href={diagnostics.backend.docsLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
              >
                <span>{diagnostics.backend.docsLabel || 'View Setup Documentation'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Model & Provider Status */}
      <div
        data-testid="setup-step-model"
        className={cn(
          'p-3.5 rounded-xl border transition-colors',
          diagnostics?.model.status === 'pass'
            ? 'bg-[var(--cf-surface)] border-emerald-300'
            : diagnostics?.model.status === 'warn'
            ? 'bg-[var(--cf-surface)] border-amber-300'
            : diagnostics?.model.status === 'fail'
            ? 'bg-[var(--cf-surface)] border-rose-300'
            : 'bg-[var(--cf-surface-2)] border-[var(--cf-border)]'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <StepStatusIcon
              status={diagnostics?.model.status ?? 'checking'}
              isCloud={diagnostics?.isCloudActive && diagnostics?.model.status === 'pass'}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--cf-fg)]">
                  2. {diagnostics?.model.title || 'Inference Model & Provider'}
                </span>
                <StepBadge badge={diagnostics?.model.badge ?? '[CHECKING]'} />
              </div>
              <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
                {diagnostics?.model.message ?? 'Probing model provider availability...'}
              </p>

              {diagnostics?.model.details && (
                <div className="mt-1.5 space-y-0.5 text-xs text-[var(--cf-fg-subtle)]">
                  {diagnostics.model.details.map((d, idx) => (
                    <span key={idx} className="block leading-relaxed">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {diagnostics?.model.fixCommand && (
          <div
            className={cn(
              'mt-3 pt-2.5 border-t space-y-2',
              diagnostics.model.status === 'fail' ? 'border-rose-200' : 'border-amber-200'
            )}
          >
            <span
              className={cn(
                'text-xs font-semibold block',
                diagnostics.model.status === 'fail' ? 'text-rose-800' : 'text-amber-800'
              )}
            >
              Actionable Fix:
            </span>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--cf-surface-2)] border border-[var(--cf-border)] font-mono text-xs text-[var(--cf-fg)]">
              <span className="truncate">{diagnostics.model.fixCommand}</span>
              <CopyButton text={diagnostics.model.fixCommand} testId="copy-model-command" />
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Starters Verification */}
      <div
        data-testid="setup-step-starters"
        className="p-3.5 rounded-xl border bg-[var(--cf-surface)] border-[var(--cf-border)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--cf-fg)]">
                3. Specialist Starters
              </span>
              <StepBadge badge="[READY]" />
            </div>
            <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
              Visit Steward and Household Steward ready with consultation starters.
            </p>
          </div>
        </div>

        <Link
          href="/chat?agent=visit-steward"
          data-testid="setup-starter-btn"
          onClick={handleStarterClick}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--cf-primary)] text-[var(--cf-fg-on-primary)] hover:bg-[var(--cf-primary-hover)] shadow-sm transition whitespace-nowrap cursor-pointer shrink-0 min-h-[44px]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try a starter</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
