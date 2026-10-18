'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  ListTodo,
  Check,
  Plus,
  ArrowRight,
  CheckSquare,
} from 'lucide-react';
import { DashboardSummary } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { api } from '../../lib/api';

interface DashboardChartsProps {
  data: DashboardSummary;
}

const CATEGORY_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

export function DashboardCharts({ data }: DashboardChartsProps) {
  const { stats, weeklyEntries, moodTrend, goalsByCategory, activeGoals } = data;

  const [todayTasks, setTodayTasks] = useState(data.todayTasks || []);
  const [quickTitle, setQuickTitle] = useState('');
  const [addingQuickTask, setAddingQuickTask] = useState(false);

  // Today date formatted as YYYY-MM-DD in local time
  const todayStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted;
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, is_completed: nextCompleted } : t))
    );

    try {
      await api.patch(`/journal/tasks/${taskId}/toggle`, {
        is_completed: nextCompleted,
      });
    } catch {
      // Revert on error
      setTodayTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: currentCompleted } : t))
      );
    }
  };

  const handleAddQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;

    setAddingQuickTask(true);
    try {
      const res = await api.post<{ task: any }>(`/journal/${todayStr}/tasks`, {
        title: trimmed,
      });
      if (res.task) {
        setTodayTasks((prev) => [
          ...prev,
          {
            id: res.task.id,
            title: res.task.title,
            is_completed: Boolean(res.task.is_completed),
          },
        ]);
        setQuickTitle('');
      }
    } catch {
      // ignore
    } finally {
      setAddingQuickTask(false);
    }
  };

  const completedTodayTasks = todayTasks.filter((t) => t.is_completed).length;
  const totalTodayTasks = todayTasks.length;
  const taskProgressPct =
    totalTodayTasks > 0 ? Math.round((completedTodayTasks / totalTodayTasks) * 100) : 0;

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
      {/* 1. Small Stat Cards: Journal, Streak, Tasks & Goals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="flex items-center gap-3.5 p-4">
          <div className="p-3 bg-surface border border-border rounded-md text-accent">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Total Entries</p>
            <p className="text-2xl font-bold text-text mt-0.5">{stats.totalEntries}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4">
          <div className="p-3 bg-surface border border-border rounded-md text-[#D97706]">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Writing Streak</p>
            <p className="text-2xl font-bold text-text mt-0.5">
              {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4">
          <div className="p-3 bg-surface border border-border rounded-md text-accent">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Today's Tasks</p>
            <p className="text-2xl font-bold text-text mt-0.5">
              {completedTodayTasks}
              <span className="text-sm font-normal text-text-muted ml-1">/ {totalTodayTasks}</span>
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4">
          <div className="p-3 bg-surface border border-border rounded-md text-accent">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Active Goals</p>
            <p className="text-2xl font-bold text-text mt-0.5">{stats.activeGoalsCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4">
          <div className="p-3 bg-surface border border-border rounded-md text-[#16A34A]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Goals Done</p>
            <p className="text-2xl font-bold text-text mt-0.5">{stats.goalsCompleted}</p>
          </div>
        </Card>
      </div>

      {/* 2. Interactive Today's Journal Tasks Widget */}
      <Card className="p-5 border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-border gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent/10 text-accent">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text">Today's Journal Tasks</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-accent font-semibold">
                  {completedTodayTasks} / {totalTodayTasks} completed
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Checklist items tied directly to your daily journal for today ({todayStr})
              </p>
            </div>
          </div>

          <Link
            href={`/journal/${todayStr}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline shrink-0"
          >
            <span>Open Today's Journal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Progress Bar */}
        {totalTodayTasks > 0 && (
          <div className="pt-3 pb-1">
            <div className="flex items-center justify-between text-[11px] text-text-muted mb-1 font-mono">
              <span>Task completion rate</span>
              <span className="font-bold text-text">{taskProgressPct}%</span>
            </div>
            <div className="w-full h-2 bg-background border border-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300 rounded-full"
                style={{ width: `${taskProgressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="pt-3 space-y-2">
          {todayTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {todayTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleToggleTask(task.id, task.is_completed)}
                  className={`flex items-center gap-3 p-3 rounded-md border text-left transition-all ${
                    task.is_completed
                      ? 'bg-surface/50 border-border opacity-70'
                      : 'bg-background border-border hover:border-accent/40'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0 ${
                      task.is_completed
                        ? 'bg-accent border-accent text-accent-contrast'
                        : 'border-border bg-surface hover:border-accent'
                    }`}
                  >
                    {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-xs transition-colors truncate ${
                      task.is_completed
                        ? 'line-through text-text-muted font-normal'
                        : 'text-text font-medium'
                    }`}
                  >
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center space-y-1">
              <p className="text-xs text-text-muted">
                No tasks added for today yet. Add key action items below or write them in today's journal.
              </p>
            </div>
          )}

          {/* Quick Add Form on Dashboard */}
          <form onSubmit={handleAddQuickTask} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Quick add a task to today's journal..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-background border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!quickTitle.trim() || addingQuickTask}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-surface text-text hover:bg-surface-hover disabled:opacity-50 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>
        </div>
      </Card>


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
