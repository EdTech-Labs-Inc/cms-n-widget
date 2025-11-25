"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    // Check if user has been approved
    const checkApprovalStatus = async () => {
      try {
        const response = await fetch("/api/auth/user-with-org");
        if (response.ok) {
          const data = await response.json();

          if (data.organization) {
            // User has been approved! Redirect to their org
            router.push(`/org/${data.organization.slug}/dashboard`);
          } else {
            // Still pending, check their requests
            const requestsResponse = await fetch("/api/user/join-requests");
            if (requestsResponse.ok) {
              const requestsData = await requestsResponse.json();
              if (requestsData.requests && requestsData.requests.length > 0) {
                const pendingRequest = requestsData.requests.find(
                  (r: any) => r.status === "PENDING"
                );
                if (pendingRequest) {
                  setOrganization(pendingRequest.organization);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking approval status:", error);
      } finally {
        setChecking(false);
      }
    };

    checkApprovalStatus();

    // Poll every 30 seconds to check if approved
    const interval = setInterval(checkApprovalStatus, 30000);

    return () => clearInterval(interval);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-accent mx-auto"></div>
          <p className="mt-4 text-text-secondary">Checking status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-warning/20">
            <svg
              className="h-8 w-8 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-text-primary">
            Pending Approval
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Your request to join
            {organization && (
              <span className="font-medium text-text-primary"> {organization.name}</span>
            )}{" "}
            is awaiting approval from an administrator.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 sm:rounded-xl sm:px-10">
          <div className="space-y-4">
            <div className="bg-purple-light border border-purple-accent/30 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-purple-vibrant"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-purple-vibrant">
                    What happens next?
                  </h3>
                  <div className="mt-2 text-sm text-text-secondary">
                    <ul className="list-disc list-inside space-y-1">
                      <li>An administrator will review your request</li>
                      <li>You'll receive access once approved</li>
                      <li>This page will update automatically</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => router.push("/onboarding")}
                className="text-sm text-purple-accent hover:text-purple-vibrant transition-colors"
              >
                ← Back to onboarding
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                Refresh status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
