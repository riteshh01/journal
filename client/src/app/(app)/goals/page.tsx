'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Pause,
  XCircle,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { Goal, GoalStatus, PriorityLevel } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import { Input, Textarea } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';
import { Card } from '../../../components/ui/Card';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('active');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [progress, setProgress] = useState(0);
  const [targetDate, setTargetDate] = useState('');

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams: Record<string, string | number> = { limit: 100 };
      if (statusFilter !== 'all') queryParams.status = statusFilter;

      const res = await api.get<{ goals: Goal[] }>('/goals', queryParams);
      setGoals(res.goals || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setPriority('medium');
    setStatus('active');
    setProgress(0);
    setTargetDate('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category || '');
    setPriority(goal.priority);
    setStatus(goal.status);
    setProgress(goal.progress);
    setTargetDate(goal.target_date || '');
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setActionLoading(true);
    try {
      const res = await api.post<{ goal: Goal }>('/goals', {
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        priority,
        status,
        progress,
        target_date: targetDate || null,
      });

      setGoals((prev) => [res.goal, ...prev]);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create goal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !title.trim()) return;

    setActionLoading(true);
    try {
      const res = await api.patch<{ goal: Goal }>(`/goals/${editingGoal.id}`, {
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        priority,
        status,
        progress,
        target_date: targetDate || null,
      });

      setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? res.goal : g)));
      setEditingGoal(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update goal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickProgress = async (goal: Goal, delta: number) => {
    const nextProgress = Math.min(Math.max(goal.progress + delta, 0), 100);
    const nextStatus: GoalStatus = nextProgress === 100 ? 'completed' : goal.status;

    try {
      // Optimistic update
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goal.id ? { ...g, progress: nextProgress, status: nextStatus } : g
        )
      );

      const res = await api.patch<{ goal: Goal }>(`/goals/${goal.id}`, {
        progress: nextProgress,
        status: nextStatus,
      });

      setGoals((prev) => prev.map((g) => (g.id === goal.id ? res.goal : g)));
    } catch {
      fetchGoals();
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;
    setActionLoading(true);
    try {
      await api.delete(`/goals/${deletingGoal.id}`);
      setGoals((prev) => prev.filter((g) => g.id !== deletingGoal.id));
      setDeletingGoal(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete goal');
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadge = (p: PriorityLevel) => {
    const styles = {
      low: 'text-[#64748B] border-[#64748B]/30 bg-surface',
      medium: 'text-[#D97706] border-[#D97706]/30 bg-surface',
      high: 'text-[#DC2626] border-[#DC2626]/30 bg-surface',
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded border ${styles[p]}`}>
        {p}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Goals & Priorities</h1>
          <p className="text-xs text-text-muted mt-1">
            Track lifelong aspirations, quarterly milestones, and progress.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Goal
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1.5 overflow-x-auto">
        {(['active', 'all', 'completed', 'paused', 'dropped'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize whitespace-nowrap ${
              statusFilter === s
                ? 'bg-background text-accent border border-border'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {s} Goals
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">Loading goals...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-surface border border-[#DC2626] rounded-lg text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-[#DC2626] mx-auto" />
          <p className="text-sm font-semibold text-text">Error loading goals</p>
          <p className="text-xs text-text-muted">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchGoals} className="mt-2">
            Retry
          </Button>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-lg p-8">
          <p className="text-sm font-semibold text-text">No goals found</p>
          <p className="text-xs text-text-muted mt-1">
            {statusFilter !== 'all'
              ? `No ${statusFilter} goals found.`
              : 'Add your first goal to begin tracking milestones.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    {goal.category && (
                      <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                        {goal.category}
                      </span>
                    )}
                    <h2 className="text-base font-semibold text-text">{goal.title}</h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getPriorityBadge(goal.priority)}
                    <span className="text-[10px] uppercase font-semibold text-text-muted px-1.5 py-0.5 rounded border border-border bg-background">
                      {goal.status}
                    </span>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-xs text-text-muted leading-relaxed">
                    {goal.description}
                  </p>
                )}

                {goal.target_date && (
                  <div className="flex items-center gap-1 text-[11px] text-text-muted pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target: {formatDate(goal.target_date)}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar & Quick Adjusters */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-medium">Completion</span>
                  <span className="font-bold text-accent">{goal.progress}%</span>
                </div>
                <div className="w-full h-2 bg-background border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300 rounded-full"
                    style={{ width: `${goal.progress}%` }}
                    role="progressbar"
                    aria-valuenow={goal.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>

                {/* Quick increment buttons & Edit/Delete actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickProgress(goal, -10)}
                      disabled={goal.progress <= 0}
                      className="px-2 py-0.5 text-xs h-7"
                    >
                      -10%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickProgress(goal, 10)}
                      disabled={goal.progress >= 100}
                      className="px-2 py-0.5 text-xs h-7"
                    >
                      +10%
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(goal)}
                      aria-label="Edit goal"
                      className="p-1.5 text-text-muted hover:text-accent h-7"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingGoal(goal)}
                      aria-label="Delete goal"
                      className="p-1.5 text-text-muted hover:text-[#DC2626] h-7"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={isCreateModalOpen || Boolean(editingGoal)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
      >
        <form onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal} className="space-y-4">
          <Input
            label="Goal Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Run 10km under 50 minutes"
            autoFocus
          />

          <Textarea
            label="Description (Optional)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Strategy, motivation, or milestones..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category (Optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Health, Career, Learning"
              maxLength={50}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 text-sm bg-background text-text border border-border rounded-md focus:outline-none focus:border-accent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full px-3 py-2 text-sm bg-background text-text border border-border rounded-md focus:outline-none focus:border-accent"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>

            <Input
              label={`Progress (${progress}%)`}
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value, 10))}
              className="mt-2"
            />
          </div>

          <Input
            label="Target Date (Optional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingGoal(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={actionLoading}
            >
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingGoal)}
        onClose={() => setDeletingGoal(null)}
        title="Delete Goal"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            Are you sure you want to permanently delete goal{' '}
            <strong className="text-accent">{deletingGoal?.title}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingGoal(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteGoal}
              loading={actionLoading}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
