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

export type RiskClass = 'wellness' | 'admin' | 'clinical_assist' | 'education';

export const RISK_CLASS_OPTIONS: readonly RiskClass[] = [
  'wellness',
  'admin',
  'clinical_assist',
  'education',
] as const;

export type UserRole = 'admin' | 'steward' | 'member' | 'viewer' | 'user';
export type UserStatus = 'active' | 'disabled';
export type AuthProviderType = 'local' | 'oidc' | 'google' | 'github' | 'disabled';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  role: UserRole;
  status: UserStatus;
  auth_provider: AuthProviderType;
  created_at: string;
  updated_at?: string;
  last_login_at?: string | null;
}

export type User = UserProfile;

export interface AuthProvidersInfo {
  active_provider: 'local' | 'oidc' | 'disabled';
  sso_providers: string[];
  registration_enabled: boolean;
  allow_registration?: boolean;
  min_password_length?: number;
  has_admin?: boolean;
  needs_admin_setup?: boolean;
}

export interface UserSessionItem {
  id: string;
  user_id: string;
  client_ip: string | null;
  user_agent: string | null;
  created_at: string;
  last_active_at: string | null;
  expires_at: string;
  is_current?: boolean;
}

export interface SystemSettings {
  [key: string]: any;
}

export interface OllamaHealthStatus {
  status: 'connected' | 'unreachable' | 'error';
  endpoint: string;
  reachable: boolean;
  activeModel?: string;
  availableModels?: string[];
  error?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  timestamp: string;
  modelReachable?: boolean;
  backendReachable?: boolean;
  workspace?: {
    root: string;
    agentsCount: number;
    skillsCount: number;
  };
  ollama?: OllamaHealthStatus;
}

export interface AgentSummary {
  id: string;
  title: string;
  version: string;
  risk_class: RiskClass | string;
  skills: string[];
  effectiveTools: string[];
  tools?: string[];
  starters: string[];
  startersCount?: number;
  description?: string;
  is_bundled?: boolean;
  isBundled?: boolean;
  verified?: boolean;
  forbidden?: string[];
  hidden?: boolean;
  error?: string;
  domain?: 'health' | 'finance' | 'education' | 'household' | 'system' | string;
  category?: string;
  care_stages?: string[];
  target_audience?: string[];
  tags?: string[];
  icon?: string;
  maturity?: 'draft' | 'beta' | 'stable' | 'deprecated' | string;
  persona_file?: string;
}

export type AuditEventType =
  | 'tool_start'
  | 'tool_end'
  | 'tool_denied'
  | 'tool_error'
  | 'red_flag'
  | 'pii_redact'
  | 'pii_detected'
  | 'consent_check'
  | 'token_usage'
  | 'routing_decision'
  | 'refusal'
  | 'refuse'
  | 'error'
  | 'boundary_warning'
  | 'synthesis'
  | 'tool'
  | 'run';

export interface AuditEvent {
  ts: string;
  agent_id: string;
  skill_id?: string | null;
  skill_version?: string | null;
  event: AuditEventType;
  tool?: string | null;
  allowed?: boolean | null;
  reason?: string | null;
  duration_ms?: number | null;
  prompt?: string | null;
  completion?: string | null;
  thread_id?: string | null;
}

export interface AuditListResponse {
  total: number;
  limit: number;
  events: AuditEvent[];
}

export interface AuditFilterParams {
  limit?: number;
  agent_id?: string;
  event?: AuditEventType | string;
}

export interface SkillSummary {
  id: string;
  title: string;
  version: string;
  risk_class: RiskClass | string;
  domain: string;
  category: string;
  description: string;
  author?: string;
  tools_required?: string[];
  parameters?: Record<string, any>;
  guidelines_file?: string;
}
