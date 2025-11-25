"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create organization state
  const [orgName, setOrgName] = useState("");

  // Join organization state
  const [searchQuery, setSearchQuery] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [joinMethod, setJoinMethod] = useState<"search" | "code">("search");

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create organization");
      }

      // Redirect to new organization dashboard
      router.push(`/org/${data.organization.slug}/dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchOrgs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length < 2) {
      setError("Search query must be at least 2 characters");
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search organizations");
      }

      setSearchResults(data.organizations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleJoinRequest = async (slug?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/organizations/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          slug ? { slug } : { joinCode: joinCode.trim() }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request to join");
      }

      // Redirect to pending approval page
      router.push("/onboarding/pending");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
          Welcome to the CMS
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Get started by creating or joining an organization
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 sm:rounded-xl sm:px-10">
          {/* Tabs */}
          <div className="flex border-b border-white-10 mb-6">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-2 px-4 text-center font-medium text-sm transition-colors ${
                activeTab === "create"
                  ? "border-b-2 border-purple-accent text-purple-accent"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Create Organization
            </button>
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 py-2 px-4 text-center font-medium text-sm transition-colors ${
                activeTab === "join"
                  ? "border-b-2 border-purple-accent text-purple-accent"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Join Organization
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-500/15 border border-red-500/30 text-error px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Create Organization Tab */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateOrg} className="space-y-6">
              <div>
                <label
                  htmlFor="orgName"
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Organization Name
                </label>
                <input
                  type="text"
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className="input w-full"
                  placeholder="My Organization"
                />
                <p className="mt-2 text-xs text-text-muted">
                  You will become the owner of this organization
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !orgName.trim()}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Organization"}
              </button>
            </form>
          )}

          {/* Join Organization Tab */}
          {activeTab === "join" && (
            <div className="space-y-6">
              {/* Join method selector */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setJoinMethod("search")}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
                    joinMethod === "search"
                      ? "bg-purple-light text-purple-vibrant border border-purple-accent"
                      : "bg-white-10 text-text-secondary border border-white-15 hover:bg-white-15"
                  }`}
                >
                  Search by Name
                </button>
                <button
                  onClick={() => setJoinMethod("code")}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
                    joinMethod === "code"
                      ? "bg-purple-light text-purple-vibrant border border-purple-accent"
                      : "bg-white-10 text-text-secondary border border-white-15 hover:bg-white-15"
                  }`}
                >
                  Enter Join Code
                </button>
              </div>

              {/* Search by name */}
              {joinMethod === "search" && (
                <div>
                  <form onSubmit={handleSearchOrgs} className="space-y-4">
                    <div>
                      <label
                        htmlFor="search"
                        className="block text-sm font-medium text-text-primary mb-2"
                      >
                        Search Organizations
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input flex-1"
                          placeholder="Organization name..."
                          minLength={2}
                        />
                        <button
                          type="submit"
                          disabled={searching || searchQuery.trim().length < 2}
                          className="btn btn-secondary disabled:opacity-50"
                        >
                          {searching ? "..." : "Search"}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-text-primary">
                        Results:
                      </p>
                      {searchResults.map((org) => (
                        <div
                          key={org.id}
                          className="flex items-center justify-between p-3 bg-white-5 border border-white-10 rounded-xl hover:bg-white-10 transition-all"
                        >
                          <div>
                            <p className="font-medium text-text-primary">
                              {org.name}
                            </p>
                            <p className="text-xs text-text-muted">
                              {org.slug}
                            </p>
                          </div>
                          <button
                            onClick={() => handleJoinRequest(org.slug)}
                            disabled={loading}
                            className="px-3 py-1 text-sm border border-purple-accent text-purple-accent rounded-lg hover:bg-purple-light transition-all disabled:opacity-50"
                          >
                            Request to Join
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.length === 0 && searchQuery && !searching && (
                    <p className="mt-4 text-sm text-text-muted">
                      No organizations found
                    </p>
                  )}
                </div>
              )}

              {/* Join by code */}
              {joinMethod === "code" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJoinRequest();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="joinCode"
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      Join Code
                    </label>
                    <input
                      type="text"
                      id="joinCode"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      required
                      maxLength={8}
                      className="input w-full uppercase font-mono"
                      placeholder="ABC12345"
                    />
                    <p className="mt-2 text-xs text-text-muted">
                      Enter the 8-character join code provided by your
                      organization
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || joinCode.trim().length !== 8}
                    className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Requesting..." : "Request to Join"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
