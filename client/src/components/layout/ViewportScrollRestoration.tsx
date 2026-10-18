'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { forceResetScrollLock } from '../../lib/scrollLock';

/**
 * ViewportScrollRestoration
 * 
 * Handles iOS Safari and mobile browser lifecycle events:
 * 1. Automatically cleans up any lingering body scroll locks on route transitions.
 * 2. Handles bfcache (back-forward cache) page restoration via 'pageshow'.
 *    When navigating back from another page or history entry, ensures the page's
 *    layout and zoom state are not corrupted by stale modal styles or keyboard offsets.
 * 3. Prevents layout shifts and visual viewport distortion on mobile Safari.
 */
export function ViewportScrollRestoration() {
  const pathname = usePathname();

  // Reset scroll lock state on client-side route transitions
  useEffect(() => {
    forceResetScrollLock();
  }, [pathname]);

  // Handle bfcache page restoration & visibility recovery
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePageShow = (event: PageTransitionEvent) => {
      // event.persisted indicates restoration from the bfcache
      if (event.persisted) {
        forceResetScrollLock();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return null;
}
