'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { DashboardSummary } from '../../types';
import { Banner } from '../../components/layout/Banner';
import { DashboardCharts } from '../../components/charts/DashboardCharts';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import TimeFlies from '../../components/dashboard/TimeFlies';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await api.get<DashboardSummary>('/dashboard/summary');
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-6">
      {/* Compact Day, Month, Year Temporal Countdown */}
      <TimeFlies />

      <Banner />

      {/* Loading state */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">Loading dashboard metrics...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-surface border border-[#DC2626] rounded-lg p-6 text-center max-w-lg mx-auto my-8 space-y-3">
          <AlertCircle className="w-8 h-8 text-[#DC2626] mx-auto" />
          <h2 className="text-sm font-semibold text-text">Failed to load dashboard metrics</h2>
          <p className="text-xs text-text-muted">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchSummary} className="mt-2">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Dashboard Charts */}
      {data && !loading && <DashboardCharts data={data} />}
    </div>
  );
}
