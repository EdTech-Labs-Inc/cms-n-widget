'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { SupportWidget } from '../support/SupportWidget';
import { useFeatureFlags } from '@/lib/api/hooks';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    id: string;
    email: string;
    fullName: string | null;
    isAdmin: boolean;
  } | null;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: featureFlags } = useFeatureFlags();

  // If no user, don't show sidebar (login page, etc.)
  if (!user) {
    return <>{children}</>;
  }

  const showSupportWidget = featureFlags?.support_widget_enabled ?? false;

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />
      <main className="dashboard-main">
        {/* Top bar - mobile only */}
        <div className="dashboard-topbar">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-text-primary hover:text-gold transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Main content */}
        <div className="dashboard-content">
          {children}
        </div>
      </main>

      {/* Support Widget - conditionally rendered based on feature flag */}
      {showSupportWidget && <SupportWidget user={user} />}
    </div>
  );
}
