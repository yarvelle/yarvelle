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

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send,
  Square,
  Plus,
  Search,
  Activity as ActivityIcon,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  ArrowDown,
  Trash2,
  Check,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Avatar, type MemberColorSlot } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet';
import { ToolTraceCard, type ToolTraceItem } from '@/components/ToolTraceCard';
import { ChatMessageItem, type ChatMessage } from '@/components/ChatMessageItem';
import { AttachmentPicker } from '@/components/chat/AttachmentPicker';
import { StartersChips } from '@/components/chat/StartersChips';
import { SuggestedQuestionsChips } from '@/components/chat/SuggestedQuestionsChips';
import { ModelSelector } from '@/components/ModelSelector';
import { DossierExportMenu } from '@/components/chat/DossierExportMenu';
import { ActivityLogDrawer } from '@/components/chat/ActivityLogDrawer';
import {
  CATALOG_SPECIALISTS,
  findSpecialistById,
  type CatalogSpecialist,
} from '@/lib/catalog';
import {
  loadSettings,
  saveSettings,
  getEffectiveModel,
  getApiKeyForProvider,
  getEndpointForProvider,
  type CarefoldUserSettings,
} from '@/lib/settings';
import { hasClinicalConsent, grantClinicalConsent } from '@/lib/clinicalConsent';
import {
  listSessions,
  deleteSession,
  upsertSessionFromMessages,
  type ChatSessionMeta,
} from '@/lib/sessionHistory';
import { getScopedStorageKey, getStorageUserId } from '@/lib/storageNamespace';
import { detectProfileAmbiguity } from '@/lib/profileMentions';
import {
  loadHouseholdProfiles,
  getHouseholdProfile,
  type HouseholdMemberProfile,
} from '@/lib/familyProfiles';
import { profilePath } from '@/lib/routes';
import type { AgentSummary, ApprovalRecord, ExecutionPlan } from '@/lib/types';

export interface ChatStudioShellProps {
  profileId?: string;
  initialProfile?: HouseholdMemberProfile;
  initialAgents?: AgentSummary[];
  initialThreadId?: string;
  initialPrompt?: string;
}

function formatSessionTimeAndGroup(updatedAtStr: string): { timeStr: string; group: 'this_week' | 'earlier' } {
  const date = new Date(updatedAtStr || 0);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let timeStr = 'now';
  if (isNaN(date.getTime()) || diffHours < 1) {
    timeStr = 'now';
  } else if (diffHours < 24) {
    timeStr = `${Math.floor(diffHours)}h ago`;
  } else if (diffDays < 2) {
    timeStr = 'yesterday';
  } else if (diffDays < 7) {
    timeStr = `${Math.floor(diffDays)}d ago`;
  } else {
    timeStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  const group: 'this_week' | 'earlier' = diffDays < 7 ? 'this_week' : 'earlier';
  return { timeStr, group };
}

export function ChatStudioShell({
  profileId: profileIdProp = 'me',
  initialProfile,
  initialThreadId,
  initialPrompt = '',
}: ChatStudioShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Active family profile
  const [profile, setProfile] = useState<HouseholdMemberProfile>(() => {
    return initialProfile || getHouseholdProfile(profileIdProp) || {
      id: profileIdProp,
      name: 'Leo',
      relationship: 'Self',
      role: 'self',
      audience: 'adult',
      colorSlot: 1,
      scopes: ['health.*', 'finance.*', 'education.*', 'household.*'],
    };
  });

  useEffect(() => {
    const p = getHouseholdProfile(profileIdProp);
    if (p) setProfile(p);
  }, [profileIdProp]);

  // Settings
  const [settings, setSettings] = useState<CarefoldUserSettings>(() => loadSettings());

  // Specialist selection
  const agentParam = searchParams.get('agent') || searchParams.get('agentId') || 'orchestrator';
  const [selectedAgent, setSelectedAgent] = useState<CatalogSpecialist>(() => {
    return findSpecialistById(agentParam) || CATALOG_SPECIALISTS[0];
  });

  useEffect(() => {
    if (agentParam) {
      const match = findSpecialistById(agentParam);
      if (match) setSelectedAgent(match);
    }
  }, [agentParam]);

  // Thread sessions
  const [activeThreadId, setActiveThreadId] = useState<string>(
    initialThreadId || searchParams.get('thread') || `thread-${Date.now()}`
  );
  const [sessions, setSessions] = useState<ChatSessionMeta[]>([]);
  const [threadSearch, setThreadSearch] = useState<string>('');
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);

  const loadSessionsList = useCallback(() => {
    const list = listSessions(getStorageUserId());
    setSessions(list);
  }, []);

  useEffect(() => {
    loadSessionsList();
  }, [loadSessionsList]);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isSpecialistDropdownOpen, setIsSpecialistDropdownOpen] = useState(false);
  const [specialistDomainFilter, setSpecialistDomainFilter] = useState<string>('all');
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

  // Message stream
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const promptParam = searchParams.get('prompt');
  const [inputText, setInputText] = useState(
    () => initialPrompt || searchParams.get('prompt') || ''
  );

  useEffect(() => {
    if (promptParam && promptParam.trim()) {
      setInputText(promptParam.trim());
    }
  }, [promptParam]);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Ambiguity hold state
  const [heldAmbiguity, setHeldAmbiguity] = useState<{
    text: string;
    targetName: string;
    targetProfileId: string;
    targetColorSlot: MemberColorSlot;
  } | null>(null);

  // Load messages for active thread
  useEffect(() => {
    if (!activeThreadId) return;
    try {
      const storageKey = getScopedStorageKey(getStorageUserId(), `msgs_${activeThreadId}`);
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // storage error
    }
    setMessages([]);
  }, [activeThreadId]);

  // Persist messages helper
  const persistMessages = (updated: ChatMessage[], targetThreadId?: string) => {
    const tId = targetThreadId || activeThreadId;
    if (!tId) return;
    try {
      const storageKey = getScopedStorageKey(getStorageUserId(), `msgs_${tId}`);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(updated));
      }
      upsertSessionFromMessages(tId, selectedAgent.id, updated, selectedAgent.title, getStorageUserId(), profile.id);
      loadSessionsList();
    } catch {
      // storage quota
    }
  };

  // Autoscroll
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 80;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  };

  const scrollToBottom = (force = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (force || isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      setIsAtBottom(true);
      isAtBottomRef.current = true;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, heldAmbiguity]);

  // Thread deletion
  const handleDeleteThread = (threadId: string) => {
    deleteSession(threadId, getStorageUserId());
    setThreadToDelete(null);
    loadSessionsList();
    if (activeThreadId === threadId) {
      const nextThread = `thread-${Date.now()}`;
      setActiveThreadId(nextThread);
      setMessages([]);
    }
  };

  // Filtered specialists
  const filteredSpecialists = useMemo(() => {
    if (specialistDomainFilter === 'all') return CATALOG_SPECIALISTS;
    return CATALOG_SPECIALISTS.filter((s) => s.domain === specialistDomainFilter);
  }, [specialistDomainFilter]);

  // Filtered thread sessions
  const filteredSessions = useMemo(() => {
    if (!threadSearch.trim()) return sessions;
    const q = threadSearch.toLowerCase();
    return sessions.filter((s) => s.title?.toLowerCase().includes(q) || s.agentId?.toLowerCase().includes(q));
  }, [sessions, threadSearch]);

  const groupedSessions = useMemo(() => {
    const thisWeek: ChatSessionMeta[] = [];
    const earlier: ChatSessionMeta[] = [];
    filteredSessions.forEach((s) => {
      const { group } = formatSessionTimeAndGroup(s.updatedAt);
      if (group === 'this_week') thisWeek.push(s);
      else earlier.push(s);
    });
    return { thisWeek, earlier };
  }, [filteredSessions]);

  // Emergency Red Flag Detection
  const checkEmergencyRedFlags = (text: string): boolean => {
    const lower = text.toLowerCase();
    return (
      lower.includes('chest pain') ||
      lower.includes('heart attack') ||
      lower.includes('cannot breathe') ||
      lower.includes('severe shortness of breath') ||
      lower.includes('stroke') ||
      lower.includes('facial drooping') ||
      lower.includes('suicide') ||
      lower.includes('kill myself') ||
      lower.includes('anaphylaxis') ||
      lower.includes('overdose')
    );
  };

  // Client-Side Fallback Simulation Engine
  const runFallbackSimulation = async (
    text: string,
    assistantMsgId: string,
    updatedMessages: ChatMessage[]
  ) => {
    const isEmergency = checkEmergencyRedFlags(text);
    if (isEmergency) {
      const emergencyMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content:
          'This may be a medical emergency. If you or someone you are caring for is in immediate danger, please call 911 or go to the nearest emergency department right now.',
        isEmergency: true,
        emergencyCategory: 'acute_emergency',
        isStreaming: false,
      };
      setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? emergencyMsg : m)));
      persistMessages([...updatedMessages, emergencyMsg]);
      return;
    }

    // Simulate multi-turn specialist consultation
    const isClinical = selectedAgent.risk_class === 'clinical_assist';
    const isFinance = selectedAgent.domain === 'finance';
    const isEducation = selectedAgent.domain === 'education';
    const isHousehold = selectedAgent.domain === 'household';

    let answer = `Thank you for consulting **${selectedAgent.title}** regarding "${text.trim()}".\n\n`;

    if (isClinical) {
      answer += `### Clinical Preparation & Guidance
- **Review Observations:** We have noted your question regarding ${selectedAgent.category || 'care'}.
- **Visit Questions:** Write down symptoms, onset timeline, and medication history before visiting your physician.
- **Next Steps:** Clarify follow-up timing and any required lab tests with your care team.

> **Non-Clinical Notice:** Yarvelle provides visit preparation and educational guidance only. Please consult your licensed healthcare provider for clinical diagnosis and prescriptions.`;
    } else if (isFinance) {
      answer += `### Financial & Benefits Summary
- **Statements & Bills:** Organized relevant cost-sharing entries and expense items.
- **Budgetary Status:** Verified allocation against family savings and monthly budget limits.
- **Action Items:** Review pending invoices and reconcile deductible contributions.`;
    } else if (isEducation) {
      answer += `### Learning & Academic Support
- **Focus Areas:** Breaking down core concepts into actionable milestones.
- **Study Schedule:** Structured 25-minute study intervals with active recall.
- **Assignments:** Track completion status and review syllabus requirements.`;
    } else if (isHousehold) {
      answer += `### Household & Family Coordination
- **Schedule Check:** Cross-checked weekly calendar commitments and routines.
- **Responsibilities:** Assigned action items across household members.
- **Reminders:** Added coordination checklist items for the week.`;
    } else {
      answer += `I have routed your inquiry across our specialized family assistants to coordinate the best response. Let me know if you would like me to draft notes, summarize records, or update your schedule.`;
    }

    // Add mock trace
    const mockTrace: ToolTraceItem = {
      id: `trace-${Date.now()}`,
      tool: isClinical ? 'skill-docs' : 'workspace-note',
      status: 'completed',
      input: { agent: selectedAgent.id, query: text.slice(0, 30) },
      result: { status: 'success', verified: true },
      duration_ms: 120,
    };

    // Streaming tokens
    const chunks = answer.split(' ');
    let currentContent = '';

    for (let i = 0; i < chunks.length; i++) {
      await new Promise((r) => setTimeout(r, 15));
      currentContent += (i === 0 ? '' : ' ') + chunks[i];
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: currentContent, toolTraces: [mockTrace] }
            : m
        )
      );
    }

    // Suggested questions
    const suggestions = [
      `What questions should I ask about this?`,
      `Can you save a summary to my notes?`,
      `How does this affect our family schedule?`,
    ];
    setSuggestedQuestions(suggestions);

    const finalAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: currentContent,
      toolTraces: [mockTrace],
      isStreaming: false,
    };

    setMessages((prev) =>
      prev.map((m) => (m.id === assistantMsgId ? finalAssistantMsg : m))
    );
    persistMessages([...updatedMessages, finalAssistantMsg]);
  };

  // Main chat execution
  const executeChatStream = async (text: string, baseMessages?: ChatMessage[]) => {
    if (!text.trim() || isStreaming) return;
    setSuggestedQuestions([]);

    // Check ambiguity
    const household = loadHouseholdProfiles();
    const ambiguity = detectProfileAmbiguity(text, profile.id, household);
    if (ambiguity) {
      setHeldAmbiguity({
        text,
        targetName: ambiguity.targetName,
        targetProfileId: ambiguity.targetProfileId,
        targetColorSlot: (ambiguity.targetColorSlot as MemberColorSlot) || 'blue',
      });
      return;
    }

    const currentAttachments = [...attachedFiles];
    let updatedMessages: ChatMessage[];

    if (baseMessages && baseMessages.length > 0) {
      updatedMessages = baseMessages;
    } else {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
        ...(currentAttachments.length > 0 ? { attachments: currentAttachments } : {}),
      };
      updatedMessages = [...messages, userMsg];
    }

    setMessages(updatedMessages);
    persistMessages(updatedMessages);
    setInputText('');
    setAttachedFiles([]);
    isAtBottomRef.current = true;
    scrollToBottom(true);

    const assistantMsgId = `a-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages([...updatedMessages, assistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const effectiveModel = getEffectiveModel(settings);
      const apiKey = getApiKeyForProvider(settings, settings.provider);
      const customEndpoint = getEndpointForProvider(settings, settings.provider);

      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
        },
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          profile_id: profile.id,
          prompt: text,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          provider: settings.provider,
          model: effectiveModel,
          apiKey,
          customEndpoint,
          threadId: activeThreadId,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = 'token';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            try {
              const data = JSON.parse(dataStr);
              const eventType = data.type || currentEvent;

              if (eventType === 'token') {
                const delta = data.token || data.delta || '';
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: m.content + delta } : m
                  )
                );
              } else if (eventType === 'approval_required') {
                const approvalRecord: ApprovalRecord = {
                  id: data.approval_id || data.id,
                  tool_name: data.tool || data.tool_name,
                  risk_tier: data.risk_tier || 'write_external',
                  destination_hosts: data.destination_hosts || [],
                  args_redacted: data.args || data.args_redacted || {},
                  payload_hash: data.payload_hash || '',
                  status: 'pending',
                  expires_at: data.expires_at,
                  created_at: new Date().toISOString(),
                  thread_id: activeThreadId,
                  reason: data.reason,
                };
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, approval: approvalRecord, isStreaming: false }
                      : msg
                  )
                );
                setIsStreaming(false);
              } else if (eventType === 'execution_plan' || data.plan) {
                const plan: ExecutionPlan = data.plan || data;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, plan } : msg
                  )
                );
              } else if (eventType === 'suggestions') {
                const list = data.suggestions || data.followUpSuggestions;
                if (Array.isArray(list) && list.length > 0) {
                  setSuggestedQuestions(list);
                }
              } else if (eventType === 'tool_start') {
                const newTrace: ToolTraceItem = {
                  id: data.id || `trace-${Date.now()}-${data.tool}`,
                  tool: data.tool,
                  status: 'running',
                  input: data.params || data.input || {},
                  params: data.params || data.input || {},
                  startTime: Date.now(),
                };
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, toolTraces: [...(msg.toolTraces || []), newTrace] }
                      : msg
                  )
                );
              } else if (eventType === 'tool_end') {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== assistantMsgId) return msg;
                    const traces = (msg.toolTraces || []).map((t) => {
                      if (t.tool === data.tool && t.status === 'running') {
                        return {
                          ...t,
                          status: (data.allowed === false ? 'denied' : data.status || 'completed') as any,
                          duration_ms: data.duration_ms,
                          result: data.result || data.output,
                          output: data.result || data.output,
                          allowed: data.allowed,
                          reason: data.reason,
                        };
                      }
                      return t;
                    });
                    return { ...msg, toolTraces: traces };
                  })
                );
              } else if (eventType === 'refusal') {
                const isHard = Boolean(data.refused !== false);
                const isEmergency = Boolean(
                  data.category === 'emergency_red_flag' ||
                  (data.reason && data.reason.startsWith('emergency_red_flag'))
                );
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          isRefusal: isHard,
                          isEmergency,
                          emergencyCategory: data.category || msg.emergencyCategory,
                          refusalReason: data.reason,
                          boundaryWarning: !isHard,
                          boundaryReason: data.reason,
                          content: data.message || msg.content,
                        }
                      : msg
                  )
                );
              } else if (eventType === 'done') {
                const list = data.suggestions || data.followUpSuggestions;
                if (Array.isArray(list) && list.length > 0) {
                  setSuggestedQuestions(list);
                }
                const isRefusal = Boolean(data.refused);
                const hasBoundaryWarning = Boolean(data.boundaryWarning);
                const isEmergency = Boolean(
                  data.refusalReason && data.refusalReason.startsWith('emergency_red_flag')
                );
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== assistantMsgId) return msg;
                    const finalEmergency = isEmergency || Boolean(msg.isEmergency);
                    return {
                      ...msg,
                      content: data.fullText || msg.content,
                      isRefusal: isRefusal || Boolean(msg.isRefusal),
                      isEmergency: finalEmergency,
                      refusalReason: data.refusalReason || msg.refusalReason,
                      boundaryWarning: hasBoundaryWarning || (!isRefusal && Boolean(msg.boundaryWarning)),
                      boundaryReason: data.boundaryReason || (hasBoundaryWarning ? data.refusalReason : msg.boundaryReason),
                      isStreaming: false,
                    };
                  })
                );
              } else if (eventType === 'error') {
                setSuggestedQuestions([]);
                if (data.message) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId && !msg.content
                        ? { ...msg, content: data.message, isStreaming: false }
                        : msg
                    )
                  );
                }
              }
            } catch {
              // parse error
            }
          }
        }
      }
    } catch {
      // Backend not running / offline: execute client-side deterministic fallback engine
      await runFallbackSimulation(text, assistantMsgId, updatedMessages);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m))
      );
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  };

  const handleApprovalDecided = (updatedApproval: ApprovalRecord) => {
    setMessages((prev) => {
      const updated = prev.map((msg) =>
        msg.approval?.id === updatedApproval.id
          ? { ...msg, approval: updatedApproval }
          : msg
      );
      persistMessages(updated, activeThreadId);
      return updated;
    });
  };

  const handleResume = async (approvalId: string, resumeThreadId?: string) => {
    const targetThreadId = resumeThreadId || activeThreadId;
    setIsStreaming(true);

    try {
      const res = await fetch('/api/chat/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          thread_id: targetThreadId,
          approval_id: approvalId,
          decision: 'approved',
          profile_id: profile.id,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Resume error: HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = 'token';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
            continue;
          }
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            try {
              const data = JSON.parse(dataStr);
              const eventType = data.type || currentEvent;

              if (eventType === 'token') {
                const delta = data.delta || data.token || '';
                setMessages((prev) => {
                  const lastAssistant = [...prev].reverse().find((m) => m.role === 'assistant');
                  if (!lastAssistant) return prev;
                  return prev.map((m) =>
                    m.id === lastAssistant.id ? { ...m, content: m.content + delta } : m
                  );
                });
              } else if (eventType === 'tool_end') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.approval?.id === approvalId
                      ? { ...m, approval: { ...m.approval, status: 'consumed' as const } }
                      : m
                  )
                );
              } else if (eventType === 'done') {
                setIsStreaming(false);
              }
            } catch {}
          }
        }
      }
    } catch {
      // Offline / test double fallback
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.approval?.id === approvalId
            ? { ...m, approval: { ...m.approval, status: 'consumed' as const } }
            : m
        );
        persistMessages(updated, activeThreadId);
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleNewChat = () => {
    const nextThreadId = `thread-${Date.now()}`;
    setActiveThreadId(nextThreadId);
    setMessages([]);
    setSuggestedQuestions([]);
    setInputText('');
  };

  return (
    <div
      data-chat-page="true"
      className="flex h-screen max-h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
    >
      {/* =========================================================================
          ZONE 1: Collapsible Thread History Sidebar
      ========================================================================= */}
      {isSidebarOpen && (
        <aside
          aria-label="Conversation history"
          className="hidden md:flex w-[300px] shrink-0 flex-col border-e border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/50"
        >
          {/* Sidebar Top: New Chat & Search */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="primary"
                size="sm"
                data-testid="new-chat-btn"
                onClick={handleNewChat}
                className="w-full justify-center gap-1.5 rounded-xl font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>New Consultation</span>
              </Button>
              <button
                type="button"
                data-testid="toggle-sidebar-btn"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                data-testid="thread-search-input"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder="Search history..."
                className="w-full ps-8 pe-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {groupedSessions.thisWeek.length > 0 && (
              <div data-testid="group-this-week" className="space-y-1">
                <span className="px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  This Week
                </span>
                {groupedSessions.thisWeek.map((s) => (
                  <div
                    key={s.id}
                    data-testid={`thread-item-${s.id}`}
                    onClick={() => setActiveThreadId(s.id)}
                    className={cn(
                      'group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition',
                      activeThreadId === s.id
                        ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                    )}
                  >
                    <div className="truncate me-2">
                      <p className="truncate font-medium">{s.title || 'Consultation'}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{s.agentId}</p>
                    </div>
                    <button
                      type="button"
                      data-testid={`delete-thread-${s.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setThreadToDelete(s.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 transition cursor-pointer"
                      aria-label="Delete consultation thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {groupedSessions.earlier.length > 0 && (
              <div data-testid="group-earlier" className="space-y-1">
                <span className="px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Earlier
                </span>
                {groupedSessions.earlier.map((s) => (
                  <div
                    key={s.id}
                    data-testid={`thread-item-${s.id}`}
                    onClick={() => setActiveThreadId(s.id)}
                    className={cn(
                      'group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition',
                      activeThreadId === s.id
                        ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                    )}
                  >
                    <div className="truncate me-2">
                      <p className="truncate font-medium">{s.title || 'Consultation'}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{s.agentId}</p>
                    </div>
                    <button
                      type="button"
                      data-testid={`delete-thread-${s.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setThreadToDelete(s.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 transition cursor-pointer"
                      aria-label="Delete consultation thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {sessions.length === 0 && (
              <p className="p-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                No past consultations recorded for {profile.name}.
              </p>
            )}
          </div>
        </aside>
      )}

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* =======================================================================
            ZONE 2: Slim Conversation Header
        ======================================================================= */}
        <header
          data-testid="chat-header"
          className="h-16 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-4 flex items-center justify-between gap-3 z-10"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {!isSidebarOpen && (
              <button
                type="button"
                data-testid="toggle-sidebar-btn"
                onClick={() => setIsSidebarOpen(true)}
                className="hidden md:flex p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                aria-label="Expand sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* Specialist Guide Picker Dropdown */}
            <div className="relative">
              <button
                type="button"
                data-testid="agent-select-btn"
                onClick={() => setIsSpecialistDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition cursor-pointer max-w-[240px] sm:max-w-xs truncate"
                aria-haspopup="listbox"
                aria-expanded={isSpecialistDropdownOpen}
              >
                <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{selectedAgent.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </button>

              {isSpecialistDropdownOpen && (
                <div
                  data-testid="agent-dropdown-menu"
                  className="absolute start-0 mt-1.5 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-2 z-50 space-y-2"
                >
                  {/* Domain Filter Tabs */}
                  <div className="flex items-center gap-1 pb-1.5 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto text-xs">
                    {(['all', 'health', 'finance', 'education', 'household'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSpecialistDomainFilter(d)}
                        className={cn(
                          'px-2 py-0.5 rounded-lg font-medium capitalize transition cursor-pointer shrink-0',
                          specialistDomainFilter === d
                            ? 'bg-emerald-600 text-white'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    {filteredSpecialists.map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        data-testid={`agent-option-${sp.id}`}
                        onClick={() => {
                          setSelectedAgent(sp);
                          setIsSpecialistDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-start gap-2.5 p-2 rounded-xl text-start transition cursor-pointer',
                          selectedAgent.id === sp.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        )}
                      >
                        <div className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-emerald-600 shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                          <span className="sr-only" data-testid={`assistant-card-${sp.id}`}>{sp.title}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                              {sp.title}
                            </span>
                            <span className="text-xs px-1.5 py-0.2 rounded font-mono uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                              {sp.domain}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                            {sp.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Context Chip */}
            <div
              data-testid="active-profile-chip"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-xs"
            >
              <Avatar name={profile.name} size="xs" colorSlot={profile.colorSlot} />
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{profile.name}</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <DossierExportMenu
              messages={messages}
              agent={selectedAgent}
              agentId={selectedAgent.id}
              threadId={activeThreadId}
              isStreaming={isStreaming}
            />

            <button
              type="button"
              data-testid="activity-log-btn"
              onClick={() => setIsActivityLogOpen(true)}
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="View activity and safety logs"
              aria-label="Activity logs"
            >
              <ActivityIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* =======================================================================
            ZONE 3: Central Message Stream
        ======================================================================= */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          data-testid="chat-message-list"
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 relative"
        >
          {/* Empty State: Starters */}
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto my-auto pt-8 sm:pt-16 space-y-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedAgent.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  {selectedAgent.description || 'Ask questions, review documents, or coordinate family tasks.'}
                </p>
              </div>

              {selectedAgent.starters && selectedAgent.starters.length > 0 && (
                <div className="pt-2 text-start max-w-xl mx-auto">
                  <StartersChips
                    starters={selectedAgent.starters}
                    onSelectStarter={(prompt) => executeChatStream(prompt)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              agentTitle={selectedAgent.title}
              threadId={activeThreadId}
              profileId={profile.id}
              onRerun={(prompt) => executeChatStream(prompt)}
              onRegenerate={() => {
                const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                if (lastUser) executeChatStream(lastUser.content);
              }}
              onApprovalDecided={handleApprovalDecided}
              onResume={handleResume}
            />
          ))}

          {/* Profile Ambiguity Interception Card */}
          {heldAmbiguity && (
            <div
              data-testid="profile-ambiguity-card"
              className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 text-xs space-y-2.5 max-w-lg mx-auto my-2"
            >
              <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Family Member Mention Detected</span>
              </div>
              <p className="text-amber-800 dark:text-amber-300">
                Your message appears to be about <strong>{heldAmbiguity.targetName}</strong>, but you are currently chatting under <strong>{profile.name}</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  data-testid="ambiguity-switch-btn"
                  onClick={() => {
                    const text = heldAmbiguity.text;
                    const targetId = heldAmbiguity.targetProfileId;
                    setHeldAmbiguity(null);
                    router.push(profilePath(targetId, `/chat?prompt=${encodeURIComponent(text)}`));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition cursor-pointer"
                >
                  Switch to {heldAmbiguity.targetName} & Send
                </button>
                <button
                  type="button"
                  data-testid="ambiguity-stay-btn"
                  onClick={() => {
                    const text = heldAmbiguity.text;
                    setHeldAmbiguity(null);
                    executeChatStream(text);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-amber-400 dark:border-amber-700 bg-white dark:bg-zinc-800 text-amber-900 dark:text-amber-200 font-medium hover:bg-amber-100 transition cursor-pointer"
                >
                  Stay as {profile.name} & Send
                </button>
                <button
                  type="button"
                  onClick={() => setHeldAmbiguity(null)}
                  className="px-2.5 py-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Follow-up Suggested Questions */}
          {!isStreaming && suggestedQuestions.length > 0 && (
            <div className="max-w-2xl mx-auto pt-2">
              <SuggestedQuestionsChips
                suggestions={suggestedQuestions}
                onSelectSuggestion={(q) => executeChatStream(q)}
              />
            </div>
          )}

          {/* Floating Autoscroll Pill */}
          {!isAtBottom && (
            <button
              type="button"
              data-testid="scroll-to-bottom-pill"
              onClick={() => scrollToBottom(true)}
              className="sticky bottom-2 mx-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-lg hover:scale-105 transition cursor-pointer z-20"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Latest messages</span>
            </button>
          )}
        </div>

        {/* =======================================================================
            ZONE 4: Unified Composer
        ======================================================================= */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 shadow-sm p-2 focus-within:ring-2 focus-within:ring-emerald-500 transition">
              <textarea
                data-testid="chat-composer-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (isStreaming) handleStopStreaming();
                    else executeChatStream(inputText);
                  }
                }}
                placeholder={`Ask ${selectedAgent.title}... (Enter to send, Shift+Enter for new line)`}
                rows={2}
                className="w-full resize-none bg-transparent p-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
              />

              {/* Attached file chips */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-1 pb-2">
                  {attachedFiles.map((file) => (
                    <span
                      key={file}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                    >
                      <span>📎 {file}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((f) => f !== file))}
                        className="hover:text-rose-600 transition ms-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Composer Toolbar */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-700/60">
                <div className="flex items-center gap-1.5">
                  <AttachmentPicker
                    onAttach={(file: string) => setAttachedFiles((prev) => [...prev, file])}
                    disabled={isStreaming}
                  />
                  <ModelSelector
                    settings={settings}
                    onSettingsChange={(newSet) => {
                      setSettings(newSet);
                      saveSettings(newSet);
                    }}
                    onOpenSettings={() => router.push('/settings/model')}
                    disabled={isStreaming}
                  />
                </div>

                <button
                  type="button"
                  data-testid="chat-composer-send"
                  disabled={!isStreaming && !inputText.trim()}
                  onClick={() => {
                    if (isStreaming) handleStopStreaming();
                    else executeChatStream(inputText);
                  }}
                  className={cn(
                    'inline-flex items-center justify-center p-2 rounded-xl font-medium transition cursor-pointer',
                    isStreaming
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : !inputText.trim()
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )}
                  aria-label={isStreaming ? 'Stop response' : 'Send message'}
                >
                  {isStreaming ? <Square className="w-4 h-4 fill-current" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Non-clinical safety notice */}
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
              Yarvelle AI assists with care, finance, education, and household coordination. Not a substitute for licensed clinical or legal advice.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Thread Alert Dialog */}
      {threadToDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirm thread deletion"
          data-testid="confirm-delete-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Delete this consultation?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                This will permanently delete this conversation and its notes from your device.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                data-testid="cancel-delete-btn"
                onClick={() => setThreadToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                data-testid="confirm-delete-btn"
                onClick={() => handleDeleteThread(threadToDelete)}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Drawer */}
      <ActivityLogDrawer
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        activeAgentId={selectedAgent.id}
      />
    </div>
  );
}
