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
import { CodeBlock } from './CodeBlock';

export interface ChatMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Sanitizes URLs in rendered markdown links to protect against XSS vectors
 * (such as javascript:, vbscript:, data:). Only permits http:, https:, mailto:, tel:,
 * or local paths (/ or #).
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return true;
  }
  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:')
  );
}

function renderInlineText(text: string): React.ReactNode[] {
  // Regex parsing for bold, italic, code, links
  const elements: React.ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${match.index}-${token.slice(0, 10)}`;

    if (token.startsWith('**') && token.endsWith('**')) {
      elements.push(
        <strong key={key} className="font-semibold text-[var(--cf-fg)]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      elements.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      elements.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-[var(--cf-surface-2)] border border-[var(--cf-border)] font-mono text-xs text-[var(--cf-primary-dark)] font-medium"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (match[2] && match[3]) {
      const href = match[3].trim();
      if (isSafeUrl(href)) {
        elements.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--cf-primary)] underline underline-offset-2 hover:opacity-80 transition font-medium"
          >
            {match[2]}
          </a>
        );
      } else {
        elements.push(
          <span key={key} className="font-medium text-[var(--cf-fg)]">
            {match[2]}
          </span>
        );
      }
    } else {
      elements.push(token);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

export function ChatMarkdown({ content, className = '' }: ChatMarkdownProps) {
  if (!content) return null;

  // Split into blocks: code blocks vs normal markdown blocks
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];
  let paragraphLines: string[] = [];
  let tableLines: string[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      const text = paragraphLines.join(' ').trim();
      if (text) {
        blocks.push(
          <p key={`p-${blocks.length}`} className="text-sm leading-relaxed mb-2 last:mb-0">
            {renderInlineText(text)}
          </p>
        );
      }
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const isOl = listType === 'ol';
      const items = listItems.map((item, idx) => (
        <li key={idx} className="text-sm leading-relaxed">
          {renderInlineText(item)}
        </li>
      ));
      if (isOl) {
        blocks.push(
          <ol
            key={`ol-${blocks.length}`}
            className="list-decimal ps-5 my-2 space-y-1 text-sm text-[var(--cf-fg)]"
          >
            {items}
          </ol>
        );
      } else {
        blocks.push(
          <ul
            key={`ul-${blocks.length}`}
            className="list-disc ps-5 my-2 space-y-1 text-sm text-[var(--cf-fg)]"
          >
            {items}
          </ul>
        );
      }
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableLines.length >= 2) {
      const headerLine = tableLines[0];
      const rowsLines = tableLines.slice(2);
      const headers = headerLine
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);

      blocks.push(
        <div
          key={`table-${blocks.length}`}
          className="my-3 w-full max-w-full overflow-x-auto rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] shadow-sm"
        >
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead className="bg-[var(--cf-surface-2)] text-[var(--cf-fg)] font-semibold border-b border-[var(--cf-border)]">
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider border-e last:border-e-0 border-[var(--cf-border)] whitespace-nowrap"
                  >
                    {renderInlineText(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cf-border)]">
              {rowsLines.map((row, rIdx) => {
                const cells = row
                  .split('|')
                  .map((c) => c.trim())
                  .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-[var(--cf-surface-2)]/60 transition-colors"
                  >
                    {cells.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-4 py-2.5 text-sm text-[var(--cf-fg)] border-e last:border-e-0 border-[var(--cf-border)] align-top whitespace-nowrap"
                      >
                        {renderInlineText(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableLines = [];
    } else if (tableLines.length > 0) {
      paragraphLines.push(...tableLines);
      tableLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code block check
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        flushParagraph();
        flushList();
        flushTable();
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockLines = [];
      } else {
        inCodeBlock = false;
        blocks.push(
          <CodeBlock
            key={`code-${blocks.length}`}
            code={codeBlockLines.join('\n')}
            language={codeBlockLang}
          />
        );
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Table row detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushParagraph();
      flushList();
      tableLines.push(line.trim());
      continue;
    } else if (tableLines.length > 0) {
      flushTable();
    }

    // Headings
    if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push(
        <h1
          key={`h1-${blocks.length}`}
          className="text-xl font-bold mt-4 mb-2 text-[var(--cf-fg)] border-b border-[var(--cf-border)] pb-1"
        >
          {renderInlineText(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="text-lg font-bold mt-3 mb-1.5 text-[var(--cf-fg)]">
          {renderInlineText(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="text-base font-semibold mt-2.5 mb-1 text-[var(--cf-fg)]">
          {renderInlineText(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      flushParagraph();
      flushList();
      blocks.push(
        <h4 key={`h4-${blocks.length}`} className="text-sm font-semibold mt-2 mb-1 text-[var(--cf-fg)]">
          {renderInlineText(line.slice(5))}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push(
        <blockquote
          key={`bq-${blocks.length}`}
          className="ps-3.5 border-s-2 border-[var(--cf-primary)] text-[var(--cf-fg-muted)] italic text-sm my-2 bg-[var(--cf-surface-2)]/50 py-1.5 rounded-e-md"
        >
          {renderInlineText(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---' || line.trim() === '***') {
      flushParagraph();
      flushList();
      blocks.push(<hr key={`hr-${blocks.length}`} className="my-3 border-[var(--cf-border)]" />);
      continue;
    }

    // Unordered List item
    const ulMatch = /^[*-]\s+(.+)/.exec(line.trim());
    if (ulMatch) {
      flushParagraph();
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered List item
    const olMatch = /^\d+\.\s+(.+)/.exec(line.trim());
    if (olMatch) {
      flushParagraph();
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      continue;
    }

    // Blank line
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    // Normal text
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();
  flushTable();

  if (inCodeBlock && codeBlockLines.length > 0) {
    blocks.push(
      <CodeBlock
        key={`code-${blocks.length}`}
        code={codeBlockLines.join('\n')}
        language={codeBlockLang}
      />
    );
  }

  return <div className={`markdown-body text-sm leading-relaxed ${className}`}>{blocks}</div>;
}
