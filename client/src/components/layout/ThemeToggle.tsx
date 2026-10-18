'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      id="theme-toggle-btn"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="p-2 border-border text-text hover:bg-surface-hover"
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 text-text" />
      ) : (
        <Sun className="w-4 h-4 text-text" />
      )}
    </Button>
  );
}
