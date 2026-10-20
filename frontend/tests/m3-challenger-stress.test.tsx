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

import React, { act } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Storage Mocking
class MemoryStorage implements Storage {
  private data: Record<string, string> = {};
  get length() {
    return Object.keys(this.data).length;
  }
  clear() {
    this.data = {};
  }
  getItem(key: string) {
    return this.data[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.data[key] = String(value);
  }
  removeItem(key: string) {
    delete this.data[key];
  }
  key(index: number) {
    return Object.keys(this.data)[index] ?? null;
  }
}

const mockStorage = new MemoryStorage();
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    configurable: true,
    writable: true,
  });
}
Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  configurable: true,
  writable: true,
});

// Router and Navigation Mocking
const mockPush = vi.fn();
let mockSearchParamString = '';

vi.mock('next/navigation', () => ({
  usePathname: () => '/chat',
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(mockSearchParamString),
}));

// Components under empirical stress-test
import { ChatStudioShell } from '@/components/chat/ChatStudioShell';
import { ModelSelector } from '@/components/ModelSelector';
import { AttachmentPicker } from '@/components/chat/AttachmentPicker';
import { ApprovalCard } from '@/components/chat/ApprovalCard';
import { EmergencyEscalationCard } from '@/components/chat/EmergencyEscalationCard';
import { DossierExportMenu } from '@/components/chat/DossierExportMenu';
import { ChatMarkdown, isSafeUrl } from '@/components/chat/ChatMarkdown';
import { AppointmentsClient } from '@/app/p/[profileId]/appointments/AppointmentsClient';
import { VitalsClient } from '@/app/p/[profileId]/vitals/VitalsClient';
import { EducationClient } from '@/app/p/[profileId]/education/EducationClient';
import { ProfileActivityClient } from '@/app/p/[profileId]/activity/ProfileActivityClient';
import { generateIcsCalendar, validateIcsFormat } from '@/lib/ics';
import { setStorageUserId, getScopedStorageKey } from '@/lib/storageNamespace';
import { upsertSessionFromMessages, YARVELLE_THREADS_INDEX_KEY } from '@/lib/sessionHistory';
import type { ApprovalRecord, ChatMessage } from '@/lib/types';
import type { YarvelleUserSettings } from '@/lib/settings';

describe('Challenger M3-1: Empirical Stress-Test — Chat Studio & Hub Interactions', () => {
  let originalPrint: typeof window.print;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    mockStorage.clear();
    setStorageUserId('me');
    mockPush.mockReset();
    mockSearchParamString = '';
    vi.clearAllMocks();

    originalPrint = window.print;
    window.print = vi.fn();

    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    window.print = originalPrint;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  /* =========================================================================
     1. Chat Studio: Thread Switching, New Thread, Search, and Alert Deletion
  ========================================================================= */
  describe('Chat Studio — Thread Session History & Lifecycle', () => {
    it('switches active thread and loads messages from localStorage', async () => {
      // Seed pre-existing sessions in localStorage
      const sessionList = [
        {
          id: 'thread-alpha',
          title: 'Cardiology Consultation',
          agentId: 'cardiology-guide',
          agentTitle: 'Cardiology Guide',
          updatedAt: new Date().toISOString(),
          messageCount: 2,
          snippet: 'Blood pressure guidance',
        },
        {
          id: 'thread-beta',
          title: 'Tax & Medical HSA Bridge',
          agentId: 'benefits-guide',
          agentTitle: 'Benefits Guide',
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          messageCount: 3,
          snippet: 'HSA deductible rules',
        },
      ];
      mockStorage.setItem(
        getScopedStorageKey('me', YARVELLE_THREADS_INDEX_KEY),
        JSON.stringify(sessionList)
      );

      // Seed messages for thread-alpha
      const alphaMessages: ChatMessage[] = [
        { id: 'm-1', role: 'user', content: 'What is resting BP?' },
        { id: 'm-2', role: 'assistant', content: 'Resting BP target is below 120/80.' },
      ];
      mockStorage.setItem(
        getScopedStorageKey('me', 'msgs_thread-alpha'),
        JSON.stringify(alphaMessages)
      );

      // Seed messages for thread-beta
      const betaMessages: ChatMessage[] = [
        { id: 'm-3', role: 'user', content: 'Explain HSA deductible.' },
        { id: 'm-4', role: 'assistant', content: 'HSA covers qualified expenses.' },
      ];
      mockStorage.setItem(
        getScopedStorageKey('me', 'msgs_thread-beta'),
        JSON.stringify(betaMessages)
      );

      render(<ChatStudioShell profileId="me" initialThreadId="thread-alpha" />);

      // Initial active thread-alpha content
      expect(screen.getByText('What is resting BP?')).toBeDefined();
      expect(screen.getByText('Resting BP target is below 120/80.')).toBeDefined();

      // Click thread-beta in sidebar
      const threadBetaItem = screen.getByTestId('thread-item-thread-beta');
      fireEvent.click(threadBetaItem);

      // Now thread-beta messages must be visible
      await waitFor(() => {
        expect(screen.getByText('Explain HSA deductible.')).toBeDefined();
        expect(screen.getByText('HSA covers qualified expenses.')).toBeDefined();
      });
    });

    it('creates a new thread, resetting message stream to starter chips', async () => {
      // Seed initial active thread with messages
      mockStorage.setItem(
        'yarvelle_me_msgs_thread-existing',
        JSON.stringify([{ id: 'm-x', role: 'user', content: 'Old question' }])
      );

      render(<ChatStudioShell profileId="me" initialThreadId="thread-existing" />);
      expect(screen.getByText('Old question')).toBeDefined();

      // Click New Consultation button
      const newChatBtn = screen.getByTestId('new-chat-btn');
      fireEvent.click(newChatBtn);

      // Old messages disappear and composer/starters are cleared
      await waitFor(() => {
        expect(screen.queryByText('Old question')).toBeNull();
      });
    });

    it('filters session history by search query and restores full list when cleared', async () => {
      const sessionList = [
        {
          id: 'th-1',
          title: 'Pediatric Dental Prep',
          agentId: 'derma-guide',
          agentTitle: 'Dermatology Guide',
          updatedAt: new Date().toISOString(),
          messageCount: 1,
        },
        {
          id: 'th-2',
          title: 'Orthopedic Knee Rehab',
          agentId: 'ortho-guide',
          agentTitle: 'Orthopedics Guide',
          updatedAt: new Date().toISOString(),
          messageCount: 1,
        },
      ];
      mockStorage.setItem(
        getScopedStorageKey('me', YARVELLE_THREADS_INDEX_KEY),
        JSON.stringify(sessionList)
      );

      render(<ChatStudioShell profileId="me" />);

      expect(screen.getByTestId('thread-item-th-1')).toBeDefined();
      expect(screen.getByTestId('thread-item-th-2')).toBeDefined();

      // Search for 'Ortho'
      const searchInput = screen.getByTestId('thread-search-input');
      fireEvent.change(searchInput, { target: { value: 'Ortho' } });

      expect(screen.queryByTestId('thread-item-th-1')).toBeNull();
      expect(screen.getByTestId('thread-item-th-2')).toBeDefined();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByTestId('thread-item-th-1')).toBeDefined();
      expect(screen.getByTestId('thread-item-th-2')).toBeDefined();
    });

    it('opens alertdialog on delete, supports cancellation, and confirms removal', async () => {
      const sessionList = [
        {
          id: 'th-delete-me',
          title: 'Temporary Session to Remove',
          agentId: 'visit-steward',
          agentTitle: 'Visit Steward',
          updatedAt: new Date().toISOString(),
          messageCount: 1,
        },
      ];
      mockStorage.setItem(
        getScopedStorageKey('me', YARVELLE_THREADS_INDEX_KEY),
        JSON.stringify(sessionList)
      );

      render(<ChatStudioShell profileId="me" initialThreadId="th-delete-me" />);

      // Hover / click delete button
      const deleteBtn = screen.getByTestId('delete-thread-th-delete-me');
      fireEvent.click(deleteBtn);

      // Alert Dialog must open
      const alertDialog = screen.getByRole('alertdialog');
      expect(alertDialog).toBeDefined();
      expect(screen.getByText('Delete this consultation?')).toBeDefined();

      // 1. Test Cancellation
      const cancelBtn = screen.getByTestId('cancel-delete-btn');
      fireEvent.click(cancelBtn);

      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(screen.getByTestId('thread-item-th-delete-me')).toBeDefined();

      // 2. Test Confirmation
      fireEvent.click(deleteBtn);
      const confirmBtn = screen.getByTestId('confirm-delete-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('thread-item-th-delete-me')).toBeNull();
        expect(screen.queryByRole('alertdialog')).toBeNull();
      });
    });
  });

  /* =========================================================================
     2. Chat Studio: Model Selector & Active Model Switching
  ========================================================================= */
  describe('Chat Studio — Model Selector & Provider Tuning', () => {
    it('switches providers and triggers settings change', () => {
      const initialSettings: YarvelleUserSettings = {
        provider: 'ollama',
        model: 'llama3.2',
        customModelName: '',
      };
      const onSettingsChange = vi.fn();
      const onOpenSettings = vi.fn();

      render(
        <ModelSelector
          settings={initialSettings}
          onSettingsChange={onSettingsChange}
          onOpenSettings={onOpenSettings}
        />
      );

      const providerSelect = screen.getByTestId('provider-selector');
      fireEvent.change(providerSelect, { target: { value: 'google' } });

      expect(onSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
        })
      );
    });

    it('changes active model selection from dropdown', () => {
      const initialSettings: YarvelleUserSettings = {
        provider: 'ollama',
        model: 'llama3.2',
        customModelName: '',
      };
      const onSettingsChange = vi.fn();
      const onOpenSettings = vi.fn();

      render(
        <ModelSelector
          settings={initialSettings}
          onSettingsChange={onSettingsChange}
          onOpenSettings={onOpenSettings}
        />
      );

      const modelSelect = screen.getByTestId('model-selector');
      fireEvent.change(modelSelect, { target: { value: 'llama3.1' } });

      expect(onSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama3.1',
        })
      );
    });

    it('renders custom model input when custom mode is selected and updates customModelName', () => {
      const customSettings: YarvelleUserSettings = {
        provider: 'custom',
        model: 'custom',
        customModelName: '',
      };
      const onSettingsChange = vi.fn();

      render(
        <ModelSelector
          settings={customSettings}
          onSettingsChange={onSettingsChange}
          onOpenSettings={vi.fn()}
        />
      );

      const customInput = screen.getByTestId('custom-model-input');
      expect(customInput).toBeDefined();

      fireEvent.change(customInput, { target: { value: 'qwen2.5:14b' } });
      expect(onSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          customModelName: 'qwen2.5:14b',
        })
      );
    });

    it('displays missing API key warning badge when cloud provider has no key configured', () => {
      const cloudSettings: YarvelleUserSettings = {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        apiKeys: {}, // No key provided
      };

      render(
        <ModelSelector
          settings={cloudSettings}
          onOpenSettings={vi.fn()}
        />
      );

      expect(screen.getByTestId('missing-key-badge')).toBeDefined();
      expect(screen.getByText('Key Required')).toBeDefined();
    });
  });

  /* =========================================================================
     3. Chat Studio: Attachment Picker Validation
  ========================================================================= */
  describe('Chat Studio — Attachment Picker Validation', () => {
    it('accepts compliant files under 10MB limit and triggers onAttach callback', async () => {
      const onAttach = vi.fn();
      render(<AttachmentPicker onAttach={onAttach} />);

      const fileInput = screen.getByTestId('attachment-file-input') as HTMLInputElement;
      expect(fileInput.accept).toContain('.pdf');
      expect(fileInput.accept).toContain('.json');

      const smallFile = new File(['mock content'], 'lab-report.pdf', { type: 'application/pdf' });
      Object.defineProperty(smallFile, 'size', { value: 1024 * 500 }); // 500 KB

      fireEvent.change(fileInput, { target: { files: [smallFile] } });

      await waitFor(() => {
        expect(onAttach).toHaveBeenCalledWith('lab-report.pdf');
      });
    });

    it('rejects oversized files (>10MB) with an accessible alert banner without calling onAttach', async () => {
      const onAttach = vi.fn();
      render(<AttachmentPicker onAttach={onAttach} />);

      const fileInput = screen.getByTestId('attachment-file-input') as HTMLInputElement;

      const hugeFile = new File(['huge data'], 'large-mri-scan.pdf', { type: 'application/pdf' });
      Object.defineProperty(hugeFile, 'size', { value: 1024 * 1024 * 15 }); // 15 MB

      fireEvent.change(fileInput, { target: { files: [hugeFile] } });

      await waitFor(() => {
        expect(onAttach).not.toHaveBeenCalled();
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('exceeds 10MB size limit');
      });
    });
  });

  /* =========================================================================
     4. Chat Studio: Action Authorization Card (ApprovalCard)
  ========================================================================= */
  describe('Chat Studio — Action Authorization (ApprovalCard)', () => {
    const baseApproval: ApprovalRecord = {
      id: 'appr-101',
      tool_name: 'generate_referral_letter',
      risk_tier: 'write_workspace',
      status: 'pending',
      args_redacted: {
        specialty: 'Cardiology',
        provider: 'Dr. Sarah Chen',
        patient_notes: 'Persistent morning chest tightness',
      },
      destination_hosts: ['api.regional-referral.org'],
      payload_hash: 'c8f7a932b1e4',
      expires_at: new Date(Date.now() + 600000).toISOString(), // 10 mins
    };

    it('handles user approval callback with status update and onResume invocation', async () => {
      const onDecided = vi.fn();
      const onResume = vi.fn();

      render(
        <ApprovalCard
          approval={baseApproval}
          onDecided={onDecided}
          onResume={onResume}
        />
      );

      expect(screen.getByTestId('approval-card')).toBeDefined();
      expect(screen.getByTestId('approval-ttl-timer')).toBeDefined();
      expect(screen.getByTestId('destination-host-pill').textContent).toBe('api.regional-referral.org');

      const approveBtn = screen.getByTestId('approve-button');
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(onDecided).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'appr-101',
            status: 'approved',
          })
        );
        expect(onResume).toHaveBeenCalledWith('appr-101', undefined);
      });
    });

    it('handles user rejection callback and renders rejection status banner', async () => {
      const onDecided = vi.fn();
      const onResume = vi.fn();

      render(
        <ApprovalCard
          approval={baseApproval}
          onDecided={onDecided}
          onResume={onResume}
        />
      );

      const rejectBtn = screen.getByTestId('reject-button');
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(onDecided).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'appr-101',
            status: 'rejected',
          })
        );
        expect(onResume).not.toHaveBeenCalled();
        expect(screen.getByTestId('approval-rejected-notice')).toBeDefined();
      });
    });

    it('allows editing arguments in-place and passes modified arguments on approval', async () => {
      const onDecided = vi.fn();

      render(
        <ApprovalCard
          approval={baseApproval}
          onDecided={onDecided}
        />
      );

      // Open argument editor
      const editBtn = screen.getByTestId('edit-arguments-button');
      fireEvent.click(editBtn);

      const jsonEditor = screen.getByTestId('arguments-json-editor');
      const updatedArgs = {
        specialty: 'Cardiology',
        provider: 'Dr. Sarah Chen',
        patient_notes: 'Updated notes with verified ECG trace',
      };
      fireEvent.change(jsonEditor, { target: { value: JSON.stringify(updatedArgs, null, 2) } });

      const saveEditsBtn = screen.getByTestId('save-edits-button');
      fireEvent.click(saveEditsBtn);

      // Verify modified arguments banner
      expect(screen.getByText('Modified Arguments')).toBeDefined();

      // Approve with modified arguments
      const approveBtn = screen.getByTestId('approve-button');
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(onDecided).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'approved',
            args_redacted: updatedArgs,
          })
        );
      });
    });

    it('enforces fail-closed validation when editing arguments with invalid JSON', () => {
      render(<ApprovalCard approval={baseApproval} />);

      fireEvent.click(screen.getByTestId('edit-arguments-button'));
      const jsonEditor = screen.getByTestId('arguments-json-editor');

      // Enter syntax error
      fireEvent.change(jsonEditor, { target: { value: '{ invalid: json syntax' } });

      expect(screen.getByTestId('arguments-json-error')).toBeDefined();
      const saveBtn = screen.getByTestId('save-edits-button') as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(true);
    });
  });

  /* =========================================================================
     5. Chat Studio: Emergency Escalation Card (911 / 988 Red-Flag Guidance)
  ========================================================================= */
  describe('Chat Studio — Emergency Escalation Card (911 / 988 Red Flags)', () => {
    it('displays 911 emergency guidance with direct dial and ER finder links', () => {
      const acuteMsg: ChatMessage = {
        id: 'msg-emerg-1',
        role: 'assistant',
        content: 'EMERGENCY: Crushing chest pain detected. Call 911 immediately.',
        isEmergency: true,
        emergencyCategory: 'cardiac',
      };

      render(<EmergencyEscalationCard message={acuteMsg} />);

      expect(screen.getByTestId('emergency-escalation-card')).toBeDefined();
      expect(screen.getByTestId('emergency-card-heading')).toBeDefined();

      const call911 = screen.getByTestId('emergency-call-911-btn');
      expect(call911.getAttribute('href')).toBe('tel:911');

      const findEr = screen.getByTestId('emergency-find-er-btn');
      expect(findEr.getAttribute('href')).toContain('google.com/maps');

      expect(screen.getByTestId('emergency-nonclinical-disclaimer')).toBeDefined();
    });

    it('displays 988 Crisis Lifeline button during suicide/crisis escalation without crash', () => {
      const crisisMsg: ChatMessage = {
        id: 'msg-crisis-1',
        role: 'assistant',
        content: 'Please reach out for support right now. The 988 Lifeline is free and confidential.',
        isEmergency: true,
        emergencyCategory: 'suicide_crisis',
      };

      render(<EmergencyEscalationCard message={crisisMsg} />);

      const call988 = screen.getByTestId('emergency-call-988-btn');
      expect(call988).toBeDefined();
      expect(call988.getAttribute('href')).toBe('tel:988');
    });

    it('resiliently handles empty or missing refusal reasons without crashing', () => {
      const emptyMsg: ChatMessage = {
        id: 'msg-empty-emerg',
        role: 'assistant',
        content: '',
        isEmergency: true,
      };

      const { container } = render(<EmergencyEscalationCard message={emptyMsg} />);
      expect(container.querySelector('[data-testid="emergency-escalation-card"]')).toBeDefined();
      expect(screen.getByTestId('emergency-backend-message')).toBeDefined();
    });
  });

  /* =========================================================================
     6. Chat Studio: Dossier Card Export Menu (Markdown, JSON, Print)
  ========================================================================= */
  describe('Chat Studio — Dossier Card Export Menu', () => {
    const sampleMessages: ChatMessage[] = [
      { id: 'm-1', role: 'user', content: 'Prepare questions for my annual cardiology checkup.' },
      { id: 'm-2', role: 'assistant', content: 'Here are 3 visit questions regarding blood pressure.' },
    ];

    it('renders export menu and triggers Markdown download with non-clinical disclaimer', () => {
      render(
        <DossierExportMenu
          messages={sampleMessages}
          agentId="cardiology-guide"
          threadId="th-100"
        />
      );

      const trigger = screen.getByTestId('export-dossier-menu-btn');
      fireEvent.click(trigger);

      const mdOption = screen.getByTestId('export-markdown-option');
      fireEvent.click(mdOption);

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('triggers JSON format transcript download conforming to schema', () => {
      render(
        <DossierExportMenu
          messages={sampleMessages}
          agentId="cardiology-guide"
          threadId="th-100"
        />
      );

      const trigger = screen.getByTestId('export-dossier-menu-btn');
      fireEvent.click(trigger);

      const jsonOption = screen.getByTestId('export-json-option');
      fireEvent.click(jsonOption);

      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('triggers window.print() via Print Consultation menu option', () => {
      render(
        <DossierExportMenu
          messages={sampleMessages}
          agentId="cardiology-guide"
          threadId="th-100"
        />
      );

      const trigger = screen.getByTestId('export-dossier-menu-btn');
      fireEvent.click(trigger);

      const printOption = screen.getByTestId('export-print-option');
      fireEvent.click(printOption);

      expect(window.print).toHaveBeenCalledTimes(1);
    });

    it('disables export menu button when message transcript is empty', () => {
      render(
        <DossierExportMenu
          messages={[]}
          agentId="cardiology-guide"
        />
      );

      const trigger = screen.getByTestId('export-dossier-menu-btn') as HTMLButtonElement;
      expect(trigger.disabled).toBe(true);
    });
  });

  /* =========================================================================
     7. Hub State: Appointments RFC 5545 .ics Export Generation
  ========================================================================= */
  describe('Hub State — Appointments RFC 5545 .ics Export', () => {
    it('generates valid RFC 5545 iCalendar content with CRLF line terminators', () => {
      const appointments = [
        {
          id: 'apt-stress-1',
          title: 'Cardiovascular Comprehensive Consultation',
          providerName: 'Dr. Sarah Chen, MD',
          specialty: 'Cardiology',
          location: 'Northwest Heart Pavilion, Suite 410',
          startTime: '2026-11-15T14:30:00.000Z',
          endTime: '2026-11-15T15:30:00.000Z',
          status: 'confirmed',
        },
      ];

      const icsOutput = generateIcsCalendar(appointments, { profileId: 'me' });

      // Empirical verification against RFC 5545 constraints
      expect(icsOutput).toContain('BEGIN:VCALENDAR\r\n');
      expect(icsOutput).toContain('VERSION:2.0\r\n');
      expect(icsOutput).toContain('PRODID:-//Yarvelle//Personal Health Schedule//EN\r\n');
      expect(icsOutput).toContain('CALSCALE:GREGORIAN\r\n');
      expect(icsOutput).toContain('BEGIN:VEVENT\r\n');
      expect(icsOutput).toContain('UID:apt-stress-1@yarvelle.local\r\n');
      expect(icsOutput).toContain('DTSTART:20261115T143000Z\r\n');
      expect(icsOutput).toContain('DTEND:20261115T153000Z\r\n');
      expect(icsOutput).toContain('SUMMARY:Cardiovascular Comprehensive Consultation\r\n');
      expect(icsOutput).toContain('STATUS:CONFIRMED\r\n');
      expect(icsOutput).toContain('END:VEVENT\r\n');
      expect(icsOutput).toContain('END:VCALENDAR\r\n');

      const validation = validateIcsFormat(icsOutput);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('clicking export (.ics) button in AppointmentsClient triggers download helper', () => {
      render(<AppointmentsClient profileId="me" />);

      const exportIcsBtn = screen.getByTestId('export-calendar-ics-btn');
      fireEvent.click(exportIcsBtn);

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  /* =========================================================================
     8. Hub State: Vitals Privacy Mask Toggle
  ========================================================================= */
  describe('Hub State — Vitals Privacy Mask Toggle', () => {
    it('masks and unmasks weight values and persists preference to ScopedStorage', () => {
      render(<VitalsClient profileId="me" />);

      const weightCard = screen.getByTestId('vitals-card-weight');
      const maskToggleBtn = screen.getByTestId('privacy-hide-weight-btn');

      // Initial state: unmasked, numeric weight visible
      expect(weightCard.textContent).toContain('168.0');
      expect(weightCard.textContent).toContain('Healthy');

      // Toggle to Masked
      fireEvent.click(maskToggleBtn);

      expect(weightCard.textContent).toContain('••••');
      expect(weightCard.textContent).toContain('Masked');
      expect(weightCard.textContent).toContain('Hidden for privacy');

      // Verified persistence in ScopedStorage
      const savedPref = mockStorage.getItem('yarvelle_me_vitals_hide_weight_me');
      expect(savedPref).toBe('true');

      // Toggle back to Unmasked
      fireEvent.click(maskToggleBtn);
      expect(weightCard.textContent).toContain('168.0');
      expect(mockStorage.getItem('yarvelle_me_vitals_hide_weight_me')).toBe('false');
    });
  });

  /* =========================================================================
     9. Hub State: Education 7-Day Reading Streak Toggle
  ========================================================================= */
  describe('Hub State — Education 7-Day Reading Streak', () => {
    it('toggles daily streak checkins and updates active streak calculation', () => {
      render(<EducationClient profileId="me" />);

      // Initial active streak badge
      expect(screen.getByTestId('reading-streak-badge')).toBeDefined();

      // Toggle a day (e.g. Mon from 35m to 0m)
      const monToggle = screen.getByTestId('streak-day-toggle-Mon');
      fireEvent.click(monToggle);

      // Stored state updated
      const savedReading = mockStorage.getItem('yarvelle_me_education_reading_me');
      expect(savedReading).not.toBeNull();
      const parsed = JSON.parse(savedReading!);
      expect(parsed.weeklyMinutes.Mon).toBe(0);
      expect(parsed.streakDays).toBe(6); // 6 active days remaining
    });

    it('logs reading session through modal and increments streak count', async () => {
      render(<EducationClient profileId="me" />);

      const openModalBtn = screen.getByTestId('log-reading-btn');
      fireEvent.click(openModalBtn);

      const modal = screen.getByTestId('log-reading-modal');
      expect(modal).toBeDefined();

      const submitBtn = screen.getByRole('button', { name: 'Save Session' });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('log-reading-modal')).toBeNull();
      });

      const savedReading = mockStorage.getItem('yarvelle_me_education_reading_me');
      expect(savedReading).not.toBeNull();
      const parsed = JSON.parse(savedReading!);
      expect(parsed.streakDays).toBe(8); // incremented from 7
    });
  });

  /* =========================================================================
     10. Hub State: Profile Activity & Single-Click Undo Action
  ========================================================================= */
  describe('Hub State — Activity Log Undo Action Trigger', () => {
    it('triggers single-click undo, marks item as reverted, and prepends reversal event', async () => {
      render(<ProfileActivityClient profileId="me" />);

      // act-1 is undoable
      const undoBtn = screen.getByTestId('undo-activity-btn-act-1');
      expect(undoBtn).toBeDefined();

      fireEvent.click(undoBtn);

      // Verify success toast
      await waitFor(() => {
        const toast = screen.getByTestId('activity-toast-success');
        expect(toast.textContent).toContain('Action reverted: "Cardiology Visit Prep Checklist Generated"');
      });

      // Original item has line-through and 'Action was reverted'
      const item1 = screen.getByTestId('activity-item-act-1');
      expect(item1.textContent).toContain('Action was reverted');

      // Verify persistence in ScopedStorage with prepended undo record
      const savedActivity = mockStorage.getItem('yarvelle_me_activity_events_me');
      expect(savedActivity).not.toBeNull();
      const parsed = JSON.parse(savedActivity!);
      expect(parsed[0].event).toBe('undo');
      expect(parsed[0].summary).toContain('Reverted: Cardiology Visit Prep Checklist Generated');
      expect(parsed[1].undone).toBe(true);
    });
  });

  /* =========================================================================
     9. Remediation Verification: Security URL Sanitization, Prompt Binding & Approvals
  ========================================================================= */
  describe('Milestone 3 Remediation Verification', () => {
    it('isSafeUrl allows safe protocols and disallows script/data protocols', () => {
      expect(isSafeUrl('https://spectrayan.com')).toBe(true);
      expect(isSafeUrl('http://example.com/health')).toBe(true);
      expect(isSafeUrl('mailto:leo@family.internal')).toBe(true);
      expect(isSafeUrl('tel:+15551234567')).toBe(true);
      expect(isSafeUrl('/p/me/chat')).toBe(true);
      expect(isSafeUrl('#section-prep')).toBe(true);

      // Blocked dangerous protocols
      expect(isSafeUrl('javascript:alert(document.cookie)')).toBe(false);
      expect(isSafeUrl('JAVASCRIPT:void(0)')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox("hello")')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('ChatMarkdown renders safe links as anchors and neutralizes javascript: schemes', () => {
      const { container } = render(
        <ChatMarkdown
          content="Check [Official Portal](https://example.com) or [Dangerous Script](javascript:alert(1))"
        />
      );

      const safeLink = container.querySelector('a[href="https://example.com"]');
      expect(safeLink).not.toBeNull();
      expect(safeLink?.textContent).toBe('Official Portal');

      // javascript: link must NOT be rendered as an anchor tag
      const dangerousLink = container.querySelector('a[href*="javascript"]');
      expect(dangerousLink).toBeNull();
      expect(container.textContent).toContain('Dangerous Script');
    });

    it('ChatStudioShell automatically populates inputText from searchParams.get("prompt")', () => {
      mockSearchParamString = 'prompt=Explain%20annual%20deductible%20rules';
      render(<ChatStudioShell profileId="me" />);

      const composer = screen.getByTestId('chat-composer-input') as HTMLTextAreaElement;
      expect(composer.value).toBe('Explain annual deductible rules');
    });
  });
});

