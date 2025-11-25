import { redirect } from 'next/navigation';
import { getUser } from '@/app/auth/actions';
import { profileService } from '@/lib/services/profile.service';
import { AdminProfileList } from '@/components/admin/AdminProfileList';

export default async function AdminPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Upsert profile to ensure it exists
  await profileService.upsertProfile(user);

  // Check if user is admin
  const isAdmin = await profileService.isAdmin(user.id);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-navy-darker flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-muted">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-darker py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">User Management</h1>
        <AdminProfileList />
      </div>
    </div>
  );
}
