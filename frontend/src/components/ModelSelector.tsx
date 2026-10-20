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
import { Settings, ChevronDown, AlertCircle } from 'lucide-react';
import {
  type ProviderType,
  type YarvelleUserSettings,
  type CarefoldUserSettings,
  type ModelOption,
  PROVIDER_METADATA,
  PREDEFINED_MODELS,
  hasApiKeyForProvider,
} from '../lib/settings';

export interface ModelSelectorProps {
  settings: YarvelleUserSettings | CarefoldUserSettings;
  onSettingsChange?: (newSettings: YarvelleUserSettings) => void;
  onOpenSettings: () => void;
  disabled?: boolean;
  className?: string;

  // Optional individual property overrides
  selectedProvider?: ProviderType;
  selectedModel?: string;
  customModelName?: string;
  installedModels?: ModelOption[];
  onProviderChange?: (provider: ProviderType) => void;
  onModelChange?: (model: string) => void;
  onCustomModelChange?: (customModelName: string) => void;
}

export function ModelSelector({
  settings,
  onSettingsChange,
  onOpenSettings,
  disabled = false,
  className = '',
  selectedProvider,
  selectedModel,
  customModelName,
  installedModels,
  onProviderChange,
  onModelChange,
  onCustomModelChange,
}: ModelSelectorProps) {
  const currentProvider = selectedProvider ?? settings.provider ?? 'ollama';
  const currentModel = selectedModel ?? settings.model ?? 'llama3.2';
  const currentCustomModel = customModelName ?? settings.customModelName ?? '';

  const [dynamicOllamaModels, setDynamicOllamaModels] = useState<ModelOption[]>(
    installedModels || []
  );

  useEffect(() => {
    if (installedModels && installedModels.length > 0) {
      setDynamicOllamaModels(installedModels);
      return;
    }
    if (currentProvider !== 'ollama') return;

    let mounted = true;
    async function fetchInstalledModels() {
      try {
        const endpoint =
          settings.endpoints?.ollamaUrl || settings.ollamaEndpoint || 'http://127.0.0.1:11434';
        const res = await fetch(
          `/api/v1/models?provider=ollama&endpoint=${encodeURIComponent(endpoint)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data.models) && data.models.length > 0) {
            setDynamicOllamaModels(data.models);
          }
        }
      } catch {
        // Fallback silently if offline or unqueried
      }
    }

    fetchInstalledModels();
    return () => {
      mounted = false;
    };
  }, [currentProvider, settings.endpoints?.ollamaUrl, settings.ollamaEndpoint, installedModels]);

  const availableModels =
    currentProvider === 'ollama' && dynamicOllamaModels.length > 0
      ? dynamicOllamaModels
      : PREDEFINED_MODELS[currentProvider] || [];

  const isCustomMode = currentProvider === 'custom' || currentModel === 'custom';
  const isKeyMissing = !hasApiKeyForProvider(settings, currentProvider);

  // Match currentModel in availableModels
  const matchedOption = availableModels.find(
    (opt) =>
      opt.id === currentModel ||
      opt.id.replace(/:latest$/, '') === currentModel.replace(/:latest$/, '')
  );
  const selectedDropdownValue = isCustomMode
    ? 'custom'
    : matchedOption
    ? matchedOption.id
    : currentModel;

  const handleProviderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextProvider = e.target.value as ProviderType;
    const defaultModel = PROVIDER_METADATA[nextProvider]?.defaultModel || 'llama3.2';

    if (onProviderChange) {
      onProviderChange(nextProvider);
    }
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        provider: nextProvider,
        model: defaultModel,
      });
    }
  };

  const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextModel = e.target.value;
    if (onModelChange) {
      onModelChange(nextModel);
    }
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        model: nextModel,
      });
    }
  };

  const handleCustomModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = e.target.value;
    if (onCustomModelChange) {
      onCustomModelChange(nextName);
    }
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        customModelName: nextName,
      });
    }
  };

  return (
    <div className={`flex items-center flex-wrap gap-2 ${className}`}>
      {/* Provider Selector Dropdown */}
      <div className="relative">
        <label htmlFor="provider-selector" className="sr-only">
          Select AI Provider
        </label>
        <select
          id="provider-selector"
          data-testid="provider-selector"
          aria-label="Select AI Provider"
          value={currentProvider}
          onChange={handleProviderSelect}
          disabled={disabled}
          className="appearance-none bg-[var(--cf-surface)] border border-[var(--cf-border-strong)] rounded-xl ps-2.5 pe-7 py-1.5 text-xs font-semibold text-[var(--cf-fg)] hover:border-[var(--cf-fg-muted)] focus:border-[var(--cf-primary)] cursor-pointer shadow-sm disabled:opacity-50 transition"
        >
          <option value="ollama">💻 Ollama (Local)</option>
          <option value="google">✨ Gemini (Cloud)</option>
          <option value="anthropic">🧠 Claude (Cloud)</option>
          <option value="openai">⚡ OpenAI (Cloud)</option>
          <option value="custom">🌐 Custom Endpoint</option>
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--cf-fg-subtle)] absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Model Selector Dropdown (Hidden when custom provider) */}
      {currentProvider !== 'custom' && (
        <div className="relative hidden sm:block">
          <label htmlFor="model-selector" className="sr-only">
            Select Model
          </label>
          <select
            id="model-selector"
            data-testid="model-selector"
            aria-label="Select Model"
            value={selectedDropdownValue}
            onChange={handleModelSelect}
            disabled={disabled}
            className="appearance-none bg-[var(--cf-surface)] border border-[var(--cf-border-strong)] rounded-xl ps-2.5 pe-7 py-1.5 text-xs font-medium text-[var(--cf-fg)] hover:border-[var(--cf-fg-muted)] focus:border-[var(--cf-primary)] cursor-pointer shadow-sm disabled:opacity-50 transition max-w-[170px] truncate"
          >
            {availableModels.map((opt) => (
              <option key={opt.id} value={opt.id} title={opt.description}>
                {opt.name}
              </option>
            ))}
            {!isCustomMode && !availableModels.some((m) => m.id === selectedDropdownValue) && (
              <option value={selectedDropdownValue}>{selectedDropdownValue}</option>
            )}
            <option value="custom">Custom Model Name...</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--cf-fg-subtle)] absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      )}

      {/* Custom Model Name Input Field */}
      {isCustomMode && (
        <div className="relative">
          <label htmlFor="custom-model-input" className="sr-only">
            Custom Model Name
          </label>
          <div className="flex items-center">
            <input
              id="custom-model-input"
              data-testid="custom-model-input"
              type="text"
              placeholder="e.g. qwen2.5-coder:32b"
              value={currentCustomModel}
              onChange={handleCustomModelNameChange}
              disabled={disabled}
              className="bg-[var(--cf-surface)] border border-[var(--cf-border-strong)] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[var(--cf-fg)] focus:border-[var(--cf-primary)] shadow-sm w-44 transition disabled:opacity-50 placeholder:font-sans placeholder:text-[var(--cf-fg-subtle)]"
            />
          </div>
        </div>
      )}

      {/* Missing Key Warning Badge */}
      {isKeyMissing && (
        <button
          type="button"
          data-testid="missing-key-badge"
          onClick={onOpenSettings}
          title={`API key required for ${PROVIDER_METADATA[currentProvider]?.label}. Click to configure in Settings.`}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--cf-warn)]/10 border border-[var(--cf-warn)]/40 text-[var(--cf-warn)] text-xs font-semibold hover:bg-[var(--cf-warn)]/20 transition animate-pulse shadow-sm"
        >
          <AlertCircle className="w-3.5 h-3.5 text-[var(--cf-warn)] shrink-0" />
          <span>Key Required</span>
        </button>
      )}

      {/* Settings Modal Trigger Button */}
      <button
        type="button"
        data-testid="open-settings-button"
        onClick={onOpenSettings}
        title="Model & API Key Settings"
        aria-label="Open Model & API Key Settings"
        disabled={disabled}
        className="p-1.5 rounded-xl border border-[var(--cf-border)] hover:border-[var(--cf-border-strong)] text-[var(--cf-fg-muted)] hover:text-[var(--cf-fg)] bg-[var(--cf-surface)] hover:bg-[var(--cf-surface-2)] shadow-sm transition disabled:opacity-50 cursor-pointer"
      >
        <span data-testid="settings-modal-trigger" className="sr-only">
          Settings
        </span>
        <Settings className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
