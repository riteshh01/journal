'use client';

import React, { useState } from 'react';
import { Edit2, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../lib/utils';
import { Button } from '../ui/Button';

export function Banner() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [mottoText, setMottoText] = useState(user?.banner_text || '');
  const [saving, setSaving] = useState(false);

  const todayFormatted = formatDate(new Date().toISOString(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleStartEdit = () => {
    setMottoText(user?.banner_text || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setMottoText(user?.banner_text || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({
        display_name: user.display_name,
        banner_text: mottoText.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update motto:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-surface border border-border rounded-lg p-6 sm:p-8 mb-8" aria-label="Personal Banner">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{todayFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
            Welcome back, {user?.display_name || 'Friend'}
          </h1>

          {/* Personal Motto / Statement Section */}
          <div className="mt-3 max-w-2xl">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
                <input
                  type="text"
                  value={mottoText}
                  onChange={(e) => setMottoText(e.target.value)}
                  placeholder="Set your daily motto or personal statement..."
                  maxLength={255}
                  className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-md text-text focus:outline-none focus:border-accent"
                  autoFocus
                />
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSave}
                    loading={saving}
                    aria-label="Save statement"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    aria-label="Cancel editing"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 group">
                <p className="text-sm text-text-muted italic">
                  "{user?.banner_text || 'No personal statement set yet. Click edit to define your daily motto.'}"
                </p>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="text-text-muted hover:text-accent p-1 transition-colors"
                  aria-label="Edit personal statement"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
