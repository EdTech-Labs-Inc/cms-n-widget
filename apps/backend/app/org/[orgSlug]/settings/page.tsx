import { getUserAndProfile } from '@/app/auth/actions';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import Link from 'next/link';

export default async function OrgSettingsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const { user, profile } = await getUserAndProfile();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-6">
          <p className="text-text-muted">Please log in to view settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">User Settings</h1>
        <p className="text-text-secondary">Manage your account preferences</p>
      </div>

      {/* Account Information */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Account Information</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-blue rounded-2xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-text-muted text-sm">Name</p>
              <p className="text-text-primary font-medium">{profile?.fullName || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-purple rounded-2xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-text-muted text-sm">Email</p>
              <p className="text-text-primary font-medium">{user.email}</p>
            </div>
          </div>

          {profile?.isAdmin && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-gold rounded-2xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-navy-primary" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Role</p>
                <p className="text-text-primary font-medium">Platform Administrator</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Organization Settings Link */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Organization</h2>
        <p className="text-text-secondary mb-4">
          Manage organization details, members, and invitations
        </p>
        <Link
          href={`/org/${orgSlug}/settings/organization`}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Organization Settings
        </Link>
      </div>

      {/* Leave Organization */}
      <div className="card p-6 border-2 border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-2xl flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-500">Leave Organization</h2>
        </div>

        <p className="text-text-secondary mb-4">
          Leave this organization and lose access to all content. You'll be redirected to the onboarding page to create or join another organization.
        </p>

        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Warning:</strong> This action will remove you from the organization.
            If you're the only owner, you must transfer ownership before leaving.
          </p>
        </div>

        <button className="btn bg-red-500/20 text-red-500 hover:bg-red-500/30" disabled>
          Leave Organization
        </button>
        <p className="text-xs text-text-muted mt-2">
          This functionality will be enabled once organization management APIs are implemented.
        </p>
      </div>

      {/* Placeholder for future settings */}
      <div className="card p-6 mt-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">More Settings</h2>
        <p className="text-text-muted text-sm">Additional settings will be available soon.</p>
      </div>
    </div>
  );
}
