'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn, getTodayString } from '../../lib/utils';

interface CalendarViewProps {
  entryDates: Set<string>;
}

const DAYS_OF_WEEK = [
  { short: 'S', full: 'Sun' },
  { short: 'M', full: 'Mon' },
  { short: 'T', full: 'Tue' },
  { short: 'W', full: 'Wed' },
  { short: 'T', full: 'Thu' },
  { short: 'F', full: 'Fri' },
  { short: 'S', full: 'Sat' },
];

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

  const todayStr = getTodayString();

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
    <div className="bg-surface border border-border rounded-xl p-3 sm:p-5 shadow-xs">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <CalendarIcon className="w-4 h-4 text-accent shrink-0" />
          <h2 className="text-sm sm:text-base font-semibold text-text truncate">
            {monthNames[month]} {year}
          </h2>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs h-7 sm:h-8"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="p-1 sm:p-1.5 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="p-1 sm:p-1.5 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] sm:text-xs font-semibold text-text-muted mb-1.5 sm:mb-2">
        {DAYS_OF_WEEK.map((d, i) => (
          <span key={i}>
            <span className="sm:hidden">{d.short}</span>
            <span className="hidden sm:inline">{d.full}</span>
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="h-10 sm:h-14 rounded-md sm:rounded-lg bg-transparent"
              />
            );
          }

          const dateStr = formatDayString(day);
          const hasEntry = entryDates.has(dateStr);
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const isMissed = (isPast || isToday) && !hasEntry;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => router.push(`/journal/${dateStr}`)}
              className={cn(
                'h-10 sm:h-14 p-1 sm:p-1.5 rounded-md sm:rounded-lg border text-left transition-all flex flex-col justify-between group relative',
                hasEntry
                  ? 'bg-accent/5 dark:bg-accent/10 border-accent/40 hover:border-accent hover:bg-accent/10'
                  : isMissed
                  ? 'bg-background border-border hover:border-[#DC2626]/50 hover:bg-[#DC2626]/5'
                  : 'bg-background border-border hover:bg-surface-hover hover:border-text-muted',
                isToday && 'ring-2 ring-accent'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    'text-[11px] sm:text-xs font-semibold',
                    isToday ? 'text-accent font-bold' : hasEntry ? 'text-text font-bold' : isMissed ? 'text-text' : 'text-text-muted'
                  )}
                >
                  {day}
                </span>
                {hasEntry ? (
                  <span
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent shrink-0 shadow-2xs"
                    title="Entry recorded"
                  />
                ) : isMissed ? (
                  <span
                    className={cn(
                      'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#DC2626] dark:bg-[#EF4444] shrink-0 shadow-2xs',
                      isToday && 'animate-pulse'
                    )}
                    title={isToday ? "Today - No entry recorded yet" : "Missed journal entry"}
                  />
                ) : null}
              </div>

              {/* Sub-label visible on larger screens */}
              <div className="text-[10px] text-text-muted hidden sm:flex items-center justify-end w-full">
                {hasEntry ? (
                  <span className="text-[10px] font-medium text-accent">View</span>
                ) : isMissed ? (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#DC2626] dark:text-[#EF4444] font-medium">
                    Write
                  </span>
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

      {/* Calendar Legend */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-[11px] text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent inline-block shrink-0 shadow-2xs" />
          <span>Recorded</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] dark:bg-[#EF4444] inline-block shrink-0 shadow-2xs" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs border-2 border-accent inline-block shrink-0" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
