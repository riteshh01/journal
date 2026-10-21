'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  BookOpen,
  Flame,
  Target,
  Award,
  Check,
  X,
  CheckCircle2,
  ListTodo,
  Minus,
} from 'lucide-react';
import { DashboardSummary } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { cn } from '../../lib/utils';

interface DashboardChartsProps {
  data: DashboardSummary;
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const { stats, moodTrend, activeGoals, dailyActivity = [] } = data;
  const [timeframe, setTimeframe] = useState<'7d' | '14d' | '30d'>('14d');

  // Filter daily data based on selected timeframe
  const daysLimit = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : 30;
  const visibleDaily = dailyActivity.slice(-daysLimit).map((d) => ({
    ...d,
    journalValue: d.journalWritten ? 1 : 0,
  }));

  // Aggregated stats for the selected window
  const journalWrittenDays = visibleDaily.filter((d) => d.journalWritten).length;
  const totalTasksAdded = visibleDaily.reduce((acc, d) => acc + d.tasksAdded, 0);
  const totalTasksCompleted = visibleDaily.reduce((acc, d) => acc + d.tasksCompleted, 0);
  const taskCompletionRate =
    totalTasksAdded > 0 ? Math.round((totalTasksCompleted / totalTasksAdded) * 100) : 0;

  // Custom Dot for Journal Written status on the top secondary axis
  const CustomJournalDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;

    if (!payload?.journalWritten) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={2.5}
          fill="var(--border)"
          stroke="var(--surface)"
          strokeWidth={1}
          opacity={0.5}
        />
      );
    }

    return (
      <g>
        <circle cx={cx} cy={cy} r={7} fill="#10B981" opacity={0.25} />
        <circle cx={cx} cy={cy} r={4.5} fill="#10B981" stroke="#ffffff" strokeWidth={1.5} />
      </g>
    );
  };

  // Tooltip for Daily Journal & Tasks Activity
  const DailyActivityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const hasAdded = item.tasksAdded > 0;
      const rate = hasAdded ? Math.round((item.tasksCompleted / item.tasksAdded) * 100) : 0;

      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-xl text-xs space-y-2.5 min-w-[210px] pointer-events-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-border">
            <span className="font-semibold text-text">
              {item.label} ({item.dayOfWeek})
            </span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1',
                item.journalWritten
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : 'bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/30'
              )}
            >
              {item.journalWritten ? (
                <>
                  <Check className="w-3 h-3" /> Journal Written
                </>
              ) : (
                <>
                  <X className="w-3 h-3" /> No Journal
                </>
              )}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-text-muted">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#6366F1]" />
                Tasks Added
              </span>
              <span className="font-bold text-text font-mono">{item.tasksAdded}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-text-muted">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
                Tasks Completed
              </span>
              <span className="font-bold text-emerald-500 font-mono">
                {item.tasksCompleted} {hasAdded ? `(${rate}%)` : ''}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip for Mood Trend
  const MoodTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-2.5 rounded-md shadow-none text-xs">
          <p className="font-semibold text-text">{label}</p>
          <p className="text-text-muted mt-0.5">
            Mood: <span className="text-accent font-semibold">{payload[0].value} / 5</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Bar sizes according to timeframe
  const maxBarSize = timeframe === '7d' ? 20 : timeframe === '14d' ? 12 : 7;

  return (
    <div className="space-y-8">
      {/* 1. Small Stat Cards: Journal, Streak, Active Goals & Goals Done */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <Card className="flex items-center gap-3.5 p-4 hover:-translate-y-0.5 hover:border-blue-500/40 transition-all duration-200">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500 shrink-0">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted truncate">Total Entries</p>
            <p className="text-xl sm:text-2xl font-bold text-text mt-0.5 tracking-tight">{stats.totalEntries}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 hover:-translate-y-0.5 hover:border-amber-500/40 transition-all duration-200">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 shrink-0">
            <Flame className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted truncate">Writing Streak</p>
            <p className="text-xl sm:text-2xl font-bold text-text mt-0.5 tracking-tight">
              {stats.currentStreak} <span className="text-xs font-normal text-text-muted">{stats.currentStreak === 1 ? 'day' : 'days'}</span>
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 hover:-translate-y-0.5 hover:border-purple-500/40 transition-all duration-200">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-500 shrink-0">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted truncate">Active Goals</p>
            <p className="text-xl sm:text-2xl font-bold text-text mt-0.5 tracking-tight">{stats.activeGoalsCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 hover:-translate-y-0.5 hover:border-emerald-500/40 transition-all duration-200">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 shrink-0">
            <Award className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted truncate">Goals Done</p>
            <p className="text-xl sm:text-2xl font-bold text-text mt-0.5 tracking-tight">{stats.goalsCompleted}</p>
          </div>
        </Card>
      </div>

      {/* 2. Top Charts Row: Advanced Journal Activity & Mood Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Advanced Journal Activity Composed Chart */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-2 border-b border-border/70">
              <div>
                <CardTitle className="text-base">Journal Activity</CardTitle>
                <CardDescription className="text-xs">
                  Daily journal status, tasks added, and completion rates
                </CardDescription>
              </div>

              {/* Timeframe selector */}
              <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5 self-start sm:self-auto">
                {(['7d', '14d', '30d'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors uppercase',
                      timeframe === tf
                        ? 'bg-surface text-accent shadow-xs border border-border/80'
                        : 'text-text-muted hover:text-text'
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric summary badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Journal: <strong>{journalWrittenDays}/{visibleDaily.length} days</strong>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                Added: <strong>{totalTasksAdded}</strong>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Done: <strong>{totalTasksCompleted}</strong> ({taskCompletionRate}%)
              </span>
            </div>

            {/* Main ComposedChart */}
            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={visibleDaily}
                  margin={{ top: 15, right: 8, left: -20, bottom: 0 }}
                  barGap={2}
                >
                  <XAxis
                    dataKey="label"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    interval={timeframe === '30d' ? 3 : 0}
                  />
                  {/* Left Y-axis for task counts */}
                  <YAxis
                    yAxisId="tasks"
                    allowDecimals={false}
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                  />
                  {/* Secondary Y-axis for journal status (0 = unwritten, 1 = written) */}
                  <YAxis
                    yAxisId="journal"
                    domain={[0, 1.25]}
                    hide
                  />
                  <Tooltip content={<DailyActivityTooltip />} />

                  {/* Tasks Added (Indigo) */}
                  <Bar
                    yAxisId="tasks"
                    dataKey="tasksAdded"
                    name="Tasks Added"
                    fill="#6366F1"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={maxBarSize}
                  />

                  {/* Tasks Completed (Emerald Green) */}
                  <Bar
                    yAxisId="tasks"
                    dataKey="tasksCompleted"
                    name="Tasks Completed"
                    fill="#10B981"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={maxBarSize}
                  />

                  {/* Journal Written Status Indicator (Glowing line + dot) */}
                  <Line
                    yAxisId="journal"
                    type="monotone"
                    dataKey="journalValue"
                    name="Journal Written"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={<CustomJournalDot />}
                    activeDot={{ r: 6, fill: '#10B981', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Daily Summary Strip */}
          <div className="pt-3 mt-2 border-t border-border/70 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[280px] gap-1">
              {visibleDaily.map((d) => (
                <div
                  key={d.date}
                  className={cn(
                    'flex-1 flex flex-col items-center py-1.5 px-0.5 rounded text-center transition-colors',
                    d.journalWritten
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-background/60 border border-border/60 text-text-muted'
                  )}
                  title={`${d.label}: ${d.journalWritten ? 'Journal written' : 'No journal'} • ${d.tasksCompleted}/${d.tasksAdded} tasks completed`}
                >
                  <span className="text-[9px] font-mono leading-none opacity-80">{d.label.split(' ')[1]}</span>
                  <div className="my-1 flex items-center justify-center h-3.5">
                    {d.journalWritten ? (
                      <BookOpen className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Minus className="w-2.5 h-2.5 text-text-muted/40" />
                    )}
                  </div>
                  <span className="text-[8px] font-mono leading-none">
                    {d.tasksCompleted}/{d.tasksAdded}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Mood Trend (30 Days) */}
        <Card>
          <CardHeader>
            <CardTitle>Mood Trend</CardTitle>
            <CardDescription>Daily rating (1 to 5) over the past 30 days</CardDescription>
          </CardHeader>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} interval={4} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip content={<MoodTooltip />} />
                <Line
                  type="monotone"
                  dataKey="mood"
                  name="Mood"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 3. Active Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Active Goals Progress</CardTitle>
          <CardDescription>Target milestones and tracked completion rates</CardDescription>
        </CardHeader>
        {activeGoals.length === 0 ? (
          <p className="text-sm text-text-muted py-4">No active goals found. Set new goals in the Goals section.</p>
        ) : (
          <div className="space-y-4 pt-2">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text">{goal.title}</span>
                    {goal.category && (
                      <span className="px-1.5 py-0.5 rounded bg-background border border-border text-text-muted text-[10px]">
                        {goal.category}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-accent font-mono">{goal.progress}%</span>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="w-full h-2 bg-background border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(Math.max(goal.progress, 0), 100)}%` }}
                    role="progressbar"
                    aria-valuenow={goal.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
