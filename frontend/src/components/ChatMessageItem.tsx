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

import React from 'react';
import { Bot, AlertCircle, RotateCcw } from 'lucide-react';
import { ToolTraceCard } from './ToolTraceCard';
import { MessageToolbar } from './chat/MessageToolbar';
import { ChatMarkdown } from './chat/ChatMarkdown';
import { ThinkingIndicator } from './chat/ThinkingIndicator';
import { EmergencyEscalationCard } from './chat/EmergencyEscalationCard';
import { DossierCard } from './chat/DossierCard';
import { ApprovalCard } from './chat/ApprovalCard';
import { ExecutionPlanCard } from './chat/ExecutionPlanCard';
import { formatFriendlyChatError } from '@/lib/chatErrors';
import type { ChatMessage, ApprovalRecord, ExecutionPlan, ToolTraceItem } from '@/lib/types';

export type { ChatMessage };

export interface ChatMessageItemProps {
  message: ChatMessage;
  onRerun?: (prompt: string) => void;
  onRegenerate?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  disabled?: boolean;
  agentTitle?: string;
  threadId?: string;
  profileId?: string;
  onApprovalDecided?: (updatedApproval: ApprovalRecord) => void;
  onResume?: (approvalId: string, threadId?: string) => void;
}

const SAFE_REFUSAL_SNIPPET = 'I am a wellness and care navigation assistant, not a licensed medical professional';

/**
 * Strips internal suggestion generator preamble or raw JSON question blocks
 * from assistant message content so they are never displayed in the chat bubble.
 */
export function stripSuggestionLeakage(text: string): string {
  if (!text) return text;
  let hasLeakage = false;
  let cleaned = text.replace(
    /(\.|\?|\!)?\s*(?:assistant\s*\n+|\n|^)Here are \d+ concise follow-up questions.*$/is,
    (_, punct) => {
      hasLeakage = true;
      return punct || '';
    }
  );
  cleaned = cleaned.replace(
    /(?:\n|^)\[\s*"[^"]+\?\s*"(?:,\s*"[^"]+\?\s*")*\s*\]\s*$/s,
    () => {
      hasLeakage = true;
      return '';
    }
  );
  return hasLeakage ? cleaned.trimEnd() : cleaned;
}

export function formatMessageTimestamp(timestamp?: string): string | null {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
}

/**
 * Strips robotic "Based on the provided reference document/guide..." opening phrases
 * from assistant messages so responses read naturally without confusing the user.
 */
export function stripReferencePreamble(text: string): string {
  if (!text) return text;
  const pattern = /^(?:(?:\*|_){0,2}(?:(?:Based on|According to|From) (?:the )?(?:provided )?reference (?:document|guide|material|checklist|information|docs?)(?: provided)?)[,:]?(?:\*|_){0,2}[,:]?\s*)/i;
  let cleaned = text.trimStart().replace(pattern, '').replace(/^[*_\s]+/, '');
  if (cleaned && cleaned !== text) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

export function ChatMessageItem({
  message,
  onRerun,
  onRegenerate,
  onRetry,
  disabled = false,
  agentTitle,
  threadId,
  profileId,
  onApprovalDecided,
  onResume,
}: ChatMessageItemProps) {
  const displayContent = message.role === 'assistant'
    ? stripReferencePreamble(stripSuggestionLeakage(message.content))
    : message.content;
  const isBoundaryNotice = Boolean(message.boundaryWarning);
  const isHardRefusal = Boolean(
    !isBoundaryNotice && (message.isRefusal || displayContent.includes(SAFE_REFUSAL_SNIPPET))
  );
  const traces = (message.toolTraces || message.traces || []) as ToolTraceItem[];
  const extractionTraces = traces.filter(
    (t) => t.tool === 'extract_document_dossier' && t.status === 'completed'
  );
  const formattedTime = formatMessageTimestamp(message.timestamp);
  const hasError = Boolean(message.error || message.isError);
  const friendlyError = hasError
    ? formatFriendlyChatError(message.error || message.content)
    : null;

  if (message.role === 'user') {
    return (
      <div data-testid="chat-message-user" className="relative group flex justify-end my-3">
        <div className="max-w-[85%] md:max-w-[75%] min-w-[200px] rounded-2xl px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1">
              {message.attachments.map((att) => (
                <span key={att} className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono">
                  📎 {att}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

          <div className="flex items-center justify-between gap-3 mt-2 pt-1.5 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400 select-none">
            <div className="flex items-center gap-1.5 opacity-90">
              <span data-testid="message-role-user" className="font-semibold text-zinc-900 dark:text-zinc-100">
                You
              </span>
              {formattedTime && (
                <>
                  <span className="opacity-60">•</span>
                  <time data-testid="message-timestamp" dateTime={message.timestamp} suppressHydrationWarning className="text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {formattedTime}
                  </time>
                </>
              )}
            </div>

            <MessageToolbar
              role="user"
              content={message.content}
              messageId={message.id}
              onRerun={onRerun}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    );
  }

  const isEmergency = Boolean(
    message.isEmergency ||
    (message.refusalReason && message.refusalReason.startsWith('emergency_red_flag'))
  );

  if (isEmergency) {
    return <EmergencyEscalationCard message={message} />;
  }

  return (
    <div
      data-testid={isHardRefusal ? 'chat-message-refusal' : 'chat-message-assistant'}
      aria-busy={message.isStreaming}
      className={`relative group flex flex-col my-3 max-w-[95%] md:max-w-[85%] min-w-[240px] rounded-2xl p-4 shadow-sm transition-colors ${
        isHardRefusal
          ? 'border-2 border-amber-500 bg-amber-50/70 dark:bg-amber-950/25 text-amber-950 dark:text-amber-100'
          : 'border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
      }`}
    >
      {/* Safe Refusal Header Badge */}
      {isHardRefusal && (
        <div data-testid="safe-refusal-badge" className="flex items-center gap-2 pb-2 mb-2 border-b border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Safety Refusal Gate: Protected Clinical Boundary</span>
        </div>
      )}

      {/* Refusal Reason Callout */}
      {isHardRefusal && message.refusalReason && (
        <div data-testid="refusal-reason-callout" className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2 italic">
          Blocked Category: {message.refusalReason}
        </div>
      )}

      {/* Human-in-the-Loop Action Approval Card */}
      {message.approval && (
        <div data-testid="embedded-approval-card" className="mb-3">
          <ApprovalCard
            approval={message.approval}
            profileId={profileId}
            onDecided={onApprovalDecided}
            onResume={onResume}
            disabled={disabled}
          />
        </div>
      )}

      {/* Embedded Execution Plan Card */}
      {message.plan && (
        <div data-testid="embedded-execution-plan-card" className="mb-3">
          <ExecutionPlanCard plan={message.plan} activeTraces={traces} />
        </div>
      )}

      {/* Embedded Tool Execution Traces */}
      {traces.length > 0 && (
        <div data-testid="embedded-tool-traces" className="mb-3 space-y-1">
          {traces.map((trace, idx) => (
            <ToolTraceCard key={trace.id || `${trace.tool}-${trace.status}-${idx}`} trace={trace} />
          ))}
        </div>
      )}

      {/* Friendly Inline Chat Error Notice */}
      {friendlyError ? (
        <div
          data-testid="chat-error-notice"
          role="alert"
          className="rounded-xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 text-amber-950 dark:text-amber-100 space-y-2.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-semibold leading-snug">{friendlyError.summary}</p>
                <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                  {friendlyError.actionHint}
                </p>
              </div>
            </div>
            {(onRetry || onRegenerate) && (
              <button
                type="button"
                data-testid="chat-error-retry"
                onClick={() => (onRetry || onRegenerate)?.(message.id)}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Try again</span>
              </button>
            )}
          </div>
          <details data-testid="chat-error-details" className="text-xs text-amber-800 dark:text-amber-300">
            <summary className="cursor-pointer font-medium hover:underline select-none">
              Technical details
            </summary>
            <pre className="mt-1.5 p-2 rounded-lg bg-amber-100/70 dark:bg-amber-950/60 font-mono text-xs whitespace-pre-wrap break-all overflow-x-auto">
              {friendlyError.technicalDetails}
            </pre>
          </details>
        </div>
      ) : (
        /* Message Content with Markdown Formatting */
        <div className="text-base sm:text-sm leading-relaxed space-y-2 markdown-body min-w-0 max-w-full overflow-hidden">
          {message.isStreaming && !displayContent.trim() ? (
            <ThinkingIndicator
              text={
                traces.some((t) => t.status === 'running')
                  ? 'Executing tools...'
                  : 'Formulating response...'
              }
            />
          ) : (
            <>
              <ChatMarkdown content={displayContent} />
              {message.isStreaming && displayContent.length > 0 && (
                <span
                  data-testid="streaming-indicator"
                  aria-hidden="true"
                  className="inline-block w-2 h-4 ms-1 bg-emerald-600 dark:bg-emerald-400 animate-pulse align-middle"
                />
              )}
            </>
          )}

          {/* Tier 2 Clinical Boundary Notice Callout */}
          {isBoundaryNotice && (
            <div
              data-testid="clinical-boundary-disclaimer"
              className="mt-3 p-3 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs shadow-sm space-y-1.5"
            >
              <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Clinical Boundary Notice</span>
                {message.boundaryReason && (
                  <span className="ms-auto text-xs font-mono px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                    {message.boundaryReason.replace('forbidden_intent:', '')}
                  </span>
                )}
              </div>
              <p className="leading-relaxed opacity-95">
                Yarvelle provides educational context and visit preparation checklists, but does not provide formal medical diagnoses, drug prescriptions, or clinical treatment decisions. Always verify symptoms and medical choices with a licensed healthcare provider.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dossier Cards Rendered from Document Extraction Results */}
      {extractionTraces.length > 0 && (
        <div data-testid="chat-message-dossiers" className="mt-3 space-y-3">
          {extractionTraces.map((trace, idx) => (
            <DossierCard
              key={trace.id || `dossier-${message.id}-${idx}`}
              trace={trace}
              threadId={threadId}
              messageId={message.id}
              agentTitle={agentTitle}
            />
          ))}
        </div>
      )}

      {/* Assistant Message Bottom Footer Row */}
      <div
        className={`mt-3 pt-2 border-t flex items-center justify-between gap-2 text-xs select-none ${
          isHardRefusal
            ? 'border-amber-200 dark:border-amber-900/60'
            : 'border-zinc-100 dark:border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 select-none">
          <Bot className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <span data-testid="message-role-assistant" className="font-semibold text-zinc-700 dark:text-zinc-300">
            {agentTitle || 'Yarvelle Assistant'}
          </span>
          {formattedTime && (
            <>
              <span className="opacity-50 text-zinc-400 dark:text-zinc-600">•</span>
              <time data-testid="message-timestamp" dateTime={message.timestamp} suppressHydrationWarning className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                {formattedTime}
              </time>
            </>
          )}
        </div>

        {!message.isStreaming && (
          <MessageToolbar
            role="assistant"
            content={displayContent}
            messageId={message.id}
            onRegenerate={onRegenerate}
            disabled={disabled}
            isStreaming={message.isStreaming}
          />
        )}
      </div>
    </div>
  );
}
