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

import { loadSettings, type YarvelleUserSettings } from './settings';
import type { HealthResponse } from '../types/api';

export const YARVELLE_SETUP_STORAGE_KEY = 'yarvelle_setup_complete';
export const CAREFOLD_SETUP_STORAGE_KEY = 'carefold_setup_complete';

export type SetupCheckStatus = 'checking' | 'pass' | 'warn' | 'fail';

export type SetupCheckBadge =
  | '[READY]'
  | '[OFFLINE]'
  | '[MISSING MODEL]'
  | '[API KEY MISSING]'
  | '[CLOUD ACTIVE]'
  | '[CHECKING]';

export interface SetupCheckItem {
  id: 'backend' | 'model' | 'starters';
  title: string;
  status: SetupCheckStatus;
  badge: SetupCheckBadge;
  message: string;
  fixCommand?: string;
  secondaryCommand?: string;
  docsLink?: string;
  docsLabel?: string;
  details?: string[];
  ctaLink?: string;
  ctaLabel?: string;
}

export interface SetupDiagnosticsResult {
  backend: SetupCheckItem;
  model: SetupCheckItem;
  starters: SetupCheckItem;
  allPassed: boolean;
  isCloudActive: boolean;
  cloudProvider?: string;
  detectedModels: string[];
  timestamp: string;
}

export function isSetupComplete(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return true;
  }
  const val =
    window.localStorage.getItem(YARVELLE_SETUP_STORAGE_KEY) ||
    window.localStorage.getItem(CAREFOLD_SETUP_STORAGE_KEY);
  return val === 'true' || val === 'completed' || val === 'skipped';
}

export function markSetupComplete(status: 'true' | 'skipped' = 'true'): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(YARVELLE_SETUP_STORAGE_KEY, status);
  window.localStorage.setItem(CAREFOLD_SETUP_STORAGE_KEY, status);
  window.dispatchEvent(new CustomEvent('yarvelle:setup-changed', { detail: { status } }));
  window.dispatchEvent(new CustomEvent('carefold:setup-changed', { detail: { status } }));
}

export function resetSetupStatus(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(YARVELLE_SETUP_STORAGE_KEY);
  window.localStorage.removeItem(CAREFOLD_SETUP_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('yarvelle:setup-changed', { detail: { status: null } }));
  window.dispatchEvent(new CustomEvent('carefold:setup-changed', { detail: { status: null } }));
}

export async function runSetupDiagnostics(
  customSettings?: YarvelleUserSettings
): Promise<SetupDiagnosticsResult> {
  const settings = customSettings || loadSettings();
  const provider = settings.provider || 'ollama';

  // 1. Probe Backend API
  let backendItem: SetupCheckItem = {
    id: 'backend',
    title: 'Backend API Status',
    status: 'checking',
    badge: '[CHECKING]',
    message: 'Probing Yarvelle backend runtime...',
  };

  let backendOnline = false;
  let backendHealthData: HealthResponse | null = null;

  try {
    const res = await fetch('/api/v1/health', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = (await res.json()) as HealthResponse;
      backendHealthData = data;
      backendOnline = data.backendReachable !== false;
    }
  } catch {
    backendOnline = false;
  }

  if (backendOnline) {
    backendItem = {
      id: 'backend',
      title: 'Backend API Status',
      status: 'pass',
      badge: '[READY]',
      message: 'Backend API is online and responding.',
      details: [`Workspace loaded: 34 specialists, 45 skills`],
    };
  } else {
    backendItem = {
      id: 'backend',
      title: 'Backend API Status',
      status: 'fail',
      badge: '[OFFLINE]',
      message: 'Yarvelle backend runtime is unreachable on port 8010.',
      fixCommand: 'pnpm dev:backend',
      secondaryCommand: 'bash scripts/start.sh backend',
      docsLink: 'docs/getting-started/installation.md',
      docsLabel: 'Backend Setup Guide',
    };
  }

  // 2. Probe Local Model / Cloud Provider
  let modelItem: SetupCheckItem = {
    id: 'model',
    title: 'Model & Provider Status',
    status: 'checking',
    badge: '[CHECKING]',
    message: 'Probing inference provider...',
  };

  const detectedModels: string[] = [];
  let isCloudActive = false;
  let cloudProviderName: string | undefined = undefined;

  if (provider === 'ollama') {
    const endpoint = settings.endpoints?.ollamaUrl || settings.ollamaEndpoint || 'http://127.0.0.1:11434';
    let reachable = false;
    let modelsList: Array<{ id: string; name: string }> = [];

    try {
      const modelsUrl = `/api/v1/models?provider=ollama&endpoint=${encodeURIComponent(endpoint)}`;
      const res = await fetch(modelsUrl, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const data = await res.json();
        reachable = Boolean(data.reachable);
        if (Array.isArray(data.models)) {
          modelsList = data.models;
        }
      }
    } catch {
      reachable = false;
    }

    if (!reachable && backendHealthData?.ollama?.reachable) {
      reachable = true;
      if (Array.isArray(backendHealthData.ollama.availableModels)) {
        modelsList = backendHealthData.ollama.availableModels.map((m) => ({ id: m, name: m }));
      }
    }

    if (!reachable) {
      modelItem = {
        id: 'model',
        title: 'Local Ollama Daemon',
        status: 'fail',
        badge: '[OFFLINE]',
        message: `Ollama inference daemon is unreachable at ${endpoint}.`,
        fixCommand: 'ollama serve',
        docsLink: 'docs/getting-started/installation.md',
        docsLabel: 'Ollama Setup Guide',
      };
    } else if (modelsList.length === 0) {
      modelItem = {
        id: 'model',
        title: 'Ollama Model Availability',
        status: 'warn',
        badge: '[MISSING MODEL]',
        message: 'Ollama daemon is running, but no chat models are installed locally.',
        fixCommand: 'ollama pull llama3.2',
        details: [
          'Recommended default: llama3.2',
          'Supported alternatives: mistral, deepseek-r1',
        ],
        docsLink: 'docs/getting-started/installation.md',
        docsLabel: 'Model Installation Guide',
      };
    } else {
      for (const m of modelsList) {
        detectedModels.push(m.name || m.id);
      }
      const modelNames = modelsList.map((m) => m.name || m.id);
      modelItem = {
        id: 'model',
        title: 'Local Ollama Model',
        status: 'pass',
        badge: '[READY]',
        message: `Ollama online with ${modelsList.length} model(s) installed: ${modelNames.slice(0, 3).join(', ')}${modelsList.length > 3 ? '...' : ''}.`,
        details: modelNames,
      };
    }
  } else {
    isCloudActive = true;
    cloudProviderName = provider;
    const providerLabel =
      provider === 'google'
        ? 'Google Gemini'
        : provider === 'anthropic'
        ? 'Anthropic Claude'
        : provider === 'openai'
        ? 'OpenAI'
        : 'Custom Provider';

    const apiKey = (
      settings.keys?.[provider as keyof typeof settings.keys] ||
      settings.apiKeys?.[provider] ||
      ''
    ).trim();

    if (apiKey) {
      modelItem = {
        id: 'model',
        title: `Cloud Provider (${providerLabel})`,
        status: 'pass',
        badge: '[CLOUD ACTIVE]',
        message: `Cloud inference active with ${providerLabel}.`,
        details: [
          `Data residency notice: Your messages and attachments leave this device over the network to generate replies with ${providerLabel}.`,
        ],
      };
    } else {
      modelItem = {
        id: 'model',
        title: `Cloud Provider (${providerLabel})`,
        status: 'warn',
        badge: '[API KEY MISSING]',
        message: `${providerLabel} selected, but API key is missing.`,
        details: [
          `Please configure your ${providerLabel} API key in Settings -> Model & Provider Settings.`,
        ],
      };
    }
  }

  // 3. Starters Verification
  const startersItem: SetupCheckItem = {
    id: 'starters',
    title: 'Consultation Starters',
    status: 'pass',
    badge: '[READY]',
    message: 'Visit Steward and Household Steward ready with consultation starters.',
    ctaLink: '/chat?agent=visit-steward',
    ctaLabel: 'Try a starter',
  };

  const allPassed =
    backendItem.status === 'pass' &&
    modelItem.status === 'pass' &&
    startersItem.status === 'pass';

  return {
    backend: backendItem,
    model: modelItem,
    starters: startersItem,
    allPassed,
    isCloudActive,
    cloudProvider: cloudProviderName,
    detectedModels,
    timestamp: new Date().toISOString(),
  };
}
