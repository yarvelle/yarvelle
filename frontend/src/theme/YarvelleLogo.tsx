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

export interface YarvelleLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export function YarvelleEmblem({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Yarvelle Cradle Emblem"
    >
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#047857" />
      <circle cx="32" cy="22" r="8" fill="#F59E0B" />
      <path d="M9 26L30 38V56L9 44Z" fill="#FAF9F5" />
      <path d="M55 26L34 38V56L55 44Z" fill="#A7F3D0" />
    </svg>
  );
}

export function YarvelleLogo({
  className = '',
  size = 32,
  showWordmark = true,
  theme = 'auto',
}: YarvelleLogoProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-fg';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <YarvelleEmblem size={size} />
      {showWordmark && (
        <span className={`font-semibold tracking-tight text-xl ${textColor}`}>
          Yarvelle
        </span>
      )}
    </div>
  );
}

export default YarvelleLogo;
