"use server";

import { profileService } from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getUserAndProfile() {
  const user = await getUser();

  if (!user) {
    return { user, profile: null };
  }

  const profile = await profileService.upsertProfile(user);
  return { user, profile };
}

export type UserAndProfile = Awaited<ReturnType<typeof getUserAndProfile>>;

/**
 * Get user with profile and organization info
 */
export async function getUserWithOrg() {
  const user = await getUser();

  if (!user) {
    return { user: null, profile: null, organization: null };
  }

  const profile = await profileService.upsertProfile(user);
  const organization = await profileService.getUserOrganization(user.id);

  return { user, profile, organization };
}

export type UserWithOrg = Awaited<ReturnType<typeof getUserWithOrg>>;
