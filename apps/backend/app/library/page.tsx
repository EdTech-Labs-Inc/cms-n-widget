import { redirect } from 'next/navigation';
import { getUserAndProfile } from '@/app/auth/actions';
import { profileService } from '@/lib/services/profile.service';

export default async function LibraryPage() {
  const result = await getUserAndProfile();

  if (result.profile) {
    const userOrg = await profileService.getUserOrganization(result.profile.id);
    if (userOrg) {
      redirect(`/org/${userOrg.slug}/library`);
    }
  }

  redirect('/login');
}
