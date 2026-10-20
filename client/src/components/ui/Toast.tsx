'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, description?: string) => string;
  error: (message: string, description?: string) => string;
  warning: (message: string, description?: string) => string;
  info: (message: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global dispatcher so toast can be called anywhere
let globalAddToast: ((toast: Omit<ToastItem, 'id'>) => string) | null = null;

export const toast = {
  success: (message: string, description?: string) =>
    globalAddToast ? globalAddToast({ type: 'success', message, description }) : '',
  error: (message: string, description?: string) =>
    globalAddToast ? globalAddToast({ type: 'error', message, description }) : '',
  warning: (message: string, description?: string) =>
    globalAddToast ? globalAddToast({ type: 'warning', message, description }) : '',
  info: (message: string, description?: string) =>
    globalAddToast ? globalAddToast({ type: 'info', message, description }) : '',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, message, description, duration = 3500 }: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, message, description, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  const success = useCallback(
    (message: string, description?: string) => addToast({ type: 'success', message, description }),
    [addToast]
  );
  const error = useCallback(
    (message: string, description?: string) => addToast({ type: 'error', message, description }),
    [addToast]
  );
  const warning = useCallback(
    (message: string, description?: string) => addToast({ type: 'warning', message, description }),
    [addToast]
  );
  const info = useCallback(
    (message: string, description?: string) => addToast({ type: 'info', message, description }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback so useToast doesn't crash if rendered outside provider
    return toast;
  }
  return context;
}

/**
 * Responsive Toast Container
 * - On Mobile (< sm): Pinned near top-center, compact width (max-w-[92vw]), tight padding, small icons.
 * - On Laptop/Desktop (>= sm): Pinned at top-right, comfortably sized (max-w-sm), rich spacing.
 */
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none flex flex-col gap-2 transition-all duration-200
                 top-3 inset-x-3 sm:inset-x-auto sm:top-5 sm:right-5 sm:max-w-sm sm:w-full"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const getIcon = () => {
    switch (item.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-500 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#DC2626] dark:text-red-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent shrink-0 mt-0.5" />;
    }
  };

  const getTypeStyles = () => {
    switch (item.type) {
      case 'success':
        return 'border-emerald-500/30 bg-surface/95 text-text';
      case 'error':
        return 'border-red-500/40 bg-surface/95 text-text';
      case 'warning':
        return 'border-amber-500/40 bg-surface/95 text-text';
      case 'info':
      default:
        return 'border-border bg-surface/95 text-text';
    }
  };

  return (
    <div
      className={cn(
        'pointer-events-auto border rounded-lg sm:rounded-xl shadow-lg backdrop-blur-md',
        'p-2.5 sm:p-3.5 flex items-start gap-2.5 transition-all duration-200 toast-enter',
        getTypeStyles()
      )}
      role="status"
    >
      {getIcon()}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs sm:text-sm font-semibold leading-tight text-text break-words">
          {item.message}
        </p>
        {item.description && (
          <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 leading-snug break-words">
            {item.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 -mr-1 -mt-1 text-text-muted hover:text-text rounded-md transition-colors"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
}
