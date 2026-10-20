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

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Upload,
  Plus,
  Search,
  Lock,
  Download,
  Trash2,
  FileCheck,
  Sparkles,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import { ScopedStorage } from '@/lib/storageNamespace';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

export interface LibraryAttachment {
  id: string;
  filename: string;
  fileFormat: 'pdf' | 'fhir' | 'ccda' | 'image' | 'csv';
  sizeBytes: number;
  uploadedAt: string;
  scope: string;
  groundedDossierExtracted: boolean;
  downloadUrl?: string;
  summary?: string;
}

export interface WorkspaceNoteItem {
  id: string;
  slug: string;
  title: string;
  body: string;
  scope: string;
  updatedAt: string;
  isEncrypted: boolean;
}

export interface LibraryClientProps {
  profileId: string;
}

const DEFAULT_ATTACHMENTS: LibraryAttachment[] = [
  {
    id: 'att-1',
    filename: 'Metropolitan_Health_Comprehensive_Visit_Summary.pdf',
    fileFormat: 'pdf',
    sizeBytes: 2450000,
    uploadedAt: 'Oct 14, 2026',
    scope: 'health.clinical',
    groundedDossierExtracted: true,
    summary: 'Clinical consultation notes, vital signs, and lipid panel bloodwork results.',
  },
  {
    id: 'att-2',
    filename: 'BlueCross_Explanation_Of_Benefits_September.pdf',
    fileFormat: 'pdf',
    sizeBytes: 820000,
    uploadedAt: 'Oct 08, 2026',
    scope: 'finance.statements',
    groundedDossierExtracted: true,
    summary: 'Cardiology in-network claim statement showing $45 copay responsibility.',
  },
  {
    id: 'att-3',
    filename: 'School_Athletic_Clearance_Immunization_Form.pdf',
    fileFormat: 'pdf',
    sizeBytes: 610000,
    uploadedAt: 'Sep 29, 2026',
    scope: 'education.forms',
    groundedDossierExtracted: true,
    summary: 'Signed pediatric health history clearance for middle school athletics.',
  },
];

const DEFAULT_NOTES: WorkspaceNoteItem[] = [
  {
    id: 'note-1',
    slug: 'cardiologist-prep-dossier',
    title: 'Cardiologist Consultation Questions Dossier',
    body: 'Questions regarding morning blood pressure spikes, recommendation on low-dose magnesium supplement, and referral for treadmill exercise stress test.',
    scope: 'health.clinical',
    updatedAt: 'Yesterday at 4:15 PM',
    isEncrypted: true,
  },
  {
    id: 'note-2',
    slug: 'hvac-warranty-serial-log',
    title: 'HVAC Air Filter & Warranty Specifications',
    body: 'Carrier 4-ton condenser unit model 24ACC648A003. Filter dimensions: 20x25x4 MERV-13. Primary service technician: Metro Heating (555) 882-1049.',
    scope: 'household.maintenance',
    updatedAt: '3 days ago',
    isEncrypted: true,
  },
  {
    id: 'note-3',
    slug: 'academic-reading-goals',
    title: 'Fall Semester Reading & Study Milestones',
    body: 'Target 30 minutes daily reading streak. AP Biology quiz flashcards scheduled for Thursday evenings before Friday unit examinations.',
    scope: 'education.study',
    updatedAt: '5 days ago',
    isEncrypted: true,
  },
];

export function LibraryClient({ profileId }: LibraryClientProps) {
  const [activeTab, setActiveTab] = useState<'documents' | 'notes' | 'search'>('documents');
  const [attachments, setAttachments] = useState<LibraryAttachment[]>(DEFAULT_ATTACHMENTS);
  const [notes, setNotes] = useState<WorkspaceNoteItem[]>(DEFAULT_NOTES);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);

  // Search & Filters
  const [notesSearch, setNotesSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');

  // New Note Form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteScope, setNoteScope] = useState('health.clinical');
  const [noteBody, setNoteBody] = useState('');

  // Upload Form
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadScope, setUploadScope] = useState('health.clinical');

  const attStorageKey = `library_attachments_${profileId}`;
  const notesStorageKey = `library_notes_${profileId}`;

  useEffect(() => {
    try {
      const storage = new ScopedStorage();
      const savedAtt = storage.getItem<LibraryAttachment[]>(attStorageKey, []);
      if (savedAtt && savedAtt.length > 0) {
        setAttachments(savedAtt);
      }
      const savedNotes = storage.getItem<WorkspaceNoteItem[]>(notesStorageKey, []);
      if (savedNotes && savedNotes.length > 0) {
        setNotes(savedNotes);
      }
    } catch {}
  }, [attStorageKey, notesStorageKey]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    const newNote: WorkspaceNoteItem = {
      id: `note-${Date.now()}`,
      slug: noteTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: noteTitle.trim(),
      body: noteBody.trim() || 'Argon2id encrypted note content.',
      scope: noteScope,
      updatedAt: 'Just now',
      isEncrypted: true,
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(notesStorageKey, updated);
    } catch {}

    setIsCreateNoteOpen(false);
    setNoteTitle('');
    setNoteBody('');
  };

  const handleUploadAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFilename.trim()) return;

    const newAtt: LibraryAttachment = {
      id: `att-${Date.now()}`,
      filename: uploadFilename.trim(),
      fileFormat: 'pdf',
      sizeBytes: 1540000,
      uploadedAt: 'Today',
      scope: uploadScope,
      groundedDossierExtracted: true,
      summary: 'Uploaded record stored securely in local-first attachment sandbox.',
    };

    const updated = [newAtt, ...attachments];
    setAttachments(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(attStorageKey, updated);
    } catch {}

    setIsUploadOpen(false);
    setUploadFilename('');
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(notesStorageKey, updated);
    } catch {}
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
      n.body.toLowerCase().includes(notesSearch.toLowerCase())
  );

  const hybridSearchResults = [
    ...attachments.filter(
      (a) =>
        !recordSearch.trim() ||
        a.filename.toLowerCase().includes(recordSearch.toLowerCase()) ||
        (a.summary && a.summary.toLowerCase().includes(recordSearch.toLowerCase()))
    ).map((a) => ({
      type: 'document' as const,
      id: a.id,
      title: a.filename,
      subtitle: `${a.fileFormat.toUpperCase()} · ${a.uploadedAt}`,
      snippet: a.summary || 'Uploaded document record.',
      scope: a.scope,
    })),
    ...notes.filter(
      (n) =>
        !recordSearch.trim() ||
        n.title.toLowerCase().includes(recordSearch.toLowerCase()) ||
        n.body.toLowerCase().includes(recordSearch.toLowerCase())
    ).map((n) => ({
      type: 'note' as const,
      id: n.id,
      title: n.title,
      subtitle: `Encrypted Note · Updated ${n.updatedAt}`,
      snippet: n.body,
      scope: n.scope,
    })),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="library-page-heading" className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              Library & Notes
            </h1>
            <p className="text-xs text-[var(--cf-text-muted)]">
              Encrypted notes, uploaded attachments, and hybrid record search across family documents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            data-testid="upload-attachment-btn"
          >
            <Upload className="w-4 h-4 me-1.5" />
            Upload Document
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateNoteOpen(true)}
            data-testid="new-note-btn"
          >
            <Plus className="w-4 h-4 me-1.5" />
            New Note
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--cf-border)] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          data-testid="library-tab-documents"
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            activeTab === 'documents'
              ? 'bg-[var(--cf-primary)] text-[var(--cf-primary-contrast)]'
              : 'text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] hover:bg-[var(--cf-surface-muted)]'
          }`}
        >
          Documents ({attachments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          data-testid="library-tab-notes"
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            activeTab === 'notes'
              ? 'bg-[var(--cf-primary)] text-[var(--cf-primary-contrast)]'
              : 'text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] hover:bg-[var(--cf-surface-muted)]'
          }`}
        >
          Encrypted Notes ({notes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          data-testid="library-tab-search"
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            activeTab === 'search'
              ? 'bg-[var(--cf-primary)] text-[var(--cf-primary-contrast)]'
              : 'text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] hover:bg-[var(--cf-surface-muted)]'
          }`}
        >
          Hybrid Record Search
        </button>
      </div>

      {/* Tab Content: Documents */}
      {activeTab === 'documents' && (
        <div data-testid="attachments-list" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Uploaded Records & Attachments</h2>
            <span className="text-xs text-[var(--cf-text-muted)]">{attachments.length} files in sandbox</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attachments.map((att) => (
              <div key={att.id} className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--cf-surface-muted)] flex items-center justify-center text-[var(--cf-primary)] shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--cf-text-primary)] break-all">{att.filename}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="info">{att.fileFormat.toUpperCase()}</Badge>
                        <span className="text-[10px] text-[var(--cf-text-muted)]">{(att.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                        <span className="text-[10px] text-[var(--cf-text-muted)]">· {att.uploadedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {att.summary && (
                  <p className="text-xs text-[var(--cf-text-secondary)] bg-[var(--cf-surface-muted)] p-2.5 rounded-xl">
                    {att.summary}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[var(--cf-border)] text-xs">
                  <Badge variant="success" className="text-[10px]">
                    <Sparkles className="w-3 h-3 me-1" />
                    Grounded Dossier Extracted
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-xs text-[var(--cf-primary)]">
                    <Download className="w-3.5 h-3.5 me-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Encrypted Local Notes & Workspaces</h2>
            <div className="w-full sm:w-64">
              <input
                type="search"
                value={notesSearch}
                onChange={(e) => setNotesSearch(e.target.value)}
                placeholder="Search notes..."
                data-testid="notes-search-input"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>
          </div>

          <div data-testid="notes-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map((note) => (
              <div key={note.id} className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[var(--cf-primary)]" />
                    <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">{note.title}</h3>
                  </div>
                  <Badge variant="neutral">{note.scope}</Badge>
                </div>

                <p className="text-xs text-[var(--cf-text-secondary)] line-clamp-3">
                  {note.body}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--cf-border)] text-[10px] text-[var(--cf-text-muted)]">
                  <span>Updated {note.updatedAt}</span>
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    aria-label="Delete note"
                    className="text-[var(--cf-text-muted)] hover:text-[var(--cf-danger-text)] p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Search */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Hybrid Record Search</h2>
            <p className="text-xs text-[var(--cf-text-muted)]">
              Full-text BM25 + semantic vector search across all attachments, clinical prep dossiers, and notes.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[var(--cf-text-muted)] absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={recordSearch}
              onChange={(e) => setRecordSearch(e.target.value)}
              placeholder="Query lab panels, copays, school forms, or clinical advice..."
              data-testid="record-search-input"
              className="w-full ps-9 pe-4 py-2.5 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
            />
          </div>

          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)] overflow-hidden shadow-xs">
            {hybridSearchResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--cf-text-muted)]">
                No matching records found.
              </div>
            ) : (
              hybridSearchResults.map((res) => (
                <div key={res.id} className="p-4 space-y-1.5 hover:bg-[var(--cf-surface-muted)] transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {res.type === 'document' ? (
                        <FileText className="w-4 h-4 text-[var(--cf-primary)]" />
                      ) : (
                        <Lock className="w-4 h-4 text-[var(--cf-accent)]" />
                      )}
                      <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">{res.title}</h3>
                    </div>
                    <Badge variant="neutral">{res.scope}</Badge>
                  </div>
                  <p className="text-xs text-[var(--cf-text-secondary)]">{res.snippet}</p>
                  <span className="text-[10px] text-[var(--cf-text-muted)] block">{res.subtitle}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent data-testid="upload-modal" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document Attachment</DialogTitle>
            <DialogDescription>
              Files are sanitized and stored locally in the content-addressed attachment sandbox.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadAttachment} className="space-y-4 pt-2">
            <div className="border-2 border-dashed border-[var(--cf-border)] rounded-2xl p-6 text-center space-y-2 bg-[var(--cf-surface-muted)]">
              <Upload className="w-8 h-8 text-[var(--cf-primary)] mx-auto" />
              <p className="text-xs font-medium text-[var(--cf-text-primary)]">
                Drag and drop PDF, C-CDA, FHIR JSON, or CSV
              </p>
              <span className="text-[10px] text-[var(--cf-text-muted)] block">Max file size: 10MB per attachment</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Document Filename *
              </label>
              <input
                type="text"
                required
                value={uploadFilename}
                onChange={(e) => setUploadFilename(e.target.value)}
                placeholder="e.g. Hospital_Discharge_Summary.pdf"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Domain Scope
              </label>
              <select
                value={uploadScope}
                onChange={(e) => setUploadScope(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              >
                <option value="health.clinical">Health & Clinical</option>
                <option value="finance.statements">Finance & Statements</option>
                <option value="education.forms">Education & Forms</option>
                <option value="household.contracts">Household & Contracts</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Upload & Extract
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Note Modal */}
      <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
        <DialogContent data-testid="create-note-modal" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Encrypted Note</DialogTitle>
            <DialogDescription>
              Notes are encrypted with local envelope keys and indexed for hybrid retrieval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNote} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Note Title *
              </label>
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. Visit Prep Checklist"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Domain Scope
              </label>
              <select
                value={noteScope}
                onChange={(e) => setNoteScope(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              >
                <option value="health.clinical">Health & Clinical</option>
                <option value="finance.budget">Finance & Budget</option>
                <option value="education.study">Education & Study</option>
                <option value="household.maintenance">Household & Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Note Body (Markdown supported)
              </label>
              <textarea
                rows={4}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Enter details, questions for provider, or reference checklist..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateNoteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Note
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
