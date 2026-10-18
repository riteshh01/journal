'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Code2,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { RefreshButton } from './RefreshButton';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Journal', href: '/journal', icon: BookOpen },
    { label: 'Goals', href: '/goals', icon: Target },
    { label: 'Coding', href: '/coding', icon: Code2 },
    { label: 'Media', href: '/media', icon: ImageIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ========================================================================= */}
      {/* TOP NAVBAR (Used across both Desktop & Mobile)                            */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left section: Logo & Desktop Navigation */}
            <div className="flex items-center gap-4 lg:gap-8">
              {/* Brand Logo & Name */}
              <Link
                href="/"
                className="flex items-center gap-2.5 text-text font-bold text-base tracking-tight hover:opacity-90 transition-opacity"
              >
                <div className="w-8 h-8 bg-accent text-accent-contrast rounded-lg flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  J
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm sm:text-base text-text leading-tight truncate max-w-[170px] sm:max-w-none">
                    {user?.display_name || 'Personal Journal'}
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] text-text-muted uppercase tracking-wider font-semibold items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                    <span>Private sanctuary</span>
                  </span>
                </div>
              </Link>

              {/* Desktop Horizontal Navigation Links (Laptop / Desktop Navbar) */}
              <nav className="hidden md:flex items-center space-x-1" aria-label="Main Desktop Navigation">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
                        active
                          ? 'bg-accent/15 text-accent font-semibold border border-accent/25 shadow-2xs'
                          : 'text-text-muted hover:text-text hover:bg-surface-hover'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-accent' : 'text-text-muted')} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right section: Theme Toggle, Refresh & Logout on Desktop */}
            <div className="hidden md:flex items-center gap-2.5">
              <RefreshButton />
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                aria-label="Log out of application"
                className="text-text-muted hover:text-[#DC2626] hover:border-[#DC2626]/40 hover:bg-[#DC2626]/10 border-border text-xs py-1.5 px-3 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                <span>Logout</span>
              </Button>
            </div>

            {/* Right section on Mobile: Refresh, Theme toggle & Hamburger menu */}
            <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
              <RefreshButton />
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg text-text hover:bg-surface-hover border border-border focus:outline-none transition-colors"
                aria-expanded={mobileOpen}
                aria-label="Open mobile navigation sidebar"
              >
                <Menu className="w-5 h-5 text-text" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OVER SIDEBAR DRAWER (Slides from the RIGHT on mobile < md)   */}
      {/* ========================================================================= */}
      {/* Backdrop overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over drawer container pinned to right edge */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-surface border-l border-border shadow-2xl flex flex-col md:hidden transform transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Sidebar"
      >
        {/* Drawer Header */}
        <div className="h-14 px-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-accent text-accent-contrast rounded-md flex items-center justify-center font-black text-xs shrink-0">
              J
            </div>
            <span className="truncate font-bold text-sm text-text">
              {user?.display_name || 'Personal Journal'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-text hover:bg-surface-hover border border-border focus:outline-none transition-colors"
            aria-label="Close sidebar navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Vertical Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Mobile Sidebar Navigation">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-accent/15 text-accent font-semibold border border-accent/25 shadow-2xs'
                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    active ? 'text-accent' : 'text-text-muted group-hover:text-text'
                  )}
                />
                <span className="flex-1 truncate">{link.label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer with Profile & Logout */}
        <div className="border-t border-border p-3 space-y-3 bg-surface">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-md bg-background/50 border border-border/50">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent border border-accent/30 flex items-center justify-center font-bold text-xs shrink-0">
              {(user?.display_name?.[0] || 'O').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text truncate">
                {user?.display_name || 'Journal Owner'}
              </p>
              <p className="text-[11px] text-text-muted truncate">
                {user?.email || 'owner@journal.local'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMobileOpen(false);
              logout();
            }}
            aria-label="Log out of application"
            className="w-full justify-center text-text-muted hover:text-[#DC2626] hover:border-[#DC2626]/40 hover:bg-[#DC2626]/10 border-border text-xs py-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </>
  );
}

export default Navbar;
