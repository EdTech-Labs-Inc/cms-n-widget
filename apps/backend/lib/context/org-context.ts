/**
 * Organization Context Helpers
 *
 * Utilities for managing organization context in the application.
 * These functions help with org-scoped routing, validation, and access control.
 */

import { prisma } from '@repo/database';
import { MemberRole, Organization, OrganizationMember } from '@prisma/client';

/**
 * Get organization by slug
 * @param slug - Organization slug (URL-friendly identifier)
 * @returns Organization or null if not found
 */
export async function getOrgFromSlug(
  slug: string
): Promise<Organization | null> {
  return await prisma.organization.findUnique({
    where: { slug },
  });
}

/**
 * Get organization with members
 * @param slug - Organization slug
 * @returns Organization with members or null
 */
export async function getOrgWithMembers(slug: string) {
  return await prisma.organization.findUnique({
    where: { slug },
    include: {
      members: {
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
      },
    },
  });
}

/**
 * Get current organization from slug (throws if not found)
 * Use this in API routes where org existence is required
 *
 * @param orgSlug - Organization slug from URL params
 * @returns Organization
 * @throws Error if organization not found
 */
export async function getCurrentOrg(orgSlug: string): Promise<Organization> {
  const org = await getOrgFromSlug(orgSlug);

  if (!org) {
    throw new Error(`Organization not found: ${orgSlug}`);
  }

  return org;
}

/**
 * Get user's organization membership
 * @param userId - Profile ID
 * @returns OrganizationMember with organization, or null if not a member of any org
 */
export async function getUserOrgMembership(
  userId: string
): Promise<(OrganizationMember & { organization: Organization }) | null> {
  return await prisma.organizationMember.findUnique({
    where: { profileId: userId },
    include: { organization: true },
  });
}

/**
 * Validate that a user has access to an organization
 * @param userId - Profile ID
 * @param orgSlug - Organization slug
 * @param minRole - Minimum required role (optional)
 * @returns true if user has access, false otherwise
 */
export async function validateOrgAccess(
  userId: string,
  orgSlug: string,
  minRole?: MemberRole
): Promise<boolean> {
  const org = await getOrgFromSlug(orgSlug);
  if (!org) {
    return false;
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { profileId: userId },
  });

  if (!membership || membership.organizationId !== org.id) {
    return false;
  }

  // If no minimum role specified, just check membership
  if (!minRole) {
    return true;
  }

  // Check role hierarchy: OWNER > ADMIN > MEMBER
  return hasMinimumRole(membership.role, minRole);
}

/**
 * Get user's role in an organization
 * @param userId - Profile ID
 * @param orgId - Organization ID
 * @returns MemberRole or null if not a member
 */
export async function getUserRole(
  userId: string,
  orgId: string
): Promise<MemberRole | null> {
  const membership = await prisma.organizationMember.findUnique({
    where: { profileId: userId },
  });

  if (!membership || membership.organizationId !== orgId) {
    return null;
  }

  return membership.role;
}

/**
 * Check if user has minimum required role
 * Role hierarchy: OWNER > ADMIN > MEMBER
 *
 * @param userRole - User's current role
 * @param requiredRole - Required minimum role
 * @returns true if user meets or exceeds required role
 */
export function hasMinimumRole(
  userRole: MemberRole,
  requiredRole: MemberRole
): boolean {
  const roleHierarchy: Record<MemberRole, number> = {
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user is admin or owner of an organization
 * @param userId - Profile ID
 * @param orgId - Organization ID
 * @returns true if user is ADMIN or OWNER
 */
export async function isOrgAdmin(
  userId: string,
  orgId: string
): Promise<boolean> {
  const role = await getUserRole(userId, orgId);
  return role === 'ADMIN' || role === 'OWNER';
}

/**
 * Check if user is owner of an organization
 * @param userId - Profile ID
 * @param orgId - Organization ID
 * @returns true if user is OWNER
 */
export async function isOrgOwner(
  userId: string,
  orgId: string
): Promise<boolean> {
  const role = await getUserRole(userId, orgId);
  return role === 'OWNER';
}

/**
 * Get organization ID from slug (utility function)
 * @param slug - Organization slug
 * @returns Organization ID or null
 */
export async function getOrgIdFromSlug(slug: string): Promise<string | null> {
  const org = await getOrgFromSlug(slug);
  return org?.id ?? null;
}

/**
 * Validate that a resource belongs to an organization
 * Useful for checking if an article, tag, etc. belongs to the current org
 *
 * @param resourceOrgId - The organizationId field from the resource
 * @param expectedOrgSlug - The expected organization slug from the URL
 * @returns true if resource belongs to the organization
 */
export async function validateResourceOrg(
  resourceOrgId: string,
  expectedOrgSlug: string
): Promise<boolean>;

/**
 * Validate that a resource belongs to an organization (by resource type and ID)
 * Looks up the resource in the database and verifies it belongs to the org
 *
 * @param resourceType - Type of resource ('article', 'submission', 'tag', etc.)
 * @param resourceId - ID of the resource
 * @param orgId - Organization ID to validate against
 * @returns true if resource belongs to the organization
 */
export async function validateResourceOrg(
  resourceType: string,
  resourceId: string,
  orgId: string
): Promise<boolean>;

export async function validateResourceOrg(
  arg1: string,
  arg2: string,
  arg3?: string
): Promise<boolean> {
  // Overload 1: (resourceOrgId, expectedOrgSlug)
  if (arg3 === undefined) {
    const resourceOrgId = arg1;
    const expectedOrgSlug = arg2;
    const org = await getOrgFromSlug(expectedOrgSlug);
    return org?.id === resourceOrgId;
  }

  // Overload 2: (resourceType, resourceId, orgId)
  const resourceType = arg1;
  const resourceId = arg2;
  const orgId = arg3;

  try {
    switch (resourceType) {
      case 'article': {
        const article = await prisma.article.findUnique({
          where: { id: resourceId },
          select: { organizationId: true },
        });
        return article?.organizationId === orgId;
      }

      case 'submission': {
        const submission = await prisma.submission.findUnique({
          where: { id: resourceId },
          include: { article: { select: { organizationId: true } } },
        });
        return submission?.article?.organizationId === orgId;
      }

      case 'tag': {
        const tag = await prisma.tag.findUnique({
          where: { id: resourceId },
          select: { organizationId: true },
        });
        return tag?.organizationId === orgId;
      }

      default:
        console.warn(`Unknown resource type: ${resourceType}`);
        return false;
    }
  } catch (error) {
    console.error(`Error validating resource org: ${error}`);
    return false;
  }
}

/**
 * Extract organization slug from request pathname
 * Expects URLs in format: /org/[slug]/...
 *
 * @param pathname - Request pathname
 * @returns Organization slug or null
 */
export function extractOrgSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/org\/([^\/]+)/);
  return match?.[1] ?? null;
}

/**
 * Build organization-scoped URL
 * @param orgSlug - Organization slug
 * @param path - Path within org (e.g., '/dashboard', '/articles')
 * @returns Full org-scoped URL
 */
export function buildOrgUrl(orgSlug: string, path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `/org/${orgSlug}${normalizedPath}`;
}
