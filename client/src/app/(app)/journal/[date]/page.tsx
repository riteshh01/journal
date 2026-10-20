'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Calendar,
  Eye,
  Edit2,
  Check,
  AlertCircle,
  Plus,
  ListTodo,
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { JournalEntry, JournalTask } from '../../../../types';
import { formatDate, renderSafeMarkdown } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { Input, Textarea } from '../../../../components/ui/Input';
import { Spinner } from '../../../../components/ui/Spinner';
import { Modal } from '../../../../components/ui/Modal';
import { Card } from '../../../../components/ui/Card';
import { useToast } from '../../../../components/ui/Toast';

export default function JournalDateEntryPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const dateStr = (params?.date as string) || '';

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [tasks, setTasks] = useState<JournalTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Compute previous and next date strings
  const getAdjacentDate = (offset: number) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    date.setDate(date.getDate() + offset);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const prevDate = getAdjacentDate(-1);
  const nextDate = getAdjacentDate(1);

  const fetchEntry = useCallback(async () => {
    if (!dateStr) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ entry: JournalEntry }>(`/journal/${dateStr}`);
      if (res.entry) {
        setEntry(res.entry);
        setTitle(res.entry.title || '');
        setContent(res.entry.content || '');
        setMood(res.entry.mood ?? null);
        setTasks(res.entry.tasks || []);
      }
    } catch (err: any) {
      // 404 simply means entry doesn't exist yet for this date, allow creating
      if (err.status === 404 || err.code === 'NOT_FOUND') {
        setEntry(null);
        setTitle('');
        setContent('');
        setMood(null);
        setTasks([]);
      } else {
        setError(err.message || 'Failed to fetch entry');
      }
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;

    setAddingTask(true);
    setTaskError(null);
    try {
      const res = await api.post<{ task: JournalTask }>(`/journal/${dateStr}/tasks`, {
        title: trimmed,
      });
      if (res.task) {
        setTasks((prev) => [...prev, res.task]);
        setNewTaskTitle('');
        toast.success('Task added');
        if (!entry) {
          // Sync entry existence so delete button and entry ID are aligned
          fetchEntry();
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to add task';
      setTaskError(msg);
      toast.error(msg);
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted;
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, is_completed: nextCompleted } : t))
    );

    try {
      await api.patch(`/journal/tasks/${taskId}/toggle`, {
        is_completed: nextCompleted,
      });
    } catch (err: any) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: currentCompleted } : t))
      );
      const msg = err.message || 'Failed to update task';
      setTaskError(msg);
      toast.error(msg);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const prevTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await api.delete(`/journal/tasks/${taskId}`);
      toast.info('Task removed');
    } catch (err: any) {
      setTasks(prevTasks);
      const msg = err.message || 'Failed to delete task';
      setTaskError(msg);
      toast.error(msg);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      const msg = 'Title is required to save a journal entry';
      setError(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await api.put<{ entry: JournalEntry }>(`/journal/${dateStr}`, {
        title: title.trim(),
        content: content,
        mood: mood,
      });

      setEntry(res.entry);
      if (res.entry.tasks) {
        setTasks(res.entry.tasks);
      }
      setSaveSuccess(true);
      toast.success('Journal entry saved successfully');
      router.push('/journal');
      router.refresh();
    } catch (err: any) {
      const msg = err.message || 'Failed to save entry';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/journal/${dateStr}`);
      setShowDeleteModal(false);
      toast.success('Journal entry deleted');
      router.push('/journal');
      router.refresh();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete entry';
      setError(msg);
      toast.error(msg);
      setDeleting(false);
    }
  };

  const moodOptions = [
    { value: 1, label: '1 - Low' },
    { value: 2, label: '2 - Down' },
    { value: 3, label: '3 - Neutral' },
    { value: 4, label: '4 - Good' },
    { value: 5, label: '5 - Great' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <Link
          href="/journal"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Calendar</span>
        </Link>

        {/* Previous & Next Day Navigation */}
        <div className="flex items-center gap-2">
          {prevDate && (
            <Link
              href={`/journal/${prevDate}`}
              className="p-1.5 rounded-md border border-border text-text hover:bg-surface transition-colors"
              title={`Previous day (${prevDate})`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
          <span className="text-xs font-bold text-accent px-2">
            {formatDate(dateStr, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {nextDate && (
            <Link
              href={`/journal/${nextDate}`}
              className="p-1.5 rounded-md border border-border text-text hover:bg-surface transition-colors"
              title={`Next day (${nextDate})`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">Loading entry for {dateStr}...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-3 bg-background border border-[#DC2626] rounded-md text-xs text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-background border border-[#16A34A] rounded-md text-xs text-[#16A34A] flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Journal entry saved successfully.</span>
            </div>
          )}

          {/* Entry Title & Mood Selector Card */}
          <Card className="space-y-4">
            <Input
              label="Entry Title"
              placeholder="e.g. A day of deep focus, reading, and walking"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-base font-semibold"
            />

            {/* Mood Selector (1 to 5) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text">Daily Mood (Optional)</label>
              <div className="grid grid-cols-5 gap-2">
                {moodOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMood(mood === opt.value ? null : opt.value)}
                    className={`py-2 px-1 text-xs font-semibold rounded-md border transition-colors ${
                      mood === opt.value
                        ? 'bg-accent text-accent-contrast border-accent'
                        : 'bg-background text-text border-border hover:bg-surface-hover'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Daily Tasks / Action Items Card */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-accent/10 text-accent">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                    Tasks & Action Items
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Track actionable checklist items for this journal entry
                  </p>
                </div>
              </div>
              {tasks.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface border border-border text-text">
                  {tasks.filter((t) => t.is_completed).length} of {tasks.length} Done
                </span>
              )}
            </div>

            {/* Progress Bar when tasks exist */}
            {tasks.length > 0 && (
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-background border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.round(
                        (tasks.filter((t) => t.is_completed).length / tasks.length) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {taskError && (
              <div className="p-2.5 bg-background border border-[#DC2626] rounded-md text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{taskError}</span>
              </div>
            )}

            {/* Task Items List */}
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`group flex items-center justify-between p-2.5 rounded-md border transition-all ${
                    task.is_completed
                      ? 'bg-surface/50 border-border opacity-75'
                      : 'bg-background border-border hover:border-accent/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id, task.is_completed)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
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

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-[#DC2626] transition-opacity ml-2 shrink-0"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {tasks.length === 0 && (
                <p className="text-xs text-text-muted italic py-1">
                  No tasks added for this entry yet. Add your daily action items below.
                </p>
              )}
            </div>

            {/* Inline Add Task Form */}
            <div className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Add a task for today (e.g. Complete chapter 4)..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTask(e);
                  }
                }}
                className="text-base sm:text-xs flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTask}
                loading={addingTask}
                disabled={!newTaskTitle.trim() || addingTask}
                className="shrink-0 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Task
              </Button>
            </div>
          </Card>

          {/* Entry Content Card with Markdown toggle */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <label className="text-xs font-semibold text-text uppercase tracking-wider">
                Journal Content
              </label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={!previewMode ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode(false)}
                  className="px-2.5 py-1 text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Write
                </Button>
                <Button
                  type="button"
                  variant={previewMode ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode(true)}
                  className="px-2.5 py-1 text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Preview
                </Button>
              </div>
            </div>

            {!previewMode ? (
              <Textarea
                placeholder="Write your thoughts, observations, wins, and lessons for today (Markdown supported)..."
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-sm leading-relaxed"
              />
            ) : (
              <div className="min-h-[20rem] p-4 bg-background border border-border rounded-md text-sm text-text leading-relaxed">
                {content ? (
                  <div
                    className="prose dark:prose-invert max-w-none space-y-2"
                    dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(content) }}
                  />
                ) : (
                  <p className="text-text-muted italic">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </Card>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {entry && (
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Entry
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={saving}
              >
                <Save className="w-4 h-4 mr-1.5" />
                {entry ? 'Update Entry' : 'Save Entry'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Journal Entry"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            Are you sure you want to permanently delete your journal entry for{' '}
            <strong className="text-accent">{formatDate(dateStr)}</strong>? This cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
