"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MICROSOFT_GRAPH_SCOPES = [
  "openid", // Required for OpenID Connect
  "offline_access", // Required for refresh tokens
  "User.Read", // Read user profile
  "email", // Access email address
  "profile",
  // 'Mail.Read',        // Read mail
  // 'Mail.ReadWrite',   // Read and write mail
  // 'Mail.Send'         // Send mail
];

const SUPABASE_OAUTH_SCOPES = MICROSOFT_GRAPH_SCOPES.join(",");

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes: SUPABASE_OAUTH_SCOPES,
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-primary">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Admin Login
          </h1>
          <p className="text-text-secondary">Sign in to access the CMS</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleMicrosoftLogin}
          disabled={isLoading}
          className="btn btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 0h10.9v10.9H0V0z" fill="#f25022" />
                <path d="M12.1 0H23v10.9H12.1V0z" fill="#00a4ef" />
                <path d="M0 12.1h10.9V23H0V12.1z" fill="#ffb900" />
                <path d="M12.1 12.1H23V23H12.1V12.1z" fill="#7fba00" />
              </svg>
              Sign in with Microsoft
            </>
          )}
        </button>
      </div>
    </div>
  );
}
