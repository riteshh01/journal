'use client';

import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Button } from '../ui/Button';

export function RefreshButton() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    // Smooth spin animation effect before full website reload
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <Button
      id="website-refresh-btn"
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      aria-label="Refresh website completely"
      title="Refresh website"
      className="p-2 border-border text-text hover:bg-surface-hover transition-colors"
      disabled={refreshing}
    >
      <RotateCw
        className={`w-4 h-4 text-text transition-transform duration-500 ease-in-out ${
          refreshing ? 'animate-spin text-accent' : 'hover:rotate-45'
        }`}
      />
    </Button>
  );
}

export default RefreshButton;
