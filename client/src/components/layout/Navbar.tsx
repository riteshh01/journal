'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Dashboard', href: '/' },
    { label: 'Journal', href: '/journal' },
    { label: 'Goals', href: '/goals' },
    { label: 'Coding', href: '/coding' },
    { label: 'Media', href: '/media' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-text font-bold text-base tracking-tight hover:text-accent transition-colors"
            >
              <div className="w-7 h-7 bg-accent text-accent-contrast rounded-md flex items-center justify-center font-black text-sm">
                J
              </div>
              <span>{user?.display_name || 'Personal Journal'}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                      active
                        ? 'bg-background text-accent border border-border'
                        : 'text-text-muted hover:text-text hover:bg-background'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              aria-label="Log out of application"
              className="text-text-muted hover:text-[#DC2626] border-border"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              <span>Logout</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-text hover:bg-background border border-border focus:outline-none"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  active
                    ? 'bg-background text-accent border border-border'
                    : 'text-text-muted hover:text-text hover:bg-background'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full justify-start text-text-muted hover:text-[#DC2626] border-border"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
