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
  Cpu,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type YarvelleUserSettings,
  DEFAULT_USER_SETTINGS,
  loadSettings,
  saveSettings,
} from '@/lib/settings';

export default function ModelSettingsPage() {
  const [formData, setFormData] = useState<YarvelleUserSettings>(DEFAULT_USER_SETTINGS);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setFormData(loaded);
    checkOllama(loaded.endpoints?.ollamaUrl || loaded.ollamaEndpoint);
  }, []);

  const checkOllama = async (_url?: string) => {
    setOllamaStatus('checking');
    try {
      const res = await fetch('/api/v1/health');
      if (res.ok) {
        const data = await res.json();
        if (data?.modelReachable || data?.ollama?.reachable) {
          setOllamaStatus('connected');
          const models = data?.availableModels || data?.ollama?.availableModels;
          if (Array.isArray(models)) {
            setOllamaModels(models);
          }
        } else {
          setOllamaStatus('error');
        }
      } else {
        setOllamaStatus('error');
      }
    } catch {
      setOllamaStatus('error');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--cf-fg)] tracking-tight">
          Model & Runtime Configuration
        </h2>
        <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
          Configure local Ollama inference and optional cloud LLM providers
        </p>
      </div>

      {/* Local-First Privacy Notice */}
      <div
        data-testid="privacy-notice"
        className="p-4 rounded-xl bg-[var(--cf-surface-2)] border border-emerald-300 flex items-start gap-3"
      >
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--cf-fg)] leading-relaxed">
          <span className="font-bold block mb-1">Local-First Privacy Guarantee</span>
          By default, all inference runs locally on your machine via Ollama. No family health,
          finance, education, or household records leave this computer unless you configure
          and activate a third-party cloud provider below.
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Ollama Local Configuration */}
        <div className="space-y-3 pb-6 border-b border-[var(--cf-border)]">
          <div className="flex items-center justify-between">
            <label
              htmlFor="ollama-url-input"
              className="text-sm font-semibold text-[var(--cf-fg)] flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Ollama Host URL</span>
            </label>
            <span className="text-[10px] font-semibold text-emerald-700 bg-[var(--cf-surface)] px-2.5 py-0.5 rounded-full border border-emerald-300">
              Zero API Keys Required
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="ollama-url-input"
              data-testid="ollama-url-input"
              type="text"
              value={formData.endpoints?.ollamaUrl || formData.ollamaEndpoint || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ollamaEndpoint: e.target.value,
                  endpoints: { ...formData.endpoints, ollamaUrl: e.target.value },
                })
              }
              placeholder="http://127.0.0.1:11434"
              className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition-all min-h-[44px]"
            />
            <button
              type="button"
              data-testid="check-connectivity-btn"
              onClick={() => checkOllama(formData.endpoints?.ollamaUrl || formData.ollamaEndpoint)}
              disabled={ollamaStatus === 'checking'}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface-2)] text-[var(--cf-fg)] hover:bg-[var(--cf-surface-3)] transition-all min-h-[44px] shrink-0 cursor-pointer"
            >
              {ollamaStatus === 'checking' ? 'Checking...' : 'Check Connectivity'}
            </button>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                ollamaStatus === 'connected' && 'bg-emerald-500',
                ollamaStatus === 'error' && 'bg-amber-500',
                ollamaStatus === 'checking' && 'bg-[var(--cf-fg-subtle)] animate-pulse',
                ollamaStatus === 'idle' && 'bg-[var(--cf-border)]'
              )}
            />
            <span className="text-[var(--cf-fg-muted)]">
              {ollamaStatus === 'connected'
                ? 'Connected to local Ollama runtime'
                : ollamaStatus === 'error'
                ? 'Ollama is unreachable. Ensure ollama serve is running locally.'
                : 'Ready'}
            </span>
          </div>
        </div>

        {/* Section 2: Optional Cloud AI Providers */}
        <div className="space-y-4 pb-6 border-b border-[var(--cf-border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--cf-fg)] flex items-center gap-2">
              <Key className="w-4 h-4 text-[var(--cf-fg-subtle)]" />
              <span>Optional Cloud AI Providers</span>
            </h3>
            <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
              Supply API keys if you want to use cloud LLMs. Keys are stored encrypted in your local browser.
            </p>
          </div>

          {/* Google Gemini */}
          <div className="space-y-1.5">
            <label htmlFor="gemini-key-input" className="text-xs font-semibold text-[var(--cf-fg)] block">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                id="gemini-key-input"
                data-testid="gemini-key-input"
                type={showGeminiKey ? 'text' : 'password'}
                value={formData.keys?.google || formData.apiKeys?.google || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    keys: { ...formData.keys, google: e.target.value },
                    apiKeys: { ...formData.apiKeys, google: e.target.value },
                  })
                }
                placeholder="AIzaSy..."
                className="w-full ps-3 pe-10 py-2 text-xs font-mono rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition-all min-h-[44px]"
              />
              <button
                type="button"
                data-testid="toggle-gemini-key"
                aria-label={showGeminiKey ? 'Hide Gemini API key' : 'Show Gemini API key'}
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--cf-fg-subtle)] hover:text-[var(--cf-fg)] p-1 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Anthropic Claude */}
          <div className="space-y-1.5">
            <label htmlFor="anthropic-key-input" className="text-xs font-semibold text-[var(--cf-fg)] block">
              Anthropic Claude API Key
            </label>
            <div className="relative">
              <input
                id="anthropic-key-input"
                data-testid="anthropic-key-input"
                type={showAnthropicKey ? 'text' : 'password'}
                value={formData.keys?.anthropic || formData.apiKeys?.anthropic || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    keys: { ...formData.keys, anthropic: e.target.value },
                    apiKeys: { ...formData.apiKeys, anthropic: e.target.value },
                  })
                }
                placeholder="sk-ant-api..."
                className="w-full ps-3 pe-10 py-2 text-xs font-mono rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition-all min-h-[44px]"
              />
              <button
                type="button"
                data-testid="toggle-anthropic-key"
                aria-label={showAnthropicKey ? 'Hide Anthropic API key' : 'Show Anthropic API key'}
                onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--cf-fg-subtle)] hover:text-[var(--cf-fg)] p-1 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* OpenAI */}
          <div className="space-y-1.5">
            <label htmlFor="openai-key-input" className="text-xs font-semibold text-[var(--cf-fg)] block">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                id="openai-key-input"
                data-testid="openai-key-input"
                type={showOpenAIKey ? 'text' : 'password'}
                value={formData.keys?.openai || formData.apiKeys?.openai || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    keys: { ...formData.keys, openai: e.target.value },
                    apiKeys: { ...formData.apiKeys, openai: e.target.value },
                  })
                }
                placeholder="sk-proj-..."
                className="w-full ps-3 pe-10 py-2 text-xs font-mono rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition-all min-h-[44px]"
              />
              <button
                type="button"
                data-testid="toggle-openai-key"
                aria-label={showOpenAIKey ? 'Hide OpenAI API key' : 'Show OpenAI API key'}
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--cf-fg-subtle)] hover:text-[var(--cf-fg)] p-1 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Custom Endpoint */}
        <div className="space-y-4 pb-6 border-b border-[var(--cf-border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--cf-fg)]">
              Custom OpenAI-Compatible Endpoint
            </h3>
            <p className="text-xs text-[var(--cf-fg-muted)] mt-1">
              Supports LM Studio, vLLM, LocalAI, and private inference servers.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="custom-url-input" className="text-xs font-semibold text-[var(--cf-fg)] block">
              Base URL
            </label>
            <input
              id="custom-url-input"
              data-testid="custom-url-input"
              type="text"
              value={formData.endpoints?.customUrl || formData.customEndpoint || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customEndpoint: e.target.value,
                  endpoints: { ...formData.endpoints, customUrl: e.target.value },
                })
              }
              placeholder="http://localhost:1234/v1"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition-all min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="custom-key-input" className="text-xs font-semibold text-[var(--cf-fg)] block">
              Custom API Key (Optional)
            </label>
            <div className="relative">
              <input
                id="custom-key-input"
                data-testid="custom-key-input"
                type={showCustomKey ? 'text' : 'password'}
                value={formData.keys?.custom || formData.apiKeys?.custom || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    keys: { ...formData.keys, custom: e.target.value },
                    apiKeys: { ...formData.apiKeys, custom: e.target.value },
                  })
                }
                placeholder="Optional (defaults to 'custom')"
                className="w-full ps-3 pe-10 py-2 text-xs font-mono rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition-all min-h-[44px]"
              />
              <button
                type="button"
                data-testid="toggle-custom-key"
                aria-label={showCustomKey ? 'Hide Custom API key' : 'Show Custom API key'}
                onClick={() => setShowCustomKey(!showCustomKey)}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--cf-fg-subtle)] hover:text-[var(--cf-fg)] p-1 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                {showCustomKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Personal Default Model */}
        <div className="space-y-2 pb-6 border-b border-[var(--cf-border)]">
          <label
            htmlFor="personal-default-model-select"
            className="text-sm font-semibold text-[var(--cf-fg)] block"
          >
            Personal Default Model
          </label>
          <select
            id="personal-default-model-select"
            data-testid="personal-default-model-select"
            value={formData.model || 'llama3.2'}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border-strong)] bg-[var(--cf-surface)] text-[var(--cf-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--cf-focus)] transition-all min-h-[44px]"
          >
            <option value="llama3.2">Ollama · llama3.2 (Recommended local)</option>
            <option value="llama3.1">Ollama · llama3.1 (8B)</option>
            <option value="gemini-2.0-flash">Google · gemini-2.0-flash (Cloud)</option>
            <option value="claude-3-5-sonnet-latest">Anthropic · claude-3-5-sonnet (Cloud)</option>
            <option value="gpt-4o">OpenAI · gpt-4o (Cloud)</option>
            {ollamaModels
              .filter((m) => !['llama3.2', 'llama3.1'].includes(m))
              .map((m) => (
                <option key={m} value={m}>
                  Ollama · {m} (Installed)
                </option>
              ))}
          </select>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Changes saved successfully
            </span>
          )}
          <button
            type="submit"
            data-testid="save-settings-btn"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--cf-primary)] text-[var(--cf-fg-on-primary)] hover:bg-[var(--cf-primary-hover)] transition-all min-h-[44px] shadow-sm cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
