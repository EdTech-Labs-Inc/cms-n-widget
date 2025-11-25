import { getUserAndProfile } from '@/app/auth/actions';
import { User, Mail, Shield } from 'lucide-react';

export default async function SettingsPage() {
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
        <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
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
                <p className="text-text-primary font-medium">Administrator</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Placeholder for future settings */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">More Settings</h2>
        <p className="text-text-muted text-sm">Additional settings will be available soon.</p>
      </div>
    </div>
  );
}
