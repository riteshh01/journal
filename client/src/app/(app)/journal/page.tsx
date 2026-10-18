'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Calendar, Search, Smile, Frown, Meh, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { JournalEntry } from '../../../types';
import { formatDate, getTodayString } from '../../../lib/utils';
import { CalendarView } from '../../../components/journal/CalendarView';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { Card } from '../../../components/ui/Card';

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const todayStr = getTodayString();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ entries: JournalEntry[] }>('/journal', { limit: 100 });
      setEntries(res.entries || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Set of dates with recorded entries
  const entryDatesSet = new Set<string>(entries.map((e) => e.entry_date));

  const filteredEntries = entries.filter((e) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return e.title.toLowerCase().includes(term) || e.content.toLowerCase().includes(term);
  });

  const renderMoodBadge = (mood: number | null) => {
    if (!mood) return null;
    const moodLabels = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Excellent'];
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-background border border-border text-text font-medium">
        <span>Mood: {mood}/5</span>
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Journal</h1>
          <p className="text-xs text-text-muted mt-1">
            Capture daily reflections, ideas, and mood trends. One entry per day.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => router.push(`/journal/${todayStr}`)}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {entryDatesSet.has(todayStr) ? "Open Today's Entry" : "Write Today's Entry"}
        </Button>
      </div>

      {loading && entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">Loading calendar and entries...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-surface border border-[#DC2626] rounded-lg text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-[#DC2626] mx-auto" />
          <p className="text-sm font-semibold text-text">Error loading journal</p>
          <p className="text-xs text-text-muted">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchEntries} className="mt-2">
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Calendar Section (Left / Top on Mobile) */}
          <div className="lg:col-span-5">
            <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Calendar Navigation
            </h2>
            <CalendarView entryDates={entryDatesSet} />
          </div>

          {/* Entries Feed Section (Right) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-text flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                Recent Entries ({filteredEntries.length})
              </h2>
              <div className="max-w-xs w-full">
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="py-1 text-base sm:text-xs"
                />
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 bg-surface border border-border rounded-lg p-6">
                <p className="text-sm font-semibold text-text">
                  {searchTerm ? 'No matching entries found' : 'No journal entries yet'}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {searchTerm
                    ? 'Try adjusting your search keywords.'
                    : 'Select a date on the calendar or click the button above to start your first entry.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/journal/${entry.entry_date}`}
                    className="block group"
                  >
                    <Card className="hover:border-accent transition-colors p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                            {formatDate(entry.entry_date, {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <h3 className="text-base font-semibold text-text group-hover:text-accent transition-colors">
                            {entry.title}
                          </h3>
                        </div>
                        {renderMoodBadge(entry.mood)}
                      </div>

                      <p className="text-xs text-text-muted mt-2 line-clamp-2 leading-relaxed">
                        {entry.content || 'No text written yet.'}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
