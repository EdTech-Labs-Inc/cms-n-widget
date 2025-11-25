'use client';

import { signOut } from '@/app/auth/actions';
import { LogOut, User, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function UserMenu({ user }: { user: { email: string; fullName: string | null } }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    fetch('/api/admin/profiles')
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.success);
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleAdminClick = () => {
    setIsOpen(false);
    router.push('/admin');
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
        <div className="w-8 h-8 bg-gradient-blue rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-text-primary">{user.fullName || user.email}</div>
          <div className="text-xs text-text-muted">{isAdmin ? 'Admin' : 'Staff'}</div>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-navy-dark border border-white/10 rounded-lg shadow-lg z-50">
            <div className="p-2">
              {isAdmin && (
                <button
                  onClick={handleAdminClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
