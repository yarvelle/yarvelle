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

export type ProviderType = 'ollama' | 'google' | 'anthropic' | 'openai' | 'custom';

export interface ProviderMeta {
  id: ProviderType;
  label: string;
  badge: string;
  requiresKey: boolean;
  defaultModel: string;
  description: string;
  keyUrl?: string;
}

export const PROVIDER_METADATA: Record<ProviderType, ProviderMeta> = {
  ollama: {
    id: 'ollama',
    label: 'Ollama',
    badge: '💻 Local',
    requiresKey: false,
    defaultModel: 'llama3.2',
    description: 'Local OpenAI-compatible runner (Zero API keys)',
  },
  google: {
    id: 'google',
    label: 'Gemini',
    badge: '✨ Google',
    requiresKey: true,
    keyUrl: 'https://aistudio.google.com/app/apikey',
    defaultModel: 'gemini-2.0-flash',
    description: 'Google Gemini models via langchain-google-genai',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Claude',
    badge: '🧠 Anthropic',
    requiresKey: true,
    keyUrl: 'https://console.anthropic.com/',
    defaultModel: 'claude-3-5-sonnet-latest',
    description: 'Anthropic Claude models via langchain-anthropic',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    badge: '⚡ OpenAI',
    requiresKey: true,
    keyUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o',
    description: 'OpenAI GPT models via langchain-openai',
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    badge: '🌐 Endpoint',
    requiresKey: false,
    defaultModel: 'custom',
    description: 'Custom OpenAI-compatible endpoint (LM Studio, vLLM, LocalAI)',
  },
};

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  recommended?: boolean;
}

export const PREDEFINED_MODELS: Record<ProviderType, ModelOption[]> = {
  ollama: [
    {
      id: 'llama3.2',
      name: 'Llama 3.2 (Default)',
      recommended: true,
      description: 'Meta lightweight state-of-the-art model',
    },
    { id: 'llama3.1', name: 'Llama 3.1 8B', description: 'Meta general-purpose reasoning model' },
  ],
  google: [
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash (Fastest)',
      recommended: true,
      description: 'Next-gen multimodal high-speed model',
    },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Long-context complex reasoning model' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast, lightweight multimodal model' },
  ],
  anthropic: [
    {
      id: 'claude-3-5-sonnet-latest',
      name: 'Claude 3.5 Sonnet (Recommended)',
      recommended: true,
      description: 'Industry-leading intelligence and coding',
    },
    { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Fast)', description: 'Ultra-fast, responsive assistant' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Deep reasoning for complex inquiries' },
  ],
  openai: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o (Omni)',
      recommended: true,
      description: 'Flagship omni-model for chat and reasoning',
    },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)', description: 'Affordable, low-latency intelligent model' },
    { id: 'o1-mini', name: 'o1-mini (Reasoning)', description: 'Specialized STEM and step-by-step reasoning' },
  ],
  custom: [
    {
      id: 'custom',
      name: 'Custom Model...',
      recommended: true,
      description: 'Specify any model identifier hosted by your endpoint',
    },
  ],
};

export interface YarvelleUserSettings {
  provider: ProviderType;
  model: string;
  customModelName?: string;
  ollamaEndpoint?: string;
  customEndpoint?: string;
  keys?: {
    google?: string;
    anthropic?: string;
    openai?: string;
    custom?: string;
  };
  endpoints?: {
    ollamaUrl?: string;
    customUrl?: string;
  };
  apiKeys?: Partial<Record<ProviderType, string>>;
  theme?: string;
  locale?: string;
}

export type CarefoldUserSettings = YarvelleUserSettings; // Compatibility alias

export const DEFAULT_USER_SETTINGS: YarvelleUserSettings = {
  provider: 'ollama',
  model: 'llama3.2',
  customModelName: '',
  ollamaEndpoint: 'http://localhost:11434',
  customEndpoint: '',
  keys: {
    google: '',
    anthropic: '',
    openai: '',
    custom: '',
  },
  endpoints: {
    ollamaUrl: 'http://localhost:11434',
    customUrl: '',
  },
  apiKeys: {},
  theme: 'system',
  locale: 'en-US',
};

export const SETTINGS_STORAGE_KEY = 'yarvelle_user_settings_v1';
export const CAREFOLD_SETTINGS_STORAGE_KEY = 'carefold_user_settings_v1';

export function loadSettings(): YarvelleUserSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_USER_SETTINGS };
  }
  try {
    const raw =
      window.localStorage.getItem(SETTINGS_STORAGE_KEY) ||
      window.localStorage.getItem(CAREFOLD_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_USER_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_USER_SETTINGS };
}

export function saveSettings(settings: YarvelleUserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(settings);
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, serialized);
    window.localStorage.setItem(CAREFOLD_SETTINGS_STORAGE_KEY, serialized);
    window.dispatchEvent(new CustomEvent('yarvelle:settings-changed', { detail: settings }));
    window.dispatchEvent(new CustomEvent('carefold:settings-changed', { detail: settings }));
  } catch {}
}

export function hasApiKeyForProvider(settings: YarvelleUserSettings, provider: ProviderType): boolean {
  if (!PROVIDER_METADATA[provider]?.requiresKey) {
    return true;
  }
  // Check nested keys or flat apiKeys
  const nestedKey = settings.keys?.[provider as keyof typeof settings.keys];
  const flatKey = settings.apiKeys?.[provider];
  const key = nestedKey || flatKey || '';
  return typeof key === 'string' && key.trim().length > 0;
}

export function getApiKeyForProvider(settings: YarvelleUserSettings, provider: ProviderType): string {
  const nestedKey = settings.keys?.[provider as keyof typeof settings.keys];
  const flatKey = settings.apiKeys?.[provider];
  return nestedKey || flatKey || '';
}

export function getEndpointForProvider(settings: YarvelleUserSettings, provider: ProviderType): string {
  if (provider === 'ollama') {
    return settings.endpoints?.ollamaUrl || settings.ollamaEndpoint || 'http://localhost:11434';
  }
  if (provider === 'custom') {
    return settings.endpoints?.customUrl || settings.customEndpoint || '';
  }
  return '';
}

export function getEffectiveModel(settings: YarvelleUserSettings): string {
  if (settings.provider === 'custom' || settings.model === 'custom') {
    return settings.customModelName || 'custom';
  }
  return settings.model || PROVIDER_METADATA[settings.provider]?.defaultModel || 'llama3.2';
}

export interface ProviderPrivacyState {
  isLocal: boolean;
  provider: string;
  providerLabel: string;
  badgeText: string;
  badgeVariant: 'emerald' | 'amber';
  emptyStateText: string;
  footerText: string;
  explainerTitle: string;
  explainerDescription: string;
  destinationLabel: string;
}

export function isLocalProvider(settings: YarvelleUserSettings): boolean {
  if (!settings) return true;
  if (settings.provider === 'ollama') {
    const ep =
      settings.endpoints?.ollamaUrl || settings.ollamaEndpoint || 'http://localhost:11434';
    return ep.includes('localhost') || ep.includes('127.0.0.1');
  }
  return false;
}

export function getProviderPrivacyState(
  settings?: YarvelleUserSettings | null
): ProviderPrivacyState {
  const safe = settings || DEFAULT_USER_SETTINGS;
  const isLocal = isLocalProvider(safe);
  const provider = safe.provider || 'ollama';
  const meta = PROVIDER_METADATA[provider];
  const providerLabel = meta?.label || provider;
  const endpoint =
    provider === 'ollama'
      ? safe.endpoints?.ollamaUrl || safe.ollamaEndpoint || '127.0.0.1'
      : safe.endpoints?.customUrl || safe.customEndpoint || 'remote';

  if (isLocal) {
    return {
      isLocal: true,
      provider,
      providerLabel,
      badgeText: 'On-Device',
      badgeVariant: 'emerald',
      emptyStateText: 'All data remains exclusively on your device.',
      footerText: 'Zero cloud sync • No prompt telemetry • 100% on-device',
      explainerTitle: 'On-Device Data Residency',
      explainerDescription:
        'All prompt text, attachments, and model inference remain strictly on your local machine. No data is transmitted to cloud APIs or external servers.',
      destinationLabel: `Local (${endpoint.replace(/^https?:\/\//, '')})`,
    };
  }

  const isCloud = provider === 'google' || provider === 'anthropic' || provider === 'openai';
  const badgeText = isCloud
    ? `Cloud (${providerLabel})`
    : provider === 'ollama'
    ? 'Remote (Ollama)'
    : 'Remote (Custom)';

  return {
    isLocal: false,
    provider,
    providerLabel,
    badgeText,
    badgeVariant: 'amber',
    emptyStateText: `Your messages are sent to ${providerLabel} to generate replies.`,
    footerText: `Cloud inference active (${providerLabel}) • Zero telemetry`,
    explainerTitle: isCloud ? 'Cloud Provider Data Residency' : 'Remote Endpoint Data Residency',
    explainerDescription: isCloud
      ? `Your messages and attachments are transmitted to ${providerLabel} cloud servers to generate replies. Yarvelle does not collect telemetry or store prompts externally.`
      : `Your inference endpoint is configured to an external network host (${endpoint}). Prompts and attachments leave this machine over the network.`,
    destinationLabel: isCloud ? `${providerLabel} Cloud API` : `${providerLabel} (${endpoint})`,
  };
}

export function formatStorageSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export interface BrowserStorageSummary {
  conversationCount: number;
  approximateSizeBytes: number;
  formattedSize: string;
  hasStoredApiKeys: boolean;
  storedKeyProviders: string[];
}

export function getBrowserStorageSummary(settings?: YarvelleUserSettings): BrowserStorageSummary {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      conversationCount: 0,
      approximateSizeBytes: 0,
      formattedSize: '0 B',
      hasStoredApiKeys: false,
      storedKeyProviders: [],
    };
  }

  let conversationCount = 0;
  let approximateSizeBytes = 0;

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('carefold_msgs_') || key.startsWith('yarvelle_msgs_')) {
        conversationCount++;
        const val = window.localStorage.getItem(key) || '';
        approximateSizeBytes += (key.length + val.length) * 2;
      } else if (key.startsWith('carefold_thread_') || key.startsWith('yarvelle_thread_')) {
        const val = window.localStorage.getItem(key) || '';
        approximateSizeBytes += (key.length + val.length) * 2;
      }
    }
  } catch {}

  const currentSettings = settings || loadSettings();
  const storedKeyProviders: string[] = [];
  if (currentSettings.keys?.google?.trim()) storedKeyProviders.push('Google Gemini');
  if (currentSettings.keys?.anthropic?.trim()) storedKeyProviders.push('Anthropic Claude');
  if (currentSettings.keys?.openai?.trim()) storedKeyProviders.push('OpenAI');
  if (currentSettings.keys?.custom?.trim()) storedKeyProviders.push('Custom');

  return {
    conversationCount,
    approximateSizeBytes,
    formattedSize: formatStorageSize(approximateSizeBytes),
    hasStoredApiKeys: storedKeyProviders.length > 0,
    storedKeyProviders,
  };
}

export function deleteCurrentConversation(threadId?: string, agentId?: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    if (threadId) {
      window.localStorage.removeItem(`carefold_msgs_${threadId}`);
      window.localStorage.removeItem(`yarvelle_msgs_${threadId}`);
    }
    if (agentId) {
      const storedThread =
        window.localStorage.getItem(`carefold_thread_${agentId}`) ||
        window.localStorage.getItem(`yarvelle_thread_${agentId}`);
      if (storedThread && !threadId) {
        window.localStorage.removeItem(`carefold_msgs_${storedThread}`);
        window.localStorage.removeItem(`yarvelle_msgs_${storedThread}`);
      }
      window.localStorage.removeItem(`carefold_thread_${agentId}`);
      window.localStorage.removeItem(`yarvelle_thread_${agentId}`);
    }
    window.dispatchEvent(
      new CustomEvent('carefold:conversation-deleted', { detail: { threadId, agentId } })
    );
    window.dispatchEvent(
      new CustomEvent('yarvelle:conversation-deleted', { detail: { threadId, agentId } })
    );
    return true;
  } catch {
    return false;
  }
}

export function deleteAllConversations(): { deletedCount: number } {
  if (typeof window === 'undefined' || !window.localStorage) return { deletedCount: 0 };
  let deletedCount = 0;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (
        key &&
        (key.startsWith('carefold_msgs_') ||
          key.startsWith('yarvelle_msgs_') ||
          key.startsWith('carefold_thread_') ||
          key.startsWith('yarvelle_thread_'))
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      if (key.startsWith('carefold_msgs_') || key.startsWith('yarvelle_msgs_')) {
        deletedCount++;
      }
      window.localStorage.removeItem(key);
    }
    window.dispatchEvent(new CustomEvent('carefold:conversations-cleared'));
    window.dispatchEvent(new CustomEvent('yarvelle:conversations-cleared'));
  } catch {}
  return { deletedCount };
}

export function clearStoredApiKeys(): YarvelleUserSettings {
  const current = loadSettings();
  const cleared: YarvelleUserSettings = {
    ...current,
    keys: {
      google: '',
      anthropic: '',
      openai: '',
      custom: '',
    },
    apiKeys: {},
  };
  saveSettings(cleared);
  return cleared;
}

export function exportHouseholdData(): string {
  if (typeof window === 'undefined' || !window.localStorage) return '{}';
  const dump: Record<string, any> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && !key.includes('api_key') && !key.includes('secret')) {
        dump[key] = window.localStorage.getItem(key);
      }
    }
  } catch {}
  return JSON.stringify(dump, null, 2);
}

export function importHouseholdData(jsonString: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null) return false;
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') {
        window.localStorage.setItem(k, v);
      }
    }
    return true;
  } catch {
    return false;
  }
}

