'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  BookOpen,
  Flame,
  Target,
  Award,
} from 'lucide-react';
import { DashboardSummary } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';

interface DashboardChartsProps {
  data: DashboardSummary;
}

const CATEGORY_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

export function DashboardCharts({ data }: DashboardChartsProps) {
  const { stats, weeklyEntries, moodTrend, goalsByCategory, activeGoals } = data;

  // Custom flat tooltip for minimal design
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-2.5 rounded-md shadow-none text-xs">
          <p className="font-semibold text-text">{label}</p>
          <p className="text-text-muted mt-0.5">
            {payload[0].name}: <span className="text-accent font-semibold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

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


      {/* 2. Top Charts Row: Weekly Journal Entries & Mood Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Journal Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Journal Activity</CardTitle>
            <CardDescription>Entries written per week over the last 8 weeks</CardDescription>
          </CardHeader>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyEntries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Entries" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
                <Tooltip content={<CustomTooltip />} />
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

      {/* 3. Middle Section: Goals by Category & Active Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals by Category Donut Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Goals by Category</CardTitle>
            <CardDescription>Distribution across life pillars</CardDescription>
          </CardHeader>
          <div className="h-64 w-full flex items-center justify-center">
            {(!goalsByCategory || goalsByCategory.length === 0 || goalsByCategory.every((g) => g.count === 0)) ? (
              <p className="text-sm text-text-muted">No goal categories defined yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalsByCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {goalsByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.category}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Category Legend */}
          {goalsByCategory && goalsByCategory.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 pt-2 border-t border-border mt-2 text-xs">
              {goalsByCategory.map((item, index) => (
                <div key={item.category} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-text-muted text-[11px]">
                    {item.category}: <strong className="text-text">{item.count}</strong>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Goals Progress Bars */}
        <Card className="lg:col-span-2">
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
    </div>
  );
}
