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

import React, { useState } from 'react';

interface AssistantSpec {
  id: string;
  name: string;
  pack: string;
  role: string;
  samplePrompts: string[];
  guardrailNote: string;
}

interface ChatTurn {
  id: string;
  sender: 'user' | 'assistant';
  assistantName?: string;
  text: string;
  timestamp: string;
}

const availableAssistants: AssistantSpec[] = [
  {
    id: 'household-steward',
    name: 'Household Steward',
    pack: 'household',
    role: 'Family schedules, meals, chores & home coordination',
    samplePrompts: [
      'Check our family calendar for schedule conflicts this week',
      'Draft a weekly meal plan honoring nut-free allergy constraints',
    ],
    guardrailNote: 'Informational household coordination only. External messages require T2 guardian approval.',
  },
  {
    id: 'finance-organizer',
    name: 'Finance Organizer',
    pack: 'finance',
    role: 'Bills, budgeting, medical-cost bridge & statement filing',
    samplePrompts: [
      'Summarize upcoming utility and insurance bill due dates',
      'Reconcile our recent clinic EOB against the HSA receipt',
    ],
    guardrailNote: 'Administrative organization only. Never initiates payments, transfers, or financial/tax/investment advice.',
  },
  {
    id: 'education-navigator',
    name: 'Education Navigator',
    pack: 'education',
    role: 'School forms, assignments & academic calendar',
    samplePrompts: [
      'List upcoming permission slips and science fair deadlines',
      'Prepare an agenda for next week’s parent-teacher conference',
    ],
    guardrailNote: 'Educational coordination only. Never ranks learners or diagnoses learning disabilities.',
  },
  {
    id: 'study-companion',
    name: 'Study Companion',
    pack: 'education',
    role: 'Concept review, flashcards & practice quizzes',
    samplePrompts: [
      'Quiz me on cellular respiration with 3 practice questions',
      'Explain how fractions and decimals relate using step-by-step hints',
    ],
    guardrailNote: 'Socratic study helper. Guides understanding without completing graded homework or essays.',
  },
  {
    id: 'visit-steward',
    name: 'Visit Steward',
    pack: 'health',
    role: 'Clinical visit preparation, questions & health record organization',
    samplePrompts: [
      'Prepare a question checklist for my annual physical',
      'Organize my recent lab results and medication list for my doctor',
    ],
    guardrailNote: 'Non-clinical navigation only. Never provides medical diagnoses, dosage changes, or emergency triage.',
  },
];

function buildSpecialistReply(assistant: AssistantSpec, query: string): string {
  const lower = query.toLowerCase();
  if (
    lower.includes('transfer money') ||
    lower.includes('pay my bill') ||
    lower.includes('which stock') ||
    lower.includes('write my essay')
  ) {
    return `[Safety Guardrail — ${assistant.name}] I cannot execute financial transactions, provide investment/tax advice, or complete graded academic work. Instead, I can prepare an organized checklist, due-date summary, or study outline for you to review.`;
  }

  switch (assistant.id) {
    case 'finance-organizer':
      return `Here is your organized finance summary for "${query}":\n• Upcoming bills: Electric Utility (due Oct 24, $142.10 — scheduled reminder) and Home Insurance renewal review.\n• Medical-Cost Bridge: 1 pediatric visit EOB matched to HSA receipt ($45.00 copay verified).\n• Note: ${assistant.guardrailNote}`;
    case 'education-navigator':
      return `Here is the education coordination checklist for "${query}":\n• Academic deadlines: Biology Science Fair outline due Friday; History reading log on track (5-day streak).\n• Forms status: Autumn Museum Field Trip permission slip prefilled for guardian signature.\n• Note: ${assistant.guardrailNote}`;
    case 'study-companion':
      return `Let's work through "${query}" step by step!\n1. Core concept: Break the problem into its key inputs and relationships.\n2. Quick check question: What happens in the first stage of this process, and why is it important?\nReply with your thought and we'll check it together!`;
    case 'visit-steward':
      return `Here is your visit preparation checklist for "${query}":\n• Questions to ask your clinician: Clarify target ranges, follow-up timeline, and preventive screening schedule.\n• Records to bring: Current medication list, recent vitals summary, and insurance card.\n• Note: ${assistant.guardrailNote}`;
    default:
      return `Here is your household coordination plan for "${query}":\n• Schedule check: No overlapping travel-time conflicts found between school pickup (15:30) and soccer practice (17:00).\n• Chores & Meals: Kitchen reset assigned; weeknight dinner prep aligned with household dietary notes.\n• Note: ${assistant.guardrailNote}`;
  }
}

export default function ChatPage() {
  const [selectedId, setSelectedId] = useState<string>(availableAssistants[0].id);
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      assistantName: availableAssistants[0].name,
      text: `Hello! I'm the ${availableAssistants[0].name}. How can I help organize your household schedules, finance admin, learning tasks, or visit prep today?`,
      timestamp: 'Just now',
    },
  ]);

  const activeAssistant =
    availableAssistants.find((a) => a.id === selectedId) ?? availableAssistants[0];

  const handleSelectAssistant = (assistant: AssistantSpec) => {
    setSelectedId(assistant.id);
    setMessages((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        sender: 'assistant',
        assistantName: assistant.name,
        text: `Switched to ${assistant.name} (${assistant.role}). ${assistant.guardrailNote}`,
        timestamp: 'Just now',
      },
    ]);
  };

  const handleSend = (textToSend?: string) => {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed) return;

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: 'Just now',
    };

    const replyTurn: ChatTurn = {
      id: `assistant-${Date.now() + 1}`,
      sender: 'assistant',
      assistantName: activeAssistant.name,
      text: buildSpecialistReply(activeAssistant, trimmed),
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userTurn, replyTurn]);
    if (textToSend === undefined) {
      setInput('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          AI Family Assistants
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Chat privately with local-first domain specialists. All responses follow non-advisory and non-clinical guardrails.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableAssistants.map((assistant) => {
          const isSelected = assistant.id === activeAssistant.id;
          return (
            <button
              key={assistant.id}
              type="button"
              onClick={() => handleSelectAssistant(assistant)}
              data-testid={`assistant-card-${assistant.id}`}
              className={`text-left p-4 rounded-xl border transition shadow-sm ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 dark:border-emerald-500 ring-1 ring-emerald-600'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-600 dark:hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {assistant.name}
                </h3>
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {assistant.pack}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{assistant.role}</p>
            </button>
          );
        })}
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {activeAssistant.samplePrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            className="text-xs px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm min-h-[360px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1" data-testid="chat-message-list">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                }`}
              >
                {m.assistantName && m.sender === 'assistant' && (
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    {m.assistantName}
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${activeAssistant.name} about bills, schedules, learning, or visit prep...`}
            data-testid="chat-composer-input"
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            data-testid="chat-composer-send"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
