/**
 * Organization and Profile types
 */

// ============================================
// ENUMS
// ============================================

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

// ============================================
// ORGANIZATION
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  joinCode: string; // 8-char code for joining
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ============================================
// PROFILE
// ============================================

export interface Profile {
  id: string; // Supabase auth.users.id
  fullName?: string | null;
  email: string;
  isAdmin: boolean;
  accessGrantedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ============================================
// ORGANIZATION MEMBER
// ============================================

export interface OrganizationMember {
  id: string;
  organizationId: string;
  organization?: Organization;
  profileId: string;
  profile?: Profile;
  role: MemberRole;
  joinedAt: string | Date;
}

// ============================================
// ORGANIZATION INVITE
// ============================================

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  organization?: Organization;
  token: string; // UUID for invite link
  email?: string | null; // Optional: specific email
  createdBy: string; // ProfileId of admin who created
  expiresAt: string | Date;
  createdAt: string | Date;
}

// ============================================
// JOIN REQUEST
// ============================================

export interface JoinRequest {
  id: string;
  organizationId: string;
  organization?: Organization;
  profileId: string;
  profile?: Profile;
  status: RequestStatus;
  requestedAt: string | Date;
  reviewedAt?: string | Date | null;
  reviewedBy?: string | null; // ProfileId of admin who approved/denied
}
