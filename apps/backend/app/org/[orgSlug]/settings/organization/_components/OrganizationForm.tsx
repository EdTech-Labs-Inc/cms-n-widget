'use client';

import { useState } from 'react';
import { Building2, Users, Mail, Shield, Copy, RefreshCw, Trash2, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Organization, OrganizationMember, JoinRequest, OrganizationInvite, Profile } from '@prisma/client';

interface OrganizationFormProps {
  organization: Organization;
  members: (OrganizationMember & { profile: Pick<Profile, 'id' | 'email' | 'fullName'> })[];
  joinRequests: (JoinRequest & { profile: Pick<Profile, 'id' | 'email' | 'fullName'> })[];
  invitations: OrganizationInvite[];
}

export function OrganizationForm({ organization, members, joinRequests, invitations }: OrganizationFormProps) {
  const [orgName, setOrgName] = useState(organization.name);
  const [joinCode, setJoinCode] = useState(organization.joinCode);
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [localJoinRequests, setLocalJoinRequests] = useState(joinRequests);

  const handleCopyJoinCode = async () => {
    await navigator.clipboard.writeText(joinCode);
    setCopiedJoinCode(true);
    setTimeout(() => setCopiedJoinCode(false), 2000);
  };

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      const response = await fetch(`/api/join-requests/${requestId}/approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      // Optimistically remove from UI
      setLocalJoinRequests(prev => prev.filter(req => req.id !== requestId));

      // Show success message (optional - could use toast)
      console.log('Join request approved successfully');

      // Refresh the page to update members list
      window.location.reload();
    } catch (error) {
      console.error('Error approving request:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve request');
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      const response = await fetch(`/api/join-requests/${requestId}/deny`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deny request');
      }

      // Optimistically remove from UI
      setLocalJoinRequests(prev => prev.filter(req => req.id !== requestId));

      // Show success message (optional - could use toast)
      console.log('Join request denied successfully');
    } catch (error) {
      console.error('Error denying request:', error);
      alert(error instanceof Error ? error.message : 'Failed to deny request');
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-gradient-gold text-navy-primary';
      case 'ADMIN':
        return 'bg-gradient-purple text-white';
      case 'MEMBER':
        return 'bg-gray-500/20 text-text-secondary';
      default:
        return 'bg-gray-500/20 text-text-secondary';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Organization Settings</h1>
        <p className="text-text-secondary">Manage your organization details, members, and invitations</p>
      </div>

      <div className="space-y-6">
        {/* Organization Details */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-blue rounded-2xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Organization Details</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Organization Name</label>
              <input
                type="text"
                className="input w-full"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled
              />
              <p className="text-xs text-text-muted mt-1">Admins can edit the organization name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Organization Slug</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={organization.slug}
                  disabled
                />
              </div>
              <p className="text-xs text-text-muted mt-1">Used in URLs to identify your organization</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Join Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={joinCode}
                  disabled
                />
                <button
                  className="btn btn-secondary inline-flex items-center gap-2"
                  onClick={handleCopyJoinCode}
                >
                  <Copy className="w-4 h-4" />
                  {copiedJoinCode ? 'Copied!' : 'Copy'}
                </button>
                <button className="btn btn-secondary inline-flex items-center gap-2" disabled>
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1">Share this code for users to request to join your organization</p>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-purple rounded-2xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary">Members ({members.length})</h2>
            </div>
          </div>

          <div className="space-y-3">
            {members.length > 0 ? (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-blue rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {member.profile.fullName?.[0]?.toUpperCase() || member.profile.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-text-primary font-medium">{member.profile.fullName || 'Unknown'}</p>
                      <p className="text-text-muted text-sm">{member.profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                    <button className="text-text-muted hover:text-red-500 transition-colors" disabled>
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-text-muted text-sm">No members found</p>
            )}
          </div>
        </div>

        {/* Pending Join Requests (Admin+) */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-gold rounded-2xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-navy-primary" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Pending Join Requests ({localJoinRequests.length})</h2>
          </div>

          <div className="space-y-3">
            {localJoinRequests.length > 0 ? (
              localJoinRequests.map((request) => {
                const isProcessing = processingRequests.has(request.id);
                return (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl border border-purple-accent/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-purple rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {request.profile.fullName?.[0]?.toUpperCase() || request.profile.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-text-primary font-medium">{request.profile.fullName || 'Unknown'}</p>
                        <p className="text-text-muted text-sm">{request.profile.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-text-muted" />
                          <p className="text-xs text-text-muted">
                            Requested {formatDate(request.requestedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-primary inline-flex items-center gap-2"
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isProcessing ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        className="btn bg-red-500/20 text-red-500 hover:bg-red-500/30 inline-flex items-center gap-2"
                        onClick={() => handleDenyRequest(request.id)}
                        disabled={isProcessing}
                      >
                        <XCircle className="w-4 h-4" />
                        {isProcessing ? 'Denying...' : 'Deny'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                <p className="text-text-muted text-sm">No pending requests</p>
                <p className="text-xs text-text-secondary">
                  Approve or deny requests from users who want to join your organization.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Invitations (Admin+) */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-blue rounded-2xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary">Invitations ({invitations.length})</h2>
            </div>
            <button className="btn btn-primary inline-flex items-center gap-2" disabled>
              <UserPlus className="w-4 h-4" />
              Create Invite
            </button>
          </div>

          <div className="space-y-3">
            {invitations.length > 0 ? (
              invitations.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {invite.email ? (
                        <>
                          <Mail className="w-4 h-4 text-purple-accent" />
                          <p className="text-text-primary font-medium">{invite.email}</p>
                        </>
                      ) : (
                        <p className="text-text-primary font-medium">Open Invite</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>Token: {invite.token.slice(0, 8)}...</span>
                      <span>Expires: {formatDate(invite.expiresAt)}</span>
                      <span>Created: {formatDate(invite.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-secondary inline-flex items-center gap-2" disabled>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </button>
                    <button className="btn bg-red-500/20 text-red-500 hover:bg-red-500/30" disabled>
                      Revoke
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <>
                <p className="text-text-muted text-sm">No active invitations</p>
                <p className="text-xs text-text-secondary">
                  Create invite links with optional email restrictions. View and revoke active invitations.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Danger Zone (Owner only) */}
        <div className="card p-6 border-2 border-red-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-2xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-text-primary mb-2">Delete Organization</h3>
              <p className="text-text-secondary text-sm mb-4">
                Permanently delete this organization and all associated content. This action cannot be undone.
              </p>
              <button className="btn bg-red-500/20 text-red-500 hover:bg-red-500/30" disabled>
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Note */}
      <div className="mt-8 p-4 bg-blue-accent/10 border border-blue-accent/20 rounded-xl">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">Note:</strong> This page structure is complete.
          Full functionality will be implemented when the organization management APIs are created in Phase 8.
        </p>
      </div>
    </div>
  );
}
