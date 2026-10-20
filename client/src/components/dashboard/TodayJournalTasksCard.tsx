'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ListTodo,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  BookOpen,
  Calendar,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate, getTodayString, cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

export interface TodayTaskItem {
  id: string;
  title: string;
  is_completed: boolean;
}

export interface TodayJournalTasksCardProps {
  initialTodayEntry?: { id: string; title: string; entry_date: string } | null;
  initialTasks?: TodayTaskItem[];
  onTaskChanged?: () => void;
}

export function TodayJournalTasksCard({
  initialTodayEntry,
  initialTasks = [],
  onTaskChanged,
}: TodayJournalTasksCardProps) {
  const toast = useToast();
  const todayStr = getTodayString();

  const [tasks, setTasks] = useState<TodayTaskItem[]>(initialTasks);
  const [hasEntry, setHasEntry] = useState<boolean>(Boolean(initialTodayEntry));
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Sync state if props update from dashboard summary
  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks);
    }
  }, [initialTasks]);

  useEffect(() => {
    setHasEntry(Boolean(initialTodayEntry));
  }, [initialTodayEntry]);

  // Fetch directly from journal endpoint for today to guarantee fresh data
  const fetchTodayData = useCallback(async () => {
    try {
      const res = await api.get<{ entry?: { id: string; tasks?: TodayTaskItem[] } }>(
        `/journal/${todayStr}`
      );
      if (res?.entry) {
        setHasEntry(true);
        if (Array.isArray(res.entry.tasks)) {
          setTasks(res.entry.tasks);
        }
      }
    } catch (err: any) {
      if (err?.status === 404) {
        setHasEntry(false);
      }
    }
  }, [todayStr]);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  const todayFormatted = formatDate(new Date().toISOString(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.is_completed).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Toggle task completion
  const handleToggle = async (taskId: string, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, is_completed: nextCompleted } : t))
    );

    try {
      await api.patch(`/journal/tasks/${taskId}/toggle`, {
        is_completed: nextCompleted,
      });
      toast.success(nextCompleted ? 'Task marked complete' : 'Task marked pending');
      onTaskChanged?.();
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: currentCompleted } : t))
      );
      toast.error(err?.message || 'Failed to update task');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = [...tasks];
    setTasks((curr) => curr.filter((t) => t.id !== taskId));

    try {
      await api.delete(`/journal/tasks/${taskId}`);
      toast.info('Task removed');
      onTaskChanged?.();
    } catch (err: any) {
      setTasks(prev);
      toast.error(err?.message || 'Failed to delete task');
    }
  };

  // Add task quickly from dashboard
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setAddingTask(true);
    try {
      const res = await api.post<{ task: TodayTaskItem }>(`/journal/${todayStr}/tasks`, {
        title: newTaskTitle.trim(),
      });
      if (res.task) {
        setTasks((prev) => [...prev, res.task]);
        setHasEntry(true);
        setNewTaskTitle('');
        toast.success('Task added for today');
        onTaskChanged?.();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add task');
    } finally {
      setAddingTask(false);
    }
  };

  /* ========================================================================= */
  /* EMPTY / PENDING VIEW: No tasks for today                                  */
  /* ========================================================================= */
  if (tasks.length === 0) {
    return (
      <section
        aria-label="Today's Journal & Tasks"
        className="bg-surface/95 backdrop-blur-sm border border-red-500/25 dark:border-red-500/35 rounded-xl p-4 sm:p-5 shadow-xs space-y-4"
      >
        {/* Header Row: Title + Date Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text leading-tight">
                {hasEntry ? "Today's Tasks" : "Today's Journal & Tasks"}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-text-muted mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                <span>{todayFormatted}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span>{hasEntry ? 'No tasks yet' : 'Pending entry'}</span>
            </span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <Link href={`/journal/${todayStr}`} className="inline-block shrink-0">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto font-semibold shadow-xs justify-center bg-accent hover:bg-accent-hover text-accent-contrast"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              <span>{hasEntry ? 'Open Journal' : "Write Today's Journal"}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          {/* Quick Task Form */}
          <form onSubmit={handleAddTask} className="flex-1 flex items-center gap-2">
            <Input
              placeholder="Add a priority task for today..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="py-1.5 text-base sm:text-sm"
            />
            <Button
              type="submit"
              variant="outline"
              size="md"
              loading={addingTask}
              className="shrink-0 text-xs px-3.5"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Add</span>
            </Button>
          </form>
        </div>
      </section>
    );
  }

  /* ========================================================================= */
  /* ACTIVE TASKS VIEW: Tasks exist for today                                  */
  /* ========================================================================= */
  return (
    <section
      aria-label="Today's Journal Tasks"
      className="bg-surface/95 backdrop-blur-sm border border-border/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-text leading-tight">
              Today&apos;s Tasks
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-text-muted mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>{todayFormatted}</span>
            </div>
          </div>
        </div>

        {/* Status Counter & Link to Entry */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="text-right">
            <span className="text-xs font-semibold text-text">
              {completedCount} of {totalCount} completed
            </span>
            <span className="text-[11px] text-text-muted ml-1.5 font-mono">
              ({percent}%)
            </span>
          </div>

          <Link href={`/journal/${todayStr}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs shrink-0">
              <BookOpen className="w-3.5 h-3.5 mr-1 text-accent" />
              <span>Open Journal</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-background rounded-full h-1.5 sm:h-2 overflow-hidden border border-border/60">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            percent === 100 ? 'bg-emerald-500' : 'bg-accent'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Task Items List */}
      <div className="space-y-2 pt-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleToggle(task.id, task.is_completed)}
            className={cn(
              'group flex items-center gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all duration-150',
              task.is_completed
                ? 'bg-background/40 border-border/60 text-text-muted'
                : 'bg-background border-border hover:border-accent hover:bg-surface-hover text-text'
            )}
            role="checkbox"
            aria-checked={task.is_completed}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggle(task.id, task.is_completed);
              }
            }}
          >
            <button
              type="button"
              className="shrink-0 text-text hover:text-accent focus:outline-none"
              aria-label={task.is_completed ? 'Mark task incomplete' : 'Mark task complete'}
            >
              {task.is_completed ? (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 fill-emerald-500/10" />
              ) : (
                <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted group-hover:text-accent transition-colors" />
              )}
            </button>

            <span
              className={cn(
                'flex-1 text-xs sm:text-sm leading-relaxed transition-all break-words',
                task.is_completed && 'line-through text-text-muted opacity-80'
              )}
            >
              {task.title}
            </span>

            {task.is_completed && (
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                Done
              </span>
            )}

            <button
              type="button"
              onClick={(e) => handleDeleteTask(task.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-500 rounded transition-opacity"
              aria-label="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Inline Quick Add Task Form */}
      <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-2 border-t border-border">
        <Input
          placeholder="Add another task for today..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="py-1.5 text-base sm:text-sm"
        />
        <Button
          type="submit"
          variant="outline"
          size="md"
          loading={addingTask}
          className="shrink-0 text-xs px-3.5"
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>Add</span>
        </Button>
      </form>
    </section>
  );
}
