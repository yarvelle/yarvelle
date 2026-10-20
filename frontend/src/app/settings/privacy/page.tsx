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

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  HardDrive,
  Download,
  Upload,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  type YarvelleUserSettings,
  DEFAULT_USER_SETTINGS,
  loadSettings,
  getBrowserStorageSummary,
  deleteAllConversations,
  deleteCurrentConversation,
  clearStoredApiKeys,
  exportHouseholdData,
  importHouseholdData,
  getProviderPrivacyState,
  type BrowserStorageSummary,
} from '@/lib/settings';
import {
  withdrawAllClinicalConsents,
  withdrawClinicalConsent,
} from '@/lib/clinicalConsent';
import { useClinicalConsents } from '@/lib/useClinicalConsents';

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<YarvelleUserSettings>(DEFAULT_USER_SETTINGS);
  const [storageSummary, setStorageSummary] = useState<BrowserStorageSummary>({
    conversationCount: 0,
    approximateSizeBytes: 0,
    formattedSize: '0 B',
    hasStoredApiKeys: false,
    storedKeyProviders: [],
  });
  const [confirmModalAction, setConfirmModalAction] = useState<
    'deleteAll' | 'deleteCurrent' | 'clearKeys' | null
  >(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const { consents } = useClinicalConsents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setStorageSummary(getBrowserStorageSummary(loaded));
  }, []);

  const consentEntries = Object.entries(consents);
  const privacyState = getProviderPrivacyState(settings);

  const handleExecuteConfirmedAction = () => {
    if (confirmModalAction === 'deleteAll') {
      const res = deleteAllConversations();
      setStorageSummary(getBrowserStorageSummary(settings));
      setFeedbackMessage(
        res.deletedCount === 1
          ? '1 conversation deleted from browser'
          : `${res.deletedCount} conversations deleted from browser`
      );
    } else if (confirmModalAction === 'deleteCurrent') {
      deleteCurrentConversation();
      setStorageSummary(getBrowserStorageSummary(settings));
      setFeedbackMessage('Current conversation deleted from browser');
    } else if (confirmModalAction === 'clearKeys') {
      clearStoredApiKeys();
      const refreshed = loadSettings();
      setSettings(refreshed);
      setStorageSummary(getBrowserStorageSummary(refreshed));
      setFeedbackMessage('Saved API keys removed from browser');
    }
    setConfirmModalAction(null);
  };

  const handleExportData = () => {
    const data = exportHouseholdData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yarvelle_household_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMessage('Household data exported successfully');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importHouseholdData(content);
        if (ok) {
          const refreshed = loadSettings();
          setSettings(refreshed);
          setStorageSummary(getBrowserStorageSummary(refreshed));
          setFeedbackMessage('Household data restored successfully');
        } else {
          setFeedbackMessage('Failed to parse backup JSON file');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[var(--cf-fg)] tracking-tight">
          Privacy & Data Residency
        </h2>
        <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
          Manage local-first data residency, browser storage quotas, and consent records
        </p>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-[var(--cf-surface-2)] border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            {feedbackMessage}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs underline hover:no-underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Data Residency Status Banner */}
      <div className="p-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--cf-fg)]">
              {privacyState.explainerTitle}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-300 bg-[var(--cf-surface)] text-emerald-700">
              {privacyState.badgeText}
            </span>
          </div>
          <p className="text-xs text-[var(--cf-fg-muted)] leading-relaxed">
            {privacyState.explainerDescription}
          </p>
        </div>
      </div>

      {/* Section 1: Clinical Assist Consent */}
      <div
        data-testid="clinical-consent-settings"
        className="space-y-3 pb-6 border-b border-[var(--cf-border)]"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--cf-fg)] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Clinical Assist Consents</span>
          </h3>
          {consentEntries.length > 1 && (
            <button
              type="button"
              data-testid="withdraw-all-clinical-consent"
              onClick={() => withdrawAllClinicalConsents()}
              className="text-xs font-semibold text-rose-700 hover:underline min-h-[36px] cursor-pointer"
            >
              Withdraw all
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--cf-fg-muted)]">
          Clinical guide agents require explicit informed consent before clinical visit preparation.
        </p>
        {consentEntries.length === 0 ? (
          <p
            data-testid="clinical-consent-empty"
            className="text-xs text-[var(--cf-fg-subtle)] italic py-2"
          >
            You have not given consent to any clinical assist agents.
          </p>
        ) : (
          <ul className="space-y-2">
            {consentEntries.map(([agentId, record]) => (
              <li
                key={agentId}
                data-testid={`clinical-consent-entry-${agentId}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--cf-fg)] truncate capitalize">
                    {agentId.replace(/-/g, ' ')}
                  </div>
                  <div className="text-xs text-[var(--cf-fg-subtle)]">
                    Consent given {new Date(record.grantedAt).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  data-testid={`withdraw-clinical-consent-${agentId}`}
                  aria-label={`Withdraw consent for ${agentId}`}
                  onClick={() => withdrawClinicalConsent(agentId)}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition min-h-[36px] cursor-pointer"
                >
                  Withdraw
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Section 2: Browser Storage & Data Purge */}
      <div
        data-testid="storage-overview-card"
        className="space-y-4 pb-6 border-b border-[var(--cf-border)]"
      >
        <div>
          <h3 className="text-sm font-semibold text-[var(--cf-fg)] flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[var(--cf-fg-subtle)]" />
            <span>Local Browser Data Storage</span>
          </h3>
          <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
            All conversations, notes, and records are stored in browser localStorage on this device.
          </p>
        </div>

        {/* Storage Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)]">
            <div className="text-[10px] font-semibold text-[var(--cf-fg-subtle)] uppercase tracking-wider">
              Stored Conversations
            </div>
            <div
              data-testid="stored-conversations-stat"
              className="text-lg font-bold text-[var(--cf-fg)] mt-1"
            >
              {storageSummary.conversationCount}{' '}
              <span className="text-xs font-normal text-[var(--cf-fg-subtle)]">
                ({storageSummary.formattedSize})
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)]">
            <div className="text-[10px] font-semibold text-[var(--cf-fg-subtle)] uppercase tracking-wider">
              Saved Cloud API Keys
            </div>
            <div
              data-testid="stored-keys-stat"
              className="text-lg font-bold text-[var(--cf-fg)] mt-1"
            >
              {storageSummary.hasStoredApiKeys ? storageSummary.storedKeyProviders.length : 'None'}{' '}
              <span className="text-xs font-normal text-[var(--cf-fg-subtle)]">
                {storageSummary.hasStoredApiKeys
                  ? `(${storageSummary.storedKeyProviders.join(', ')})`
                  : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Data Purge Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 pt-2">
          <button
            type="button"
            data-testid="delete-current-conversation-btn"
            onClick={() => setConfirmModalAction('deleteCurrent')}
            className="px-3.5 py-2 rounded-xl border border-[var(--cf-border-strong)] text-xs font-semibold text-[var(--cf-fg)] hover:bg-[var(--cf-surface-2)] transition min-h-[44px] cursor-pointer"
          >
            Delete current conversation
          </button>
          <button
            type="button"
            data-testid="clear-conversations-btn"
            onClick={() => setConfirmModalAction('deleteAll')}
            className="px-3.5 py-2 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition min-h-[44px] cursor-pointer"
          >
            Clear all conversations
          </button>
          <button
            type="button"
            data-testid="clear-api-keys-btn"
            onClick={() => setConfirmModalAction('clearKeys')}
            className="px-3.5 py-2 rounded-xl border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition min-h-[44px] cursor-pointer"
          >
            Clear saved API keys
          </button>
        </div>
      </div>

      {/* Section 3: Household Data Backup & Restore */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--cf-fg)] flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--cf-fg-subtle)]" />
            <span>Household Data Backup & Portability</span>
          </h3>
          <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
            Export a full JSON snapshot of household profiles, bills, study quiz records, and chore
            allocations, or restore from a previous backup.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            data-testid="export-household-json-btn"
            onClick={handleExportData}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--cf-border-strong)] text-xs font-semibold text-[var(--cf-fg)] bg-[var(--cf-surface)] hover:bg-[var(--cf-surface-2)] transition min-h-[44px] cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Household Data (JSON)</span>
          </button>

          <label
            htmlFor="restore-household-input"
            data-testid="restore-household-json-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--cf-border-strong)] text-xs font-semibold text-[var(--cf-fg)] bg-[var(--cf-surface)] hover:bg-[var(--cf-surface-2)] transition min-h-[44px] cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Restore Household Data</span>
          </label>
          <input
            id="restore-household-input"
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="sr-only"
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="p-6 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] shadow-xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-sm font-bold text-[var(--cf-fg)]">Confirm Data Deletion</h4>
            </div>
            <p className="text-xs text-[var(--cf-fg-muted)] leading-relaxed">
              {confirmModalAction === 'deleteAll'
                ? 'Are you sure you want to delete all saved conversations from this browser? This action cannot be undone.'
                : confirmModalAction === 'deleteCurrent'
                ? 'Are you sure you want to delete the active conversation?'
                : 'Are you sure you want to remove all saved cloud API keys from this browser?'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalAction(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--cf-border)] text-[var(--cf-fg)] hover:bg-[var(--cf-surface-2)] min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 min-h-[44px] cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
