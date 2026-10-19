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

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { YarvelleLogo } from '@/theme/YarvelleLogo';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yarvelle — Personal & Family AI Assistant',
  description: 'Privacy-preserving local-first personal and family AI assistant',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon-180.png',
  },
  manifest: '/site.webmanifest',
};

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/chat', label: 'Assistant' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/notes', label: 'Notes' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/settings', label: 'Settings' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1311] text-slate-900 dark:text-slate-100 antialiased">
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B1311]/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="hover:opacity-90 transition">
              <YarvelleLogo size={32} />
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Local-First
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
          <p>© 2026 Spectrayan. Licensed under PolyForm Noncommercial License 1.0.0 and Yarvelle Additional Terms.</p>
        </footer>
      </body>
    </html>
  );
}
