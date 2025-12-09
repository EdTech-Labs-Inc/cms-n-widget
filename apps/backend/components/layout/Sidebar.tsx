'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, FolderOpen, Library, Settings, Tags, X, Video } from 'lucide-react';
import { UserMenu } from '@/components/auth/UserMenu';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: {
    id: string;
    email: string;
    fullName: string | null;
    isAdmin: boolean;
  } | null;
}

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();

  // Extract orgSlug from pathname if we're in org context
  const orgMatch = pathname.match(/^\/org\/([^/]+)/);
  const orgSlug = orgMatch ? orgMatch[1] : null;
  const basePath = orgSlug ? `/org/${orgSlug}` : '';

  const navItems = [
    { href: `${basePath}/dashboard`, label: 'Home', icon: Home },
    { href: `${basePath}/articles`, label: 'Articles', icon: FolderOpen },
    { href: `${basePath}/videos`, label: 'Videos', icon: Video },
    { href: `${basePath}/library`, label: 'Library', icon: Library },
    { href: `${basePath}/tags`, label: 'Tag Management', icon: Tags },
    { href: `${basePath}/settings`, label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <span className="sidebar-brand-text">EdTech Labs</span>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`sidebar-link ${active ? 'sidebar-link--active' : ''}`}
              >
                <Icon className="sidebar-link-icon" />
                <span className="sidebar-link-text">{item.label}</span>
              </Link>
            );
          })}

          {/* Primary CTA - New Article */}
          <Link href={`${basePath}/create`} onClick={handleLinkClick} className="sidebar-cta">
            <Plus className="sidebar-cta-icon" />
            <span className="sidebar-cta-text">New Article</span>
          </Link>

          {/* Secondary CTA - New Video */}
          <Link href={`${basePath}/video/create`} onClick={handleLinkClick} className="sidebar-cta sidebar-cta--secondary">
            <Video className="sidebar-cta-icon" />
            <span className="sidebar-cta-text">New Video</span>
          </Link>
        </nav>

        {/* User Menu at bottom */}
        {user && (
          <div className="mt-auto pt-4">
            <UserMenu user={user} />
          </div>
        )}
      </aside>
    </>
  );
}
