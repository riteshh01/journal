'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Barlow_Condensed } from 'next/font/google';
import { Clock, ArrowUpDown, Calendar, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const font = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700'] });

/* ---------------------------------- types --------------------------------- */

type SpanId = 'day' | 'month' | 'year';
type TimerMode = 'countdown' | 'elapsed';

interface SpanConfig {
  id: SpanId;
  label: string;
  badge: string;
  accentColor: string;
  accentBg: string;
}

const SPAN_CONFIGS: Record<SpanId, SpanConfig> = {
  day: {
    id: 'day',
    label: 'Today',
    badge: 'Day',
    accentColor: 'var(--accent)',
    accentBg: 'rgba(37, 99, 235, 0.08)',
  },
  month: {
    id: 'month',
    label: 'Month',
    badge: 'Month',
    accentColor: '#10B981',
    accentBg: 'rgba(16, 185, 129, 0.08)',
  },
  year: {
    id: 'year',
    label: 'Year',
    badge: 'Year',
    accentColor: '#F59E0B',
    accentBg: 'rgba(245, 158, 11, 0.08)',
  },
};

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/* ----------------------- smooth kinetic rolling digit --------------------- */

interface DigitProps {
  digit: string;
  urgent?: boolean;
  width?: number;
  direction?: 'down' | 'up';
}

function SmoothRollingDigit({
  digit,
  urgent = false,
  width = 16,
  direction = 'down',
}: DigitProps) {
  const isDown = direction === 'down';

  return (
    <span
      className="relative inline-flex items-center justify-center select-none overflow-hidden rounded-[3.5px]"
      style={{
        width: `${width}px`,
        height: '24px',
        backgroundColor: urgent ? '#DC2626' : '#0F172A',
        color: '#F8FAFC',
        boxShadow: '0 1px 2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
      aria-hidden="true"
    >
      {/* Subtle top & bottom vignette for smooth rolling depth */}
      <span className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-[#0F172A]/40 via-transparent to-[#0F172A]/40" />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{
            y: isDown ? '-100%' : '100%',
            opacity: 0.15,
            scale: 0.94,
          }}
          animate={{
            y: '0%',
            opacity: 1,
            scale: 1,
          }}
          exit={{
            y: isDown ? '100%' : '-100%',
            opacity: 0.15,
            scale: 0.94,
          }}
          transition={{
            y: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.25, ease: 'easeOut' },
            scale: { duration: 0.3, ease: 'easeOut' },
          }}
          className="font-mono text-[15px] font-bold leading-none tracking-tight block"
        >
          {digit}
        </motion.span>
      </AnimatePresence>

      {/* Tactile horizontal center seam */}
      <span
        className="absolute left-0 right-0 pointer-events-none z-10"
        style={{
          top: '50%',
          height: '1px',
          background: 'rgba(255, 255, 255, 0.08)',
          transform: 'translateY(-0.5px)',
        }}
      />
    </span>
  );
}

/* -------------------------- radial progress ring -------------------------- */

function RadialGauge({
  percent,
  accentColor,
  accentBg,
}: {
  percent: number;
  accentColor: string;
  accentBg: string;
}) {
  const r = 16;
  const c = 2 * Math.PI * r; // ~100.53
  const strokeDashoffset = c * (1 - Math.min(Math.max(percent / 100, 0), 1));

  return (
    <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
      <svg className="w-10 h-10 -rotate-90 transform" viewBox="0 0 38 38">
        {/* Soft tinted disc background */}
        <circle cx="19" cy="19" r={r} fill={accentBg} />
        {/* Background track circle */}
        <circle
          cx="19"
          cy="19"
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="3.2"
        />
        {/* Animated fill stroke */}
        <circle
          cx="19"
          cy="19"
          r={r}
          fill="none"
          stroke={accentColor}
          strokeWidth="3.2"
          strokeDasharray={c}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold font-mono tracking-tighter text-text">
        {Math.round(percent)}%
      </span>
    </div>
  );
}

/* -------------------------------- main UI --------------------------------- */

export default function TimeFlies() {
  const [now, setNow] = useState<number | null>(null);
  const [mode, setMode] = useState<TimerMode>('countdown');

  // RAF loop for exact 1-second ticks and 60fps velocity track sweep
  const barRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let raf = 0;
    let lastSec = -1;

    const loop = () => {
      const t = Date.now();
      const sec = Math.floor(t / 1000);

      if (sec !== lastSec) {
        lastSec = sec;
        setNow(t);
      }

      // Smooth hairline progress bar update without re-rendering state
      const n = new Date(t);
      const y = n.getFullYear();
      const m = n.getMonth();
      const d = n.getDate();

      const spans = [
        { id: 'day', s: new Date(y, m, d).getTime(), e: new Date(y, m, d + 1).getTime() },
        { id: 'month', s: new Date(y, m, 1).getTime(), e: new Date(y, m + 1, 1).getTime() },
        { id: 'year', s: new Date(y, 0, 1).getTime(), e: new Date(y + 1, 0, 1).getTime() },
      ];

      for (const sp of spans) {
        const el = barRefs.current[sp.id];
        if (el) {
          const total = sp.e - sp.s;
          const ratio = Math.min(Math.max((t - sp.s) / total, 0), 1);
          el.style.transform = `scaleX(${ratio})`;
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const data = useMemo(() => {
    if (now === null) return null;

    const n = new Date(now);
    const y = n.getFullYear();
    const m = n.getMonth();
    const d = n.getDate();

    // Day
    const dayStart = new Date(y, m, d).getTime();
    const dayEnd = new Date(y, m, d + 1).getTime();
    const dayTotal = dayEnd - dayStart;
    const dayElapsed = now - dayStart;
    const dayLeft = Math.max(dayEnd - now, 0);
    const dayRatio = dayElapsed / dayTotal;

    // Month
    const monthStart = new Date(y, m, 1).getTime();
    const monthEnd = new Date(y, m + 1, 1).getTime();
    const monthTotal = monthEnd - monthStart;
    const monthElapsed = now - monthStart;
    const monthLeft = Math.max(monthEnd - now, 0);
    const monthRatio = monthElapsed / monthTotal;
    const monthName = n.toLocaleString('en-US', { month: 'long' });
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    // Year
    const yearStart = new Date(y, 0, 1).getTime();
    const yearEnd = new Date(y + 1, 0, 1).getTime();
    const yearTotal = yearEnd - yearStart;
    const yearElapsed = now - yearStart;
    const yearLeft = Math.max(yearEnd - now, 0);
    const yearRatio = yearElapsed / yearTotal;

    return {
      now,
      day: {
        title: 'Today',
        sub: n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        ratio: dayRatio,
        targetSec: Math.floor((mode === 'countdown' ? dayLeft : dayElapsed) / 1000),
      },
      month: {
        title: monthName,
        sub: `${daysInMonth} days • ${y}`,
        ratio: monthRatio,
        targetSec: Math.floor((mode === 'countdown' ? monthLeft : monthElapsed) / 1000),
      },
      year: {
        title: `${y}`,
        sub: `Year ${y}`,
        ratio: yearRatio,
        targetSec: Math.floor((mode === 'countdown' ? yearLeft : yearElapsed) / 1000),
      },
    };
  }, [now, mode]);

  if (!data) {
    return (
      <div className="w-full h-24 bg-surface border border-border rounded-lg animate-pulse" />
    );
  }

  const currentDateObj = new Date(data.now);
  const liveClock = currentDateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const toggleMode = () => {
    setMode((prev) => (prev === 'countdown' ? 'elapsed' : 'countdown'));
  };

  const direction = mode === 'countdown' ? 'down' : 'up';

  return (
    <section
      className={`w-full bg-surface border border-border rounded-lg p-3 space-y-2.5 transition-all ${font.className}`}
      aria-label="Temporal Velocity countdown for current Day, Month, and Year"
    >
      {/* Top Console Strip */}
      <div className="flex items-center justify-between pb-2 border-b border-border/70 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-background border border-border rounded text-accent flex items-center justify-center">
            <Clock className="w-3 h-3" />
          </div>
          <span className="font-bold tracking-wider uppercase text-text text-[11px]">
            Temporal Velocity
          </span>
          <span className="text-[10px] text-text-muted px-1.5 py-0.2 rounded bg-background border border-border font-mono">
            {mode === 'countdown' ? 'Remaining' : 'Elapsed'}
          </span>
        </div>

        {/* Action Toggle & Live Clock */}
        <div className="flex items-center gap-2.5">
          <button
            id="timer-mode-toggle"
            type="button"
            onClick={toggleMode}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-text-muted hover:text-text bg-background border border-border hover:border-text-muted transition-colors cursor-pointer"
            title="Click to toggle between Remaining and Elapsed time"
          >
            <ArrowUpDown className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">
              {mode === 'countdown' ? 'Show Elapsed' : 'Show Remaining'}
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="font-mono text-text font-semibold text-xs tracking-tight">
              {liveClock}
            </span>
          </div>
        </div>
      </div>

      {/* 3-Column Compact Instrument Grid: Day, Month, Year */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {(['day', 'month', 'year'] as SpanId[]).map((id) => {
          const cfg = SPAN_CONFIGS[id];
          const info = data[id];
          const sec = info.targetSec;

          const days = Math.floor(sec / 86400);
          const hours = Math.floor((sec % 86400) / 3600);
          const min = Math.floor((sec % 3600) / 60);
          const s = sec % 60;

          const isUrgent = id === 'day' && mode === 'countdown' && hours === 0;

          return (
            <div
              key={id}
              onClick={toggleMode}
              title="Click to toggle Remaining / Elapsed"
              className="group relative bg-background border border-border/80 rounded-md p-2.5 flex items-center justify-between gap-3 overflow-hidden transition-all hover:border-text-muted/40 cursor-pointer"
            >
              {/* Left: Mini Radial Progress Gauge */}
              <RadialGauge
                percent={info.ratio * 100}
                accentColor={cfg.accentColor}
                accentBg={cfg.accentBg}
              />

              {/* Right: Info & Smooth Rolling Digits */}
              <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
                {/* Header: Title & Remaining/Elapsed status badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-xs text-text tracking-tight truncate">
                      {info.title}
                    </span>
                    <span className="text-[10px] text-text-muted truncate hidden sm:inline">
                      • {info.sub}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted font-medium shrink-0">
                    {mode === 'countdown'
                      ? id === 'day'
                        ? `${hours}h ${min}m left`
                        : `${days}d left`
                      : id === 'day'
                      ? `${hours}h ${min}m past`
                      : `${days}d past`}
                  </span>
                </div>

                {/* Smooth Rolling Digit Row with colon separators */}
                <div className="flex items-center gap-1 select-none overflow-x-auto py-0.5">
                  {id !== 'day' && (
                    <div className="flex items-center gap-0.5 mr-1">
                      {pad(days, id === 'year' ? 3 : 2)
                        .split('')
                        .map((ch, idx) => (
                          <SmoothRollingDigit
                            key={`d-${idx}`}
                            digit={ch}
                            direction={direction}
                            width={id === 'year' ? 14 : 15}
                          />
                        ))}
                      <span className="text-[9px] font-mono text-text-muted font-bold ml-0.5">
                        d
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-0.5">
                    {pad(hours)
                      .split('')
                      .map((ch, idx) => (
                        <SmoothRollingDigit
                          key={`h-${idx}`}
                          digit={ch}
                          urgent={isUrgent}
                          direction={direction}
                          width={15}
                        />
                      ))}
                  </div>

                  <span className="text-text-muted/70 font-bold text-xs -mt-0.5">:</span>

                  <div className="flex items-center gap-0.5">
                    {pad(min)
                      .split('')
                      .map((ch, idx) => (
                        <SmoothRollingDigit
                          key={`m-${idx}`}
                          digit={ch}
                          direction={direction}
                          width={15}
                        />
                      ))}
                  </div>

                  <span className="text-text-muted/70 font-bold text-xs -mt-0.5">:</span>

                  <div className="flex items-center gap-0.5">
                    {pad(s)
                      .split('')
                      .map((ch, idx) => (
                        <SmoothRollingDigit
                          key={`s-${idx}`}
                          digit={ch}
                          direction={direction}
                          width={15}
                        />
                      ))}
                  </div>
                </div>
              </div>

              {/* Bottom Hairline Velocity Track */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-border/40 pointer-events-none"
                aria-hidden="true"
              >
                <div
                  ref={(el) => {
                    barRefs.current[id] = el;
                  }}
                  className="h-full rounded-r-full transition-transform will-change-transform"
                  style={{
                    backgroundColor: cfg.accentColor,
                    transformOrigin: 'left',
                    transform: `scaleX(${info.ratio})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
