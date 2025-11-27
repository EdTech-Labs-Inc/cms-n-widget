/**
 * API Route Authentication Utilities
 *
 * These utilities are for use in API routes (route.ts files).
 * Do NOT use Server Actions in API routes - use these helpers instead.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Get the authenticated user in an API route
 * Returns the user object or null if not authenticated
 */
export async function getApiUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('[Auth] Error getting user:', error);
    return null;
  }

  return user;
}

/**
 * Require authentication in an API route
 * Returns the user object or a 401 response
 *
 * Usage:
 * const userOrResponse = await requireAuth();
 * if (userOrResponse instanceof NextResponse) return userOrResponse;
 * const user = userOrResponse;
 */
export async function requireAuth() {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return user;
}
