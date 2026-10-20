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

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Shield,
  Stethoscope,
  FileText,
  HeartPulse,
  Wallet,
  GraduationCap,
  Home,
  Bot,
  Sparkles,
  Plus,
  ArrowRight,
  Check,
  Brain,
  MessageSquare,
} from 'lucide-react';
import type { AgentSummary, RiskClass } from '@/types/api';
import type { SkillSummary } from '@/lib/catalog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Segmented } from '@/components/ui/Segmented';
import { AgentFormModal } from '@/components/agents/AgentFormModal';
import { SkillFormModal } from '@/components/skills/SkillFormModal';

export interface AgentsClientProps {
  initialAgents: AgentSummary[];
  initialSkills: SkillSummary[];
  activeProfileId?: string;
}

function resolveDomainIcon(domain?: string, id?: string) {
  if (domain === 'finance') return Wallet;
  if (domain === 'education') return GraduationCap;
  if (domain === 'household') return Home;
  if (id === 'visit-steward' || id?.includes('cardio') || id?.includes('pulm')) return Stethoscope;
  if (id === 'habit-companion') return HeartPulse;
  return Bot;
}

export function AgentsClient({
  initialAgents,
  initialSkills,
  activeProfileId = 'me',
}: AgentsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [agents, setAgents] = useState<AgentSummary[]>(initialAgents);
  const [skills, setSkills] = useState<SkillSummary[]>(initialSkills);

  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);
  const [isCreateSkillOpen, setIsCreateSkillOpen] = useState(false);

  // Tab state: "assistants" vs "skills"
  const [activeTab, setActiveTab] = useState<'assistants' | 'skills'>(() => {
    return searchParams.get('tab') === 'skills' ? 'skills' : 'assistants';
  });

  const handleTabChange = (val: string) => {
    const nextTab = val === 'skills' ? 'skills' : 'assistants';
    setActiveTab(nextTab);
  };

  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedMaturity, setSelectedMaturity] = useState('all');
  const [forCaregivers, setForCaregivers] = useState(false);

  // Global "/" keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreatedAgent = (newAgent: AgentSummary) => {
    setAgents((prev) => [newAgent, ...prev]);
  };

  const handleCreatedSkill = (newSkill: SkillSummary) => {
    setSkills((prev) => [newSkill, ...prev]);
  };

  // Filtered Specialists
  const filteredAgents = useMemo(() => {
    return agents.filter((ag) => {
      if (selectedDomain !== 'all' && ag.domain !== selectedDomain) return false;
      if (selectedRisk !== 'all' && ag.risk_class !== selectedRisk) return false;
      if (selectedMaturity !== 'all' && ag.maturity !== selectedMaturity) return false;
      if (selectedStage !== 'all' && (!ag.care_stages || !ag.care_stages.includes(selectedStage))) return false;
      if (forCaregivers && (!ag.target_audience || !ag.target_audience.includes('caregivers'))) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = ag.title.toLowerCase().includes(q);
        const matchDesc = (ag.description || '').toLowerCase().includes(q);
        const matchSkills = ag.skills?.some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchSkills) return false;
      }
      return true;
    });
  }, [agents, selectedDomain, selectedRisk, selectedMaturity, selectedStage, forCaregivers, search]);

  // Filtered Skills
  const filteredSkills = useMemo(() => {
    return skills.filter((sk) => {
      if (selectedDomain !== 'all' && sk.domain !== selectedDomain) return false;
      if (selectedRisk !== 'all' && sk.risk_class !== selectedRisk) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = sk.title.toLowerCase().includes(q);
        const matchDesc = (sk.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [skills, selectedDomain, selectedRisk, search]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
            Specialists & Skills
          </h1>
          <p className="text-xs text-[var(--cf-text-muted)] mt-0.5">
            Curated autonomous intelligence across Health, Finance, Education, and Household.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Segmented
            aria-label="Marketplace view switcher"
            value={activeTab}
            onChange={handleTabChange}
            options={[
              {
                value: 'assistants',
                label: `Specialists (${agents.length})`,
                testId: 'marketplace-tab-assistants',
              },
              {
                value: 'skills',
                label: `Skills (${skills.length})`,
                testId: 'marketplace-tab-skills',
              },
            ]}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCreateSkillOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 me-1" />
            Create Skill
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateAgentOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 me-1" />
            Create Specialist
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-3 p-4 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--cf-text-muted)] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            data-testid="marketplace-search-input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search specialists, clinical guidelines, bills, or study decks... (Press / to focus)"
            className="w-full ps-9 pe-4 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Domain Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <span className="text-[10px] font-medium text-[var(--cf-text-muted)] me-1">Domain:</span>
            {['all', 'health', 'finance', 'education', 'household'].map((d) => (
              <button
                key={d}
                type="button"
                data-testid={`domain-filter-${d}`}
                onClick={() => setSelectedDomain(d)}
                className={`px-2.5 py-1 rounded-lg text-xs capitalize transition cursor-pointer ${
                  selectedDomain === d
                    ? 'bg-[var(--cf-primary)] text-[var(--cf-primary-contrast)] font-medium'
                    : 'bg-[var(--cf-surface-muted)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text-primary)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <span className="text-[10px] font-medium text-[var(--cf-text-muted)] ms-2 me-1">Risk:</span>
            {['all', 'clinical_assist', 'admin', 'wellness', 'education'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRisk(r)}
                className={`px-2.5 py-1 rounded-lg text-xs capitalize transition ${
                  selectedRisk === r
                    ? 'bg-[var(--cf-primary)] text-[var(--cf-primary-contrast)] font-medium'
                    : 'bg-[var(--cf-surface-muted)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text-primary)]'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Caregiver Toggle */}
          <button
            type="button"
            onClick={() => setForCaregivers((prev) => !prev)}
            className={`ms-auto px-2.5 py-1 rounded-lg text-xs transition border flex items-center gap-1.5 ${
              forCaregivers
                ? 'bg-[var(--cf-primary-subtle)] border-[var(--cf-primary)] text-[var(--cf-primary)] font-medium'
                : 'border-[var(--cf-border)] text-[var(--cf-text-muted)]'
            }`}
          >
            {forCaregivers && <Check className="w-3 h-3" />}
            For Caregivers
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'assistants' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--cf-text-muted)] font-medium">
              Showing {filteredAgents.length} specialists
            </span>
          </div>

          <div data-testid="specialist-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => {
              const IconComp = resolveDomainIcon(agent.domain, agent.id);
              return (
                <div
                  key={agent.id}
                  data-testid={`specialist-card-${agent.id}`}
                  className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[var(--cf-border-strong)] transition"
                >
                  <div className="space-y-3">
                    {/* Top Row: Icon + Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[var(--cf-surface-muted)] flex items-center justify-center text-[var(--cf-primary)]">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            agent.domain === 'health'
                              ? 'danger'
                              : agent.domain === 'finance'
                              ? 'success'
                              : agent.domain === 'education'
                              ? 'info'
                              : 'neutral'
                          }
                          className="capitalize"
                        >
                          {agent.domain}
                        </Badge>
                        <Badge variant="neutral">
                          {agent.risk_class.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-sm font-bold text-[var(--cf-text-primary)]">{agent.title}</h3>
                      <p className="text-xs text-[var(--cf-text-secondary)] mt-1 line-clamp-2">
                        {agent.description}
                      </p>
                    </div>

                    {/* Skill Tags */}
                    {agent.skills && agent.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {agent.skills.slice(0, 3).map((sk) => (
                          <span
                            key={sk}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cf-surface-muted)] border border-[var(--cf-border)] text-[var(--cf-text-muted)]"
                          >
                            {sk}
                          </span>
                        ))}
                        {agent.skills.length > 3 && (
                          <span className="text-[9px] text-[var(--cf-text-muted)] self-center">
                            +{agent.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer CTAs */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--cf-border)] text-xs">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] transition"
                    >
                      View details
                    </Link>

                    <Link href={`/chat?agent=${agent.id}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        data-testid={`consult-specialist-${agent.id}`}
                        className="text-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 me-1" />
                        Consult Specialist
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--cf-text-muted)] font-medium">
              Showing {filteredSkills.length} modular skill packs
            </span>
          </div>

          <div data-testid="skills-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                data-testid={`skill-card-${skill.id}`}
                className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[var(--cf-border-strong)] transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--cf-surface-muted)] flex items-center justify-center text-[var(--cf-primary)]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <Badge
                      variant={
                        skill.domain === 'health'
                          ? 'danger'
                          : skill.domain === 'finance'
                          ? 'success'
                          : skill.domain === 'education'
                          ? 'info'
                          : 'neutral'
                      }
                      className="capitalize"
                    >
                      {skill.domain}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[var(--cf-text-primary)]">{skill.title}</h3>
                    <p className="text-xs text-[var(--cf-text-secondary)] mt-1 line-clamp-3">
                      {skill.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--cf-border)] text-xs">
                  <span className="text-[10px] text-[var(--cf-text-muted)] font-mono">v{skill.version}</span>
                  <Link
                    href={`/skills/${skill.id}`}
                    className="text-[var(--cf-primary)] hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Skill docs &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AgentFormModal
        isOpen={isCreateAgentOpen}
        onClose={() => setIsCreateAgentOpen(false)}
        onSuccess={handleCreatedAgent}
        availableSkills={skills}
      />

      <SkillFormModal
        isOpen={isCreateSkillOpen}
        onClose={() => setIsCreateSkillOpen(false)}
        onSuccess={handleCreatedSkill}
      />
    </div>
  );
}
