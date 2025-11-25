"use client";

import { useEffect, useState } from "react";
import { Check, X, AlertCircle } from "lucide-react";

interface Profile {
  id: string;
  fullName: string | null;
  isAdmin: boolean;
  accessGrantedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function AdminProfileList() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      const response = await fetch("/api/admin/profiles");
      const data = await response.json();

      if (data.success) {
        setProfiles(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }

  async function grantAccess(userId: string) {
    if (!confirm("Are you sure you want to grant access to this user?")) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/profiles/${userId}/approve`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        // Update local state
        setProfiles(
          profiles.map((p) =>
            p.id === userId
              ? { ...p, accessGrantedAt: data.data.accessGrantedAt }
              : p
          )
        );
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  }

  async function disableUser(userId: string, isAdmin: boolean) {
    if (isAdmin) {
      alert("Cannot disable admin users. Please contact EdTech Labs.");
      return;
    }

    if (!confirm("Are you sure you want to disable this user?")) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/profiles/${userId}/disable`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        // Update local state
        setProfiles(
          profiles.map((p) =>
            p.id === userId ? { ...p, accessGrantedAt: null } : p
          )
        );
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to disable user");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-text-muted">Loading profiles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy-dark rounded-lg border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-navy-darker border-b border-white/10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {profiles.map((profile) => (
              <tr
                key={profile.id}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-primary">
                    {profile.fullName || "Unknown"}
                  </div>
                  <div className="text-xs text-text-muted truncate max-w-xs">
                    {profile.id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {profile.isAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-500/30">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {profile.accessGrantedAt ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-500/30">
                      <Check className="w-3 h-3" />
                      Access Granted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-500/30">
                      <AlertCircle className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {!profile.accessGrantedAt ? (
                    <button
                      onClick={() => grantAccess(profile.id)}
                      disabled={actionLoading === profile.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      {actionLoading === profile.id
                        ? "loading..."
                        : "Grant Access"}
                    </button>
                  ) : (
                    <button
                      onClick={() => disableUser(profile.id, profile.isAdmin)}
                      disabled={actionLoading === profile.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {actionLoading === profile.id
                        ? "Disabling..."
                        : "Disable"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-text-muted">No profiles found</div>
        </div>
      )}
    </div>
  );
}
