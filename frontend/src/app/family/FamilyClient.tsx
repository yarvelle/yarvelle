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
import { Plus, Eye, Printer, Shield, Key, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  type HouseholdProfile,
  type ViewerInvite,
  loadHouseholdProfiles,
  fetchHouseholdProfiles,
  revokeViewerInvite,
  HOUSEHOLD_PROFILES_CHANGED_EVENT,
} from '@/lib/familyProfiles';
import {
  MemberCard,
  RoleMatrixTable,
  ViewerInviteModal,
  ShareBundleModal,
  ProfileEditModal,
  type ShareBundleRecord,
} from '@/components/family';

export function FamilyClient({
  initialProfiles,
}: {
  initialProfiles?: HouseholdProfile[];
} = {}) {
  const [profiles, setProfiles] = useState<HouseholdProfile[]>(
    () => initialProfiles || loadHouseholdProfiles()
  );
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<HouseholdProfile | null>(null);

  // Active invitations
  const [invitations, setInvitations] = useState<ViewerInvite[]>([]);

  // Exported share bundles history
  const [shareBundles, setShareBundles] = useState<ShareBundleRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    // Load from cache
    setProfiles(loadHouseholdProfiles());

    try {
      const storedInvites = localStorage.getItem('yarvelle_viewer_invitations');
      if (storedInvites) {
        const parsed = JSON.parse(storedInvites);
        if (Array.isArray(parsed)) setInvitations(parsed);
      }
    } catch {}

    try {
      const storedBundles = localStorage.getItem('yarvelle_share_bundles');
      if (storedBundles) {
        const parsed = JSON.parse(storedBundles);
        if (Array.isArray(parsed)) setShareBundles(parsed);
      }
    } catch {}

    const handleProfilesChanged = () => setProfiles(loadHouseholdProfiles());
    window.addEventListener(HOUSEHOLD_PROFILES_CHANGED_EVENT, handleProfilesChanged);

    return () => {
      isMounted = false;
      window.removeEventListener(HOUSEHOLD_PROFILES_CHANGED_EVENT, handleProfilesChanged);
    };
  }, []);

  const handleInviteCreated = (newInvite: ViewerInvite) => {
    setInvitations((prev) => [newInvite, ...prev.filter((i) => i.id !== newInvite.id)]);
  };

  const handleRevokeInvite = (id: string) => {
    const invite = invitations.find((i) => i.id === id);
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    if (invite) {
      revokeViewerInvite(invite.targetProfileId, invite.id).catch(() => {});
    }
  };

  const handleBundleExported = (newBundle: ShareBundleRecord) => {
    setShareBundles((prev) => [newBundle, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header Breadcrumbs & Action Cluster */}
      <div className="space-y-4">
        <nav aria-label="Breadcrumb" className="text-xs text-[var(--cf-text-muted)] flex items-center gap-1.5">
          <span>Household</span>
          <span>/</span>
          <span className="text-[var(--cf-text-primary)] font-medium">Family & Permissions</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              Family & Permissions
            </h1>
            <p className="text-xs text-[var(--cf-text-muted)] mt-1 max-w-2xl leading-relaxed">
              Household member profiles, cross-domain role matrix governance, guest viewer invites, and printable care packs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              data-testid="add-member-btn"
              onClick={() =>
                setEditingProfile({
                  id: '',
                  name: '',
                  relationship: 'Family Member',
                  role: 'guardian',
                  colorSlot: (((profiles.length % 5) + 1) as any),
                  stats: { chats: 0, items: 0 },
                })
              }
            >
              <Plus className="w-3.5 h-3.5 me-1" />
              Add Member
            </Button>

            <Button
              variant="secondary"
              size="sm"
              data-testid="invite-viewer-btn"
              onClick={() => setInviteModalOpen(true)}
            >
              <Eye className="w-3.5 h-3.5 me-1" />
              Invite Viewer
            </Button>

            <Button
              variant="secondary"
              size="sm"
              data-testid="export-bundle-btn"
              onClick={() => setShareModalOpen(true)}
            >
              <Printer className="w-3.5 h-3.5 me-1" />
              Export Bundle
            </Button>
          </div>
        </div>
      </div>

      {/* Household Members Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Household Members</h2>
          <span className="text-xs text-[var(--cf-text-muted)]">{profiles.length} profiles</span>
        </div>

        <div
          data-testid="members-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {profiles.map((profile) => (
            <MemberCard
              key={profile.id}
              profile={profile}
              onEdit={(p) => setEditingProfile(p)}
            />
          ))}
        </div>
      </div>

      {/* Multi-Domain Role Matrix Section */}
      <RoleMatrixTable profiles={profiles} />

      {/* Active Viewer Invitations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Active Guest Viewer Invitations</h2>
          <span className="text-xs text-[var(--cf-text-muted)]">{invitations.length} active</span>
        </div>

        <div
          data-testid="invitations-list"
          className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)] overflow-hidden shadow-xs"
        >
          {invitations.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--cf-text-muted)]">
              No active viewer invitations. Use "Invite Viewer" above to grant temporary read-only access.
            </div>
          ) : (
            invitations.map((inv) => (
              <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--cf-surface-muted)] transition">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">{inv.inviteeName}</h3>
                    <Badge variant="neutral">Target: {inv.targetProfileName}</Badge>
                    <span className="font-mono text-[10px] text-[var(--cf-primary)] font-bold">{inv.inviteCode}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[var(--cf-text-muted)]">Expires in {inv.expiresInDays} days</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeInvite(inv.id)}
                  data-testid={`revoke-invite-${inv.id}`}
                  className="text-xs text-[var(--cf-danger-text)] hover:text-[var(--cf-danger-text)] self-end sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5 me-1" />
                  Revoke
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Exported Share Bundles History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Past Exported Packets</h2>
          <span className="text-xs text-[var(--cf-text-muted)]">{shareBundles.length} records</span>
        </div>

        <div
          data-testid="bundles-list"
          className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)] overflow-hidden shadow-xs"
        >
          {shareBundles.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--cf-text-muted)]">
              No exported bundles yet. Click "Export Bundle" to compile and print formatted packets.
            </div>
          ) : (
            shareBundles.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[var(--cf-surface-muted)] transition">
                <div>
                  <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">{b.title}</h3>
                  <span className="text-[10px] text-[var(--cf-text-muted)]">Exported for {b.profileName} on {b.exportedAt}</span>
                </div>
                <Badge variant="success">Printed</Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Local Privacy Reassurance Card */}
      <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface-muted)] p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-[var(--cf-primary)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--cf-text-muted)] leading-relaxed">
          <strong>Data Sovereignty & Local Isolation:</strong> Profile configurations and permissions are stored strictly inside your local browser vault. No family demographic data, relationship maps, or minors' information is transmitted to third-party telemetric endpoints.
        </p>
      </div>

      {/* Modals */}
      <ViewerInviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        profiles={profiles}
        onInviteCreated={handleInviteCreated}
      />

      <ShareBundleModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        profiles={profiles}
        onBundleExported={handleBundleExported}
      />

      {editingProfile && (
        <ProfileEditModal
          isOpen={Boolean(editingProfile)}
          onClose={() => setEditingProfile(null)}
          profile={editingProfile}
          onSaved={() => {
            setProfiles(loadHouseholdProfiles());
            setEditingProfile(null);
          }}
        />
      )}
    </div>
  );
}
