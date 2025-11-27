import { redirect } from 'next/navigation';
import { getUserAndProfile } from '@/app/auth/actions';
import { profileService } from '@/lib/services/profile.service';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getUserAndProfile();

  if (result.profile) {
    const userOrg = await profileService.getUserOrganization(result.profile.id);
    if (userOrg) {
      redirect(`/org/${userOrg.slug}/submissions/${id}`);
    }
  }

  redirect('/login');
}
