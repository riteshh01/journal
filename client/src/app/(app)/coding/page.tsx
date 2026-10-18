'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Code,
  Flame,
  Trophy,
  Calendar,
  Plus,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Edit2,
  Check,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { CodingPlatform, CodingProfile, CodingSummary } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { CodingHeatmap } from '../../../components/coding/CodingHeatmap';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';

type UserHandles = Record<CodingPlatform, string>;

const DEFAULT_HANDLES: UserHandles = {
  leetcode: 'tourist',
  codeforces: 'tourist',
  codechef: 'tourist',
  gfg: 'tourist',
};

const PLATFORM_INFO: Record<
  CodingPlatform,
  { name: string; tag: string; defaultDomain: string }
> = {
  leetcode: {
    name: 'LeetCode',
    tag: 'Algorithms & Data Structures',
    defaultDomain: 'leetcode.com',
  },
  codeforces: {
    name: 'Codeforces',
    tag: 'Competitive Programming',
    defaultDomain: 'codeforces.com',
  },
  codechef: {
    name: 'CodeChef',
    tag: 'Rated Contests & Practice',
    defaultDomain: 'codechef.com',
  },
  gfg: {
    name: 'GeeksforGeeks',
    tag: 'Interview Prep & Practice',
    defaultDomain: 'geeksforgeeks.org',
  },
};

export default function CodingPage() {
  const [handles, setHandles] = useState<UserHandles>(DEFAULT_HANDLES);
  const [summary, setSummary] = useState<CodingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Handle Modal state
  const [editingPlatform, setEditingPlatform] = useState<CodingPlatform | null>(null);
  const [inputHandle, setInputHandle] = useState('');

  // Load handles from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('journal_coding_handles');
      if (saved) {
        setHandles(JSON.parse(saved));
      }
    } catch (_) { }
  }, []);

  const fetchCodingStats = useCallback(
    async (currentHandles: UserHandles) => {
      setError(null);
      try {
        const profilesList = (Object.keys(currentHandles) as CodingPlatform[])
          .filter((p) => currentHandles[p] && currentHandles[p].trim() !== '')
          .map((p) => ({
            platform: p,
            username: currentHandles[p].trim(),
          }));

        const res = await api.post<CodingSummary>('/coding/aggregate', {
          profiles: profilesList,
        });

        setSummary(res);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch platform profiles');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCodingStats(handles);
  }, [handles, fetchCodingStats]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchCodingStats(handles);
  };

  const handleOpenEdit = (platform: CodingPlatform) => {
    setEditingPlatform(platform);
    setInputHandle(handles[platform] || '');
  };

  const handleSaveHandle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlatform) return;

    const updated = {
      ...handles,
      [editingPlatform]: inputHandle.trim(),
    };

    setHandles(updated);
    try {
      localStorage.setItem('journal_coding_handles', JSON.stringify(updated));
    } catch (_) { }

    setEditingPlatform(null);
    setLoading(true);
    fetchCodingStats(updated);
  };

  const platforms: CodingPlatform[] = ['leetcode', 'codeforces', 'codechef', 'gfg'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <Code className="w-6 h-6 text-accent" />
            Coding Profiles
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Track combined problem solving statistics across LeetCode, Codeforces, CodeChef, and GeeksforGeeks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleManualRefresh}
            loading={refreshing}
            disabled={loading}
            aria-label="Refresh stats from APIs"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh Data
          </Button>
        </div>
      </div>

      {loading && !summary ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">Fetching live stats from coding platforms...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-surface border border-[#DC2626] rounded-lg text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-[#DC2626] mx-auto" />
          <p className="text-sm font-semibold text-text">Error fetching coding metrics</p>
          <p className="text-xs text-text-muted">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchCodingStats(handles)} className="mt-2">
            Retry
          </Button>
        </div>
      ) : (
        summary && (
          <>
            {/* 1. Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="flex items-center gap-4 p-4">
                <div className="p-3 bg-surface border border-border rounded-md text-accent">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted">Total Solved</p>
                  <p className="text-2xl font-bold text-text mt-0.5">{summary.totalSolved}</p>
                </div>
              </Card>

              <Card className="flex items-center gap-4 p-4">
                <div className="p-3 bg-surface border border-border rounded-md text-[#D97706]">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted">Current Streak</p>
                  <p className="text-2xl font-bold text-text mt-0.5">
                    {summary.currentStreak} {summary.currentStreak === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </Card>

              <Card className="flex items-center gap-4 p-4">
                <div className="p-3 bg-surface border border-border rounded-md text-[#16A34A]">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted">Longest Streak</p>
                  <p className="text-2xl font-bold text-text mt-0.5">
                    {summary.maxStreak} {summary.maxStreak === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </Card>

              <Card className="flex items-center gap-4 p-4">
                <div className="p-3 bg-surface border border-border rounded-md text-accent">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted">Active Days (Year)</p>
                  <p className="text-2xl font-bold text-text mt-0.5">{summary.activeDaysCount}</p>
                </div>
              </Card>
            </div>

            {/* 2. 365-Day Activity Heatmap */}
            <CodingHeatmap activity={summary.dailyActivity} />

            {/* 3. Platform Breakdown Cards */}
            <div>
              <div className="pb-3 mb-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text">Platform Profiles</h3>
                  <p className="text-xs text-text-muted">
                    Click edit to set your username for LeetCode, Codeforces, CodeChef, or GeeksforGeeks
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {platforms.map((platform) => {
                  const info = PLATFORM_INFO[platform];
                  const profile = summary.profiles.find((p) => p.platform === platform);
                  const handle = handles[platform];

                  return (
                    <Card key={platform} className="flex flex-col justify-between space-y-4 p-5">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-base font-bold text-text">{info.name}</h4>
                            <p className="text-[11px] text-text-muted">{info.tag}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(platform)}
                            aria-label={`Configure ${info.name} profile`}
                            className="p-1 text-text-muted hover:text-accent h-7"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Stats */}
                        {handle ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-text-muted">Handle</span>
                              <span className="text-xs font-semibold text-text font-mono">@{handle}</span>
                            </div>

                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-text-muted">Problems Solved</span>
                              <span className="text-xl font-bold text-accent">
                                {profile ? profile.problemsSolved : '...'}
                              </span>
                            </div>

                            {profile && (profile.rating || profile.ranking) && (
                              <div className="flex items-baseline justify-between text-xs">
                                <span className="text-text-muted">Rating / Rank</span>
                                <span className="font-medium text-text">
                                  {profile.rating ? `${profile.rating}` : ''}
                                  {profile.rating && profile.ranking ? ' • ' : ''}
                                  {profile.ranking || ''}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-4 text-center border border-dashed border-border rounded-md">
                            <p className="text-xs text-text-muted">No handle set</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(platform)}
                              className="mt-2 text-xs py-1"
                            >
                              Add Handle
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Footer Link */}
                      {handle && profile && (
                        <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                          <span>Live API Sync</span>
                          <a
                            href={profile.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
                          >
                            <span>Profile</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )
      )}

      {/* Edit Handle Modal */}
      {editingPlatform && (
        <Modal
          isOpen={Boolean(editingPlatform)}
          onClose={() => setEditingPlatform(null)}
          title={`Set ${PLATFORM_INFO[editingPlatform].name} Handle`}
        >
          <form onSubmit={handleSaveHandle} className="space-y-4">
            <Input
              label="Username / Handle"
              placeholder={`Enter your ${PLATFORM_INFO[editingPlatform].name} handle...`}
              value={inputHandle}
              onChange={(e) => setInputHandle(e.target.value)}
              required
              autoFocus
            />
            <p className="text-xs text-text-muted">
              We query the public API for this handle to automatically populate problems solved and activity.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditingPlatform(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save & Fetch Stats
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
