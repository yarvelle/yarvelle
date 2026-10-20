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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  KeyRound,
  Cpu,
  ShieldCheck,
  Layers,
  Network,
  Palette,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const settingsNavItems = [
    { href: '/settings/account', label: 'Account', icon: KeyRound, testId: 'settings-nav-account' },
    { href: '/settings/model', label: 'Model & Runtime', icon: Cpu, testId: 'settings-nav-model' },
    { href: '/settings/privacy', label: 'Privacy & Data', icon: ShieldCheck, testId: 'settings-nav-privacy' },
    { href: '/settings/packs', label: 'Domain Packs', icon: Layers, testId: 'settings-nav-packs' },
    { href: '/settings/connections', label: 'Connections', icon: Network, testId: 'settings-nav-connections' },
    { href: '/settings/display', label: 'Display & Theme', icon: Palette, testId: 'settings-nav-display' },
    { href: '/settings/diagnostics', label: 'Diagnostics & Logs', icon: Server, testId: 'settings-nav-diagnostics' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)] tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs text-[var(--cf-text-muted)] mt-1">
          Configure local-first LLM inference, domain pack toggles, privacy vault, and active devices.
        </p>
      </div>

      {/* Mobile Horizontal Scroll Tab Bar */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[var(--cf-border)]">
        {settingsNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testId}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0',
                isActive
                  ? 'bg-[var(--cf-primary)] text-[var(--cf-primary-contrast)] shadow-xs'
                  : 'bg-[var(--cf-surface)] text-[var(--cf-text-muted)] border border-[var(--cf-border)] hover:text-[var(--cf-text-primary)]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-8 items-start">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:block sticky top-20 bg-[var(--cf-surface)] border border-[var(--cf-border)] rounded-2xl p-3 shadow-xs">
          <nav className="flex flex-col gap-1" aria-label="Settings navigation">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={item.testId}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[40px]',
                    isActive
                      ? 'bg-[var(--cf-primary-subtle)] text-[var(--cf-primary)] font-semibold'
                      : 'text-[var(--cf-text-secondary)] hover:bg-[var(--cf-surface-muted)] hover:text-[var(--cf-text-primary)]'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[var(--cf-primary)]' : 'text-[var(--cf-text-muted)]')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
