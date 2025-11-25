"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function JoinTokenPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuthAndInvite = async () => {
      try {
        // Get user info
        const userResponse = await fetch("/api/auth/user-with-org");
        if (!userResponse.ok) {
          // Not logged in, redirect to login with return URL
          router.push(`/login?redirect=/join/${token}`);
          return;
        }

        const userData = await userResponse.json();

        if (userData.organization) {
          // User already belongs to an organization
          setError("You already belong to an organization");
          setLoading(false);
          return;
        }

        // Auto-redeem the token
        setRedeeming(true);
        const response = await fetch("/api/join/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to redeem invite");
        }

        // Successfully created join request
        setInvite(data.joinRequest);

        // Redirect to pending approval page
        setTimeout(() => {
          router.push("/onboarding/pending");
        }, 2000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRedeeming(false);
      }
    };

    if (token) {
      checkAuthAndInvite();
    }
  }, [token, router]);

  if (loading || redeeming) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {redeeming ? "Processing invitation..." : "Checking invitation..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Invalid Invitation
            </h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/onboarding")}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← Back to onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Request Submitted!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your request to join{" "}
              <span className="font-medium">{invite.organization.name}</span>{" "}
              has been submitted.
            </p>
          </div>

          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">
                An administrator will review your request. You'll be redirected
                to the waiting page shortly...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
