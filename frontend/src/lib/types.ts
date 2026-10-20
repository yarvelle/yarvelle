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

export * from '../types/api';

// ---------------------------------------------------------------------------
// Tool Trace Types
// ---------------------------------------------------------------------------
export type ToolTraceStatus = 'running' | 'completed' | 'denied' | 'failed';

export interface ToolTraceItem {
  id?: string;
  tool: string;
  status: ToolTraceStatus;
  input?: Record<string, any>;
  params?: Record<string, any>;
  output?: any;
  result?: any;
  error?: string;
  duration_ms?: number;
  allowed?: boolean;
  reason?: string;
  startTime?: number;
}

export type ToolTrace = ToolTraceItem;

// ---------------------------------------------------------------------------
// Human-in-the-Loop Approvals
// ---------------------------------------------------------------------------
export type RiskTier =
  | 'read'
  | 'write_local'
  | 'write_workspace'
  | 'write_external'
  | 'admin'
  | 'irreversible';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'consumed' | 'expired';

export interface ApprovalRecord {
  id: string;
  profile_id?: string;
  run_id?: string;
  thread_id?: string;
  tool_name: string;
  args_redacted: Record<string, any> | string;
  payload_hash: string;
  destination_hosts?: string[] | string;
  risk_tier: RiskTier;
  status: ApprovalStatus;
  expires_at?: string;
  created_at?: string;
  decided_at?: string;
  decided_by?: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Multi-Step Execution Plan
// ---------------------------------------------------------------------------
export interface ExecutionPlanStep {
  step: number;
  tool?: string;
  description: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface AgentTask {
  agent_id: string;
  role: string;
  skills: string[];
}

export interface ExecutionPlan {
  intent?: string;
  mode?: 'direct' | 'parallel' | 'hierarchical' | string;
  status?: 'compiled' | 'in_progress' | 'completed' | 'failed';
  reasoning?: string;
  primary_agent?: string;
  target_agents?: string[];
  tasks?: AgentTask[];
  steps?: ExecutionPlanStep[];
}

// ---------------------------------------------------------------------------
// Context Sources
// ---------------------------------------------------------------------------
export type ContextSourceType = 'thread' | 'attachments' | 'records' | 'vault' | 'connector' | 'web';

export interface ContextSourceItem {
  id: string;
  type: ContextSourceType;
  label: string;
  description?: string;
  has_phi?: boolean;
  is_tainted?: boolean;
  metadata?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Chat Message Interface
// ---------------------------------------------------------------------------
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
  isRefusal?: boolean;
  isEmergency?: boolean;
  emergencyCategory?: string;
  refusalReason?: string;
  boundaryWarning?: boolean;
  boundaryReason?: string;
  toolTraces?: ToolTraceItem[];
  traces?: ToolTraceItem[];
  attachments?: string[];
  approval?: ApprovalRecord;
  contextSources?: ContextSourceItem[];
  plan?: ExecutionPlan;
  error?: string;
  isError?: boolean;
}

// ---------------------------------------------------------------------------
// Dossier Data Types
// ---------------------------------------------------------------------------
export interface ClinicalVisitDossierData {
  reason_for_visit?: string;
  physician_instructions?: string[];
  follow_up_timeline?: string;
  questions_to_ask?: string[];
}

export interface InsuranceBenefitsDossierData {
  deductible?: string;
  copays?: Record<string, string>;
  coinsurance?: string;
  out_of_pocket_maximum?: string;
  in_out_network_rules?: string;
  prior_authorization_flags?: string[];
}

export interface GenericDocumentDossierData {
  summary?: string;
  key_numerical_values?: Record<string, string>;
  sections?: string[];
}

export interface ChecklistItemState {
  id: string;
  text: string;
  completed: boolean;
  isCustom?: boolean;
}

// ---------------------------------------------------------------------------
// Emergency Services Configuration
// ---------------------------------------------------------------------------
export interface EmergencyServicesConfig {
  primaryEmergency: { label: string; actionText: string; telUri: string };
  erFinderUrl: string;
  erFinderLabel: string;
  crisisLifeline: { label: string; actionText: string; telUri: string };
}

export const DEFAULT_EMERGENCY_SERVICES: EmergencyServicesConfig = {
  primaryEmergency: {
    label: 'Call Emergency Services',
    actionText: 'Call 911 Immediately',
    telUri: 'tel:911',
  },
  erFinderUrl: 'https://www.google.com/maps/search/emergency+room+near+me',
  erFinderLabel: 'Find Nearest ER',
  crisisLifeline: {
    label: '988 Suicide & Crisis Lifeline',
    actionText: 'Call or Text 988',
    telUri: 'tel:988',
  },
};
