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

import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileCode, Printer } from 'lucide-react';
import { exportDossier } from '@/lib/dossierExport';
import type { ChatMessage } from '@/lib/types';
import type { AgentSummary } from '@/types/api';

export interface DossierExportMenuProps {
  messages: ChatMessage[];
  agent?: AgentSummary | null;
  agentId?: string;
  threadId?: string;
  isStreaming?: boolean;
}

export function DossierExportMenu({
  messages,
  agent,
  agentId,
  threadId,
  isStreaming = false,
}: DossierExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isDisabled = messages.length === 0 || Boolean(isStreaming);

  const getTooltip = (): string => {
    if (isStreaming) {
      return 'Cannot export while response is generating';
    }
    if (messages.length === 0) {
      return 'No messages to export';
    }
    return 'Export consultation dossier';
  };

  useEffect(() => {
    if (isDisabled && isOpen) {
      setIsOpen(false);
    }
  }, [isDisabled, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleExport = (format: 'md' | 'json') => {
    exportDossier(format, {
      agent,
      agentId,
      messages,
      threadId,
    });
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const toggleMenu = () => {
    if (!isDisabled) {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="export-dossier-menu-wrapper"
      className="relative inline-block text-start"
    >
      <button
        ref={triggerRef}
        type="button"
        data-testid="export-dossier-menu-btn"
        onClick={toggleMenu}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Export consultation dossier"
        title={getTooltip()}
        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
          isDisabled
            ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
            : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Export</span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-400 dark:text-zinc-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !isDisabled && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-label="Export dossier options"
          className="absolute end-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-900/10 dark:shadow-black/40 py-1.5 z-50 focus:outline-none"
        >
          <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 mb-1">
            Export Consultation
          </div>

          <button
            type="button"
            data-testid="export-markdown-option"
            role="menuitem"
            onClick={() => handleExport('md')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-start hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <div className="text-start">
              <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Markdown (.md)
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Clinical prep & visit notes
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="export-json-option"
            role="menuitem"
            onClick={() => handleExport('json')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-start hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <div className="text-start">
              <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                JSON (.json)
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Structured session transcript
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="export-print-option"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              triggerRef.current?.focus();
              if (typeof window !== 'undefined' && typeof window.print === 'function') {
                window.print();
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-start hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <div className="text-start">
              <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Print Consultation
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Print or export to PDF
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
