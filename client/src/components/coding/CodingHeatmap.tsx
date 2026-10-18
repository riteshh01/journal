'use client';

import React, { useState } from 'react';
import { DailyActivityItem } from '../../types';
import { formatDate } from '../../lib/utils';

interface CodingHeatmapProps {
  activity: DailyActivityItem[];
  onSelectDate?: (date: string) => void;
}

export function CodingHeatmap({ activity, onSelectDate }: CodingHeatmapProps) {
  const [hoveredItem, setHoveredItem] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const weeks: (DailyActivityItem | null)[][] = [];
  let currentWeek: (DailyActivityItem | null)[] = [];

  if (activity.length > 0) {
    const firstDate = new Date(activity[0].date);
    const firstDayOfWeek = firstDate.getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
  }

  activity.forEach((item) => {
    currentWeek.push(item);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, wIdx) => {
    const validDay = week.find((d) => d !== null);
    if (validDay) {
      const month = new Date(validDay.date).getMonth();
      if (month !== lastMonth) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthLabels.push({ label: monthNames[month], weekIndex: wIdx });
        lastMonth = month;
      }
    }
  });

  const getCellClass = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 1:
        return 'bg-accent/30 border border-accent/40';
      case 2:
        return 'bg-accent/60 border border-accent/70';
      case 3:
        return 'bg-accent/85 border border-accent/90';
      case 4:
        return 'bg-accent border border-accent';
      default:
        return 'bg-surface border border-border/80';
    }
  };

  return (
    <div className="relative bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-text">Problem Solving Activity</h3>
          <p className="text-xs text-text-muted">Daily submissions record over the past 365 days</p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-surface border border-border/80" title="0 problems" />
            <span className="w-3 h-3 rounded-sm bg-accent/30 border border-accent/40" title="1-2 problems" />
            <span className="w-3 h-3 rounded-sm bg-accent/60 border border-accent/70" title="3-5 problems" />
            <span className="w-3 h-3 rounded-sm bg-accent/85 border border-accent/90" title="6-9 problems" />
            <span className="w-3 h-3 rounded-sm bg-accent border border-accent" title="10+ problems" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          <div className="flex ml-8 mb-1.5 text-[10px] text-text-muted h-4 relative">
            {monthLabels.map((m, i) => (
              <span
                key={`${m.label}-${i}`}
                style={{ left: `${m.weekIndex * 14}px` }}
                className="absolute"
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col justify-between text-[10px] text-text-muted py-0.5 select-none w-6">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={`week-${wIdx}`} className="flex flex-col gap-1">
                  {week.map((day, dIdx) => {
                    if (!day) {
                      return <div key={`empty-${wIdx}-${dIdx}`} className="w-2.5 h-2.5 rounded-sm bg-transparent" />;
                    }

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => onSelectDate?.(day.date)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredItem({
                            date: day.date,
                            count: day.count,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`w-2.5 h-2.5 rounded-sm cursor-pointer transition-transform hover:scale-125 focus:outline-none ${getCellClass(
                          day.level
                        )}`}
                        aria-label={`${day.count} problems solved on ${day.date}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hoveredItem && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredItem.x}px`,
            top: `${hoveredItem.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 pointer-events-none px-2.5 py-1 bg-surface border border-border text-xs rounded-md shadow-none whitespace-nowrap"
        >
          <span className="font-bold text-accent">{hoveredItem.count}</span>{' '}
          <span className="text-text">
            {hoveredItem.count === 1 ? 'problem' : 'problems'} solved on {formatDate(hoveredItem.date)}
          </span>
        </div>
      )}
    </div>
  );
}
