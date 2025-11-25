import { prisma } from "@/lib/config/database";
import type { User } from "@supabase/supabase-js";
import { MemberRole } from "@prisma/client";

// Generate random 8-character join code
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate URL-friendly slug from organization name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export const profileService = {
  /**
   * Upsert a user profile from Supabase auth user
   * This should be called whenever we access user data
   */
  async upsertProfile(user: User) {
    if (!user.email) {
      throw new Error("User email is required");
    }

    const attrs = {
      fullName:
        user.user_metadata?.full_name || user.email?.split("@")[0] || null,
      email: user.email,
    };

    return await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        ...attrs,
      },
      create: {
        id: user.id,
        ...attrs,
      },
    });
  },

  /**
   * Get a profile by ID
   */
  async getProfile(userId: string) {
    return await prisma.profile.findUnique({
      where: { id: userId },
    });
  },

  /**
   * Get all profiles, ordered by newest first
   */
  async getAllProfiles() {
    return await prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Approve a user profile (grant access)
   */
  async approveProfile(userId: string) {
    return await prisma.profile.update({
      where: { id: userId },
      data: { accessGrantedAt: new Date() },
    });
  },

  /**
   * Disable a user profile (revoke access by setting accessGrantedAt to null)
   */
  async disableProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.isAdmin) {
      throw new Error("Cannot disable admin users. Please contact edeo.");
    }

    return await prisma.profile.update({
      where: { id: userId },
      data: { accessGrantedAt: null },
    });
  },

  /**
   * Check if a user is an admin
   */
  async isAdmin(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    return profile?.isAdmin || false;
  },

  /**
   * Check if a user has been granted access
   */
  async hasAccess(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { accessGrantedAt: true },
    });
    return profile?.accessGrantedAt !== null;
  },

  /**
   * @deprecated Use hasAccess() instead
   */
  async isApproved(userId: string) {
    return this.hasAccess(userId);
  },

  // ============================================
  // ORGANIZATION MANAGEMENT METHODS
  // ============================================

  /**
   * Create a new organization
   * The creator automatically becomes the OWNER
   *
   * @param userId - Profile ID of the creator
   * @param name - Organization name
   * @returns Created organization with membership
   */
  async createOrganization(userId: string, name: string) {
    // Check if user already belongs to an organization
    const existingMembership = await prisma.organizationMember.findUnique({
      where: { profileId: userId },
    });

    if (existingMembership) {
      throw new Error("User already belongs to an organization");
    }

    // Generate unique slug (add number suffix if collision)
    let slug = generateSlug(name);
    let counter = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${generateSlug(name)}-${counter}`;
      counter++;
    }

    // Generate unique join code
    let joinCode = generateJoinCode();
    while (await prisma.organization.findUnique({ where: { joinCode } })) {
      joinCode = generateJoinCode();
    }

    // Create organization and add creator as OWNER in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          joinCode,
        },
      });

      const membership = await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          profileId: userId,
          role: "OWNER",
        },
      });

      return { organization: org, membership };
    });

    return result;
  },

  /**
   * Get user's organization (if they belong to one)
   * @param userId - Profile ID
   * @returns Organization or null
   */
  async getUserOrganization(userId: string) {
    const membership = await prisma.organizationMember.findUnique({
      where: { profileId: userId },
      include: { organization: true },
    });

    return membership?.organization ?? null;
  },

  /**
   * Add a member to an organization
   * @param orgId - Organization ID
   * @param profileId - Profile ID to add
   * @param role - Member role (defaults to MEMBER)
   * @returns Created membership
   */
  async addMemberToOrg(
    orgId: string,
    profileId: string,
    role: MemberRole = "MEMBER"
  ) {
    // Check if user already belongs to an organization
    const existingMembership = await prisma.organizationMember.findUnique({
      where: { profileId },
    });

    if (existingMembership) {
      throw new Error("User already belongs to an organization");
    }

    return await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        profileId,
        role,
      },
    });
  },

  /**
   * Remove a member from an organization
   * @param orgId - Organization ID
   * @param profileId - Profile ID to remove
   */
  async removeMemberFromOrg(orgId: string, profileId: string) {
    const membership = await prisma.organizationMember.findUnique({
      where: { profileId },
    });

    if (!membership || membership.organizationId !== orgId) {
      throw new Error("User is not a member of this organization");
    }

    if (membership.role === "OWNER") {
      throw new Error("Cannot remove the owner. Transfer ownership first.");
    }

    await prisma.organizationMember.delete({
      where: { profileId },
    });
  },

  /**
   * Update a member's role
   * @param orgId - Organization ID
   * @param profileId - Profile ID
   * @param newRole - New role
   */
  async updateMemberRole(
    orgId: string,
    profileId: string,
    newRole: MemberRole
  ) {
    const membership = await prisma.organizationMember.findUnique({
      where: { profileId },
    });

    if (!membership || membership.organizationId !== orgId) {
      throw new Error("User is not a member of this organization");
    }

    // Prevent demoting the last owner
    if (membership.role === "OWNER" && newRole !== "OWNER") {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId: orgId,
          role: "OWNER",
        },
      });

      if (ownerCount <= 1) {
        throw new Error("Cannot demote the last owner");
      }
    }

    return await prisma.organizationMember.update({
      where: { profileId },
      data: { role: newRole },
    });
  },

  /**
   * Leave an organization
   * User cannot leave if they are the owner
   *
   * @param userId - Profile ID
   */
  async leaveOrganization(userId: string) {
    const membership = await prisma.organizationMember.findUnique({
      where: { profileId: userId },
    });

    if (!membership) {
      throw new Error("User is not a member of any organization");
    }

    if (membership.role === "OWNER") {
      throw new Error("Owner cannot leave. Transfer ownership or delete the organization.");
    }

    await prisma.organizationMember.delete({
      where: { profileId: userId },
    });
  },

  /**
   * Transfer organization ownership
   * @param orgId - Organization ID
   * @param currentOwnerId - Current owner's profile ID
   * @param newOwnerId - New owner's profile ID
   */
  async transferOwnership(
    orgId: string,
    currentOwnerId: string,
    newOwnerId: string
  ) {
    const [currentOwner, newOwner] = await Promise.all([
      prisma.organizationMember.findUnique({ where: { profileId: currentOwnerId } }),
      prisma.organizationMember.findUnique({ where: { profileId: newOwnerId } }),
    ]);

    if (!currentOwner || currentOwner.organizationId !== orgId) {
      throw new Error("Current user is not a member of this organization");
    }

    if (currentOwner.role !== "OWNER") {
      throw new Error("Only the owner can transfer ownership");
    }

    if (!newOwner || newOwner.organizationId !== orgId) {
      throw new Error("New owner is not a member of this organization");
    }

    // Transfer ownership in transaction
    await prisma.$transaction([
      prisma.organizationMember.update({
        where: { profileId: currentOwnerId },
        data: { role: "ADMIN" },
      }),
      prisma.organizationMember.update({
        where: { profileId: newOwnerId },
        data: { role: "OWNER" },
      }),
    ]);
  },

  /**
   * Delete an organization
   * Only the owner can delete the organization
   * This will cascade delete all related data
   *
   * @param orgId - Organization ID
   * @param ownerId - Owner's profile ID
   */
  async deleteOrganization(orgId: string, ownerId: string) {
    const membership = await prisma.organizationMember.findUnique({
      where: { profileId: ownerId },
    });

    if (!membership || membership.organizationId !== orgId) {
      throw new Error("User is not a member of this organization");
    }

    if (membership.role !== "OWNER") {
      throw new Error("Only the owner can delete the organization");
    }

    // Prisma will handle cascade deletion of members, articles, tags, etc.
    await prisma.organization.delete({
      where: { id: orgId },
    });
  },
};
