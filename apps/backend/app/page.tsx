import { getUserAndProfile } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";
import { profileService } from "@/lib/services/profile.service";

export default async function HomePage() {
  // Check if user is authenticated
  const result = await getUserAndProfile();

  // If user is authenticated, redirect to their org dashboard
  if (result.profile) {
    const userOrg = await profileService.getUserOrganization(result.profile.id);

    if (userOrg) {
      redirect(`/org/${userOrg.slug}/dashboard`);
    } else {
      redirect('/onboarding');
    }
  }

  // If not authenticated, show landing page
  return <LandingPage />;
}
