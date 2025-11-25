import { redirect } from 'next/navigation';
import { getUser } from '@/app/auth/actions';
import { profileService } from '@/lib/services/profile.service';
import { AlertCircle, Clock } from 'lucide-react';
import { signOut } from '@/app/auth/actions';

async function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
      >
        Sign Out
      </button>
    </form>
  );
}

export default async function UnapprovedPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Upsert profile to ensure it exists
  const profile = await profileService.upsertProfile(user);

  // If user has access, redirect to home
  if (profile.accessGrantedAt) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-navy-darker flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-navy-dark border border-yellow-500/30 rounded-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-yellow-900/30 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text-primary text-center mb-4">
            Account Pending Approval
          </h1>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200/90">
                <p className="mb-2">
                  Your account is currently awaiting approval from an administrator.
                </p>
                <p>
                  You'll receive access once your account has been reviewed and approved.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-text-muted">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
              <p>
                <span className="text-text-primary font-medium">Account:</span>{' '}
                {user.email}
              </p>
            </div>
            {profile.fullName && (
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <p>
                  <span className="text-text-primary font-medium">Name:</span>{' '}
                  {profile.fullName}
                </p>
              </div>
            )}
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
              <p>
                <span className="text-text-primary font-medium">Status:</span>{' '}
                Pending approval
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-xs text-text-muted mb-4">
                Need help? Contact your administrator.
              </p>
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
