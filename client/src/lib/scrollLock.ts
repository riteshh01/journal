/**
 * Centralized, iOS Safari-compatible body scroll lock manager.
 * 
 * Features:
 * - Reference-counted locks for nested/consecutive modals & drawers.
 * - Preserves exact scroll position via position: fixed + top offset on iOS Safari.
 * - Restores layout without layout jumps, visual viewport shifts, or page zoom distortion.
 * - Automatically blurs active inputs on close to ensure virtual keyboard dismissal realigns the viewport.
 */

let lockCount = 0;
let previousBodyStyles = {
  position: '',
  top: '',
  width: '',
  overflow: '',
};
let scrollY = 0;

export function lockScroll(): void {
  if (typeof window === 'undefined') return;

  lockCount++;
  if (lockCount > 1) {
    // Already locked by another overlay
    return;
  }

  scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

  previousBodyStyles = {
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
    overflow: document.body.style.overflow,
  };

  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
}

export function unlockScroll(): void {
  if (typeof window === 'undefined') return;

  if (lockCount <= 0) {
    lockCount = 0;
    return;
  }

  lockCount--;
  if (lockCount > 0) {
    // Other overlays still open
    return;
  }

  // Dismiss any active virtual keyboard to prevent visual viewport shift
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const savedScrollY = scrollY;

  document.body.style.position = previousBodyStyles.position;
  document.body.style.top = previousBodyStyles.top;
  document.body.style.width = previousBodyStyles.width;
  document.body.style.overflow = previousBodyStyles.overflow;

  // Restore scroll position instantly
  window.scrollTo({
    top: savedScrollY,
    left: 0,
    behavior: 'instant' as ScrollBehavior,
  });

  // Safeguard for iOS Safari virtual keyboard dismissal and visual viewport realignment
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: savedScrollY,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      });
    });
  }
}

/**
 * Force-resets all scroll locks (used on route change or bfcache pageshow).
 */
export function forceResetScrollLock(): void {
  if (typeof window === 'undefined') return;
  lockCount = 0;
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
}
