import { redirect } from 'next/navigation';

export default async function OrgCreatePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  // Redirect to the org-scoped articles/new page
  redirect(`/org/${orgSlug}/articles/new`);
}
