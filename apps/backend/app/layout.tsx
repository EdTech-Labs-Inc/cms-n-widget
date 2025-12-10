import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import QueryProvider from "@/lib/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/ToastContainer";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlatformModeProvider } from "@/lib/context/platform-mode-context";
import { getUserAndProfile } from "@/app/auth/actions";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "EdTech Labs - AI-Generated Media Platform",
  description: "Transform articles into engaging multimedia content",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getUserAndProfile();

  // Transform the user and profile into the expected format
  const user = result.profile
    ? {
        id: result.profile.id,
        email: result.profile.email,
        fullName: result.profile.fullName,
        isAdmin: result.profile.isAdmin,
      }
    : null;

  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className}`}>
        <QueryProvider>
          <ToastProvider>
            <PlatformModeProvider>
              <DashboardLayout user={user}>{children}</DashboardLayout>
            </PlatformModeProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
