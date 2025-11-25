import { getCurrentOrg } from '@/lib/context/org-context';
import { OrganizationForm } from './_components/OrganizationForm';
import { prisma } from '@repo/database';

export default async function OrgOrganizationSettingsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;

  // Fetch organization data
  const organization = await getCurrentOrg(orgSlug);

  // Fetch members with profile data
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: organization.id },
    include: {
      profile: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  });

  // Fetch pending join requests
  const joinRequests = await prisma.joinRequest.findMany({
    where: {
      organizationId: organization.id,
      status: 'PENDING',
    },
    include: {
      profile: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
    orderBy: { requestedAt: 'desc' },
  });

  // Fetch active invitations (not expired)
  const invitations = await prisma.organizationInvite.findMany({
    where: {
      organizationId: organization.id,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <OrganizationForm
      organization={organization}
      members={members}
      joinRequests={joinRequests}
      invitations={invitations}
    />
  );
}
