'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, FolderOpen, Library, Settings, Tags, X, Video, User } from 'lucide-react';
import { UserMenu } from '@/components/auth/UserMenu';
import { PlatformModeSwitcher } from './PlatformModeSwitcher';
import { usePlatformMode } from '@/lib/context/platform-mode-context';
import { useEffect } from 'react';

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
  const router = useRouter();
  const { mode } = usePlatformMode();

  // Extract orgSlug from pathname if we're in org context
  const orgMatch = pathname.match(/^\/org\/([^/]+)/);
  const orgSlug = orgMatch ? orgMatch[1] : null;
  const basePath = orgSlug ? `/org/${orgSlug}` : '';

  // Navigation items for Learning Platform mode
  const learningNavItems = [
    { href: `${basePath}/dashboard`, label: 'Home', icon: Home },
    { href: `${basePath}/articles`, label: 'Articles', icon: FolderOpen },
    { href: `${basePath}/library`, label: 'Library', icon: Library },
    { href: `${basePath}/tags`, label: 'Tag Management', icon: Tags },
    { href: `${basePath}/settings`, label: 'Settings', icon: Settings },
  ];

  // Navigation items for Creative Platform mode
  const creativeNavItems = [
    { href: `${basePath}/creative`, label: 'Home', icon: Home },
    { href: `${basePath}/creative/avatars`, label: 'Avatars', icon: User, comingSoon: true },
    { href: `${basePath}/settings`, label: 'Settings', icon: Settings },
  ];

  const navItems = mode === 'learning' ? learningNavItems : creativeNavItems;

  // Redirect to appropriate home when mode changes
  useEffect(() => {
    if (mode === 'creative' && pathname === `${basePath}/dashboard`) {
      router.push(`${basePath}/creative`);
    } else if (mode === 'learning' && pathname === `${basePath}/creative`) {
      router.push(`${basePath}/dashboard`);
    }
  }, [mode, pathname, basePath, router]);

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

        {/* Platform Mode Switcher */}
        <div className="mb-4">
          <PlatformModeSwitcher />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isDisabled = item.comingSoon;

            if (isDisabled) {
              return (
                <div
                  key={item.href}
                  className="sidebar-link opacity-50 cursor-not-allowed relative"
                >
                  <Icon className="sidebar-link-icon" />
                  <span className="sidebar-link-text">{item.label}</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-medium">
                    Soon
                  </span>
                </div>
              );
            }

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

          {/* Conditional CTAs based on mode */}
          {mode === 'learning' ? (
            <>
              {/* Primary CTA - New Article */}
              <Link href={`${basePath}/create`} onClick={handleLinkClick} className="sidebar-cta">
                <Plus className="sidebar-cta-icon" />
                <span className="sidebar-cta-text">New Article</span>
              </Link>
            </>
          ) : (
            <>
              {/* Primary CTA - New Video (Creative Mode) */}
              <Link href={`${basePath}/video/create`} onClick={handleLinkClick} className="sidebar-cta">
                <Video className="sidebar-cta-icon" />
                <span className="sidebar-cta-text">New Video</span>
              </Link>
            </>
          )}
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
