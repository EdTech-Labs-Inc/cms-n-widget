import { getCurrentOrg } from '@/lib/context/org-context';
import { redirect } from 'next/navigation';

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  try {
    // Validate org exists (context helper handles this)
    const org = await getCurrentOrg(orgSlug);

    return (
      <div className="org-layout">
        {children}
      </div>
    );
  } catch (error) {
    // Org not found or access denied
    redirect('/onboarding');
  }
}
