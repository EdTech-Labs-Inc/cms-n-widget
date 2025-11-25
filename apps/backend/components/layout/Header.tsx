import { getUser, getUserAndProfile } from "@/app/auth/actions";
import { UserMenu } from "@/components/auth/UserMenu";
import Link from "next/link";

export async function Header() {
  const result = await getUserAndProfile();

  if (!result) {
    return null;
  }

  return (
    <header className="bg-transparent border-b-0">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center relative">
        <span className="text-2xl font-bold text-text-primary tracking-tight">
          EdTech Labs
        </span>
        <Link
          href="/"
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white-10 absolute left-1/2 -translate-x-1/2"
        >
          Home
        </Link>
        <UserMenu user={{ email: result.user?.email || "", fullName: result.profile?.fullName || null }} />
      </div>
    </header>
  );
}
