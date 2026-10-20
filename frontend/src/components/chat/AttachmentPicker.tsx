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

import React, { useRef, useState } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AttachmentPickerProps {
  onAttach: (filename: string) => void;
  disabled?: boolean;
  className?: string;
  accept?: string;
}

const DEFAULT_ACCEPT = '.pdf,.txt,.md,.json,.csv,.tsv,.yaml,.yml';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function AttachmentPicker({
  onAttach,
  disabled = false,
  className,
  accept = DEFAULT_ACCEPT,
}: AttachmentPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleClick = () => {
    if (disabled || isUploading) return;
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File "${file.name}" exceeds 10MB size limit.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/attachments', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          onAttach(data.filename || file.name);
        } else {
          onAttach(file.name);
        }
      } catch {
        onAttach(file.name);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        ref={fileInputRef}
        type="file"
        data-testid="attachment-file-input"
        className="hidden"
        accept={accept}
        multiple
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        data-testid="attachment-picker-trigger"
        aria-label="Attach document"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={cn(
          'p-1.5 rounded-lg text-[var(--cf-fg-subtle)] hover:text-[var(--cf-fg)] hover:bg-[var(--cf-surface-2)] transition min-h-[36px] min-w-[36px] flex items-center justify-center disabled:opacity-50 cursor-pointer',
          className
        )}
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </button>
      {uploadError && (
        <span
          role="alert"
          className="absolute bottom-full start-0 mb-1 text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap bg-white dark:bg-zinc-800 p-1 rounded shadow-sm border border-rose-200"
        >
          {uploadError}
        </span>
      )}
    </div>
  );
}

export default AttachmentPicker;
