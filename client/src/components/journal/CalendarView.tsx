'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface CalendarViewProps {
  entryDates: Set<string>;
}

export function CalendarView({ entryDates }: CalendarViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDayString = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const calendarCells = [];
  // Empty padding cells for previous month days
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-accent" />
          <h2 className="text-base font-semibold text-text">
            {monthNames[month]} {year}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={handleToday} className="px-2.5 py-1 text-xs">
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="p-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="p-1.5"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-muted mb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-16 rounded-md bg-transparent" />;
          }

          const dateStr = formatDayString(day);
          const hasEntry = entryDates.has(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => router.push(`/journal/${dateStr}`)}
              className={cn(
                'h-16 p-1.5 rounded-md border text-left transition-colors flex flex-col justify-between group relative',
                hasEntry
                  ? 'bg-background border-accent/40 hover:border-accent'
                  : 'bg-background border-border hover:bg-surface-hover hover:border-text-muted',
                isToday && 'ring-2 ring-accent'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    'text-xs font-semibold',
                    isToday ? 'text-accent' : 'text-text'
                  )}
                >
                  {day}
                </span>
                {hasEntry && (
                  <span className="w-2 h-2 rounded-full bg-accent" title="Entry recorded" />
                )}
              </div>

              <div className="text-[10px] text-text-muted flex items-center justify-end w-full">
                {hasEntry ? (
                  <span className="text-[10px] font-medium text-accent">View</span>
                ) : (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted">
                    <Edit3 className="w-3 h-3" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
