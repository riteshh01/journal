'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Barlow_Condensed } from 'next/font/google';
import {
  Clock,
  Sun,
  CalendarDays,
  Orbit,
  Activity,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
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
  glowGradient: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SPAN_CONFIGS: Record<SpanId, SpanConfig> = {
  day: {
    id: 'day',
    label: 'Today',
    badge: 'Day Cycle',
    accentColor: '#3B82F6',
    accentBg: 'rgba(59, 130, 246, 0.12)',
    glowGradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
    icon: Sun,
  },
  month: {
    id: 'month',
    label: 'Month',
    badge: 'Month Cycle',
    accentColor: '#10B981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    glowGradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    icon: CalendarDays,
  },
  year: {
    id: 'year',
    label: 'Year',
    badge: 'Solar Orbit',
    accentColor: '#F59E0B',
    accentBg: 'rgba(245, 158, 11, 0.12)',
    glowGradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
    icon: Orbit,
  },
};

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/* ----------------------- precision rolling digit tile --------------------- */

interface DigitProps {
  digit: string;
  urgent?: boolean;
  width?: number;
  height?: number;
  direction?: 'down' | 'up';
}

function SmoothRollingDigit({
  digit,
  urgent = false,
  width = 17,
  height = 27,
  direction = 'down',
}: DigitProps) {
  const isDown = direction === 'down';

  return (
    <span
      className="relative inline-flex items-center justify-center select-none overflow-hidden rounded-[4px]"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: urgent ? '#991B1B' : '#0B1120',
        color: '#F8FAFC',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
      aria-hidden="true"
    >
      {/* Top and bottom vignette depth */}
      <span className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-black/50 via-transparent to-black/50" />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{
            y: isDown ? '-100%' : '100%',
            opacity: 0.2,
            scale: 0.92,
          }}
          animate={{
            y: '0%',
            opacity: 1,
            scale: 1,
          }}
          exit={{
            y: isDown ? '100%' : '-100%',
            opacity: 0.2,
            scale: 0.92,
          }}
          transition={{
            y: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.2, ease: 'easeOut' },
            scale: { duration: 0.25, ease: 'easeOut' },
          }}
          className="font-mono text-[16px] sm:text-[17px] font-black leading-none tracking-tight block text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
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
          background: 'rgba(255, 255, 255, 0.12)',
          boxShadow: '0 1px 1px rgba(0,0,0,0.6)',
          transform: 'translateY(-0.5px)',
        }}
      />
    </span>
  );
}

/* -------------------------- luminous radial gauge -------------------------- */

function RadialGauge({
  percent,
  accentColor,
  accentBg,
  size = 46,
}: {
  percent: number;
  accentColor: string;
  accentBg: string;
  size?: number;
}) {
  const strokeWidth = 3.6;
  const r = (size - strokeWidth * 2) / 2;
  const c = 2 * Math.PI * r;
  const safePercent = Math.min(Math.max(percent, 0), 100);
  const strokeDashoffset = c * (1 - safePercent / 100);

  return (
    <div
      className="relative flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size }}
    >
      <svg
        className="-rotate-90 transform"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Soft tinted disc background */}
        <circle cx={size / 2} cy={size / 2} r={r} fill={accentBg} />
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          strokeOpacity={0.6}
        />
        {/* Animated fill stroke with subtle glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={{
            filter: `drop-shadow(0 0 3px ${accentColor}80)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-black font-mono tracking-tighter text-text">
          {Math.round(safePercent)}%
        </span>
      </div>
    </div>
  );
}

/* -------------------------------- main UI --------------------------------- */

export default function TimeFlies() {
  const [now, setNow] = useState<number | null>(null);
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [activeSpan, setActiveSpan] = useState<SpanId>('day');

  // RAF loop for exact 1-second ticks and 60fps velocity track sweep
  const barElements = useRef<Record<SpanId, Set<HTMLDivElement>>>({
    day: new Set(),
    month: new Set(),
    year: new Set(),
  });

  const registerBarRef = (id: SpanId, el: HTMLDivElement | null) => {
    if (el) {
      barElements.current[id].add(el);
    }
  };

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
        { id: 'day' as SpanId, s: new Date(y, m, d).getTime(), e: new Date(y, m, d + 1).getTime() },
        { id: 'month' as SpanId, s: new Date(y, m, 1).getTime(), e: new Date(y, m + 1, 1).getTime() },
        { id: 'year' as SpanId, s: new Date(y, 0, 1).getTime(), e: new Date(y + 1, 0, 1).getTime() },
      ];

      for (const sp of spans) {
        const els = barElements.current[sp.id];
        const total = sp.e - sp.s;
        const ratio = Math.min(Math.max((t - sp.s) / total, 0), 1);
        els.forEach((el) => {
          if (el) el.style.transform = `scaleX(${ratio})`;
        });
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
      <div className="w-full h-32 bg-surface border border-border rounded-xl animate-pulse" />
    );
  }

  const currentDateObj = new Date(data.now);
  const liveClock = currentDateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const direction = mode === 'countdown' ? 'down' : 'up';

  const renderCard = (id: SpanId, isMobile = false) => {
    const cfg = SPAN_CONFIGS[id];
    const info = data[id];
    const sec = info.targetSec;
    const Icon = cfg.icon;

    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const min = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    const isUrgent = id === 'day' && mode === 'countdown' && hours === 0;

    return (
      <div
        key={`${id}-${isMobile ? 'mobile' : 'desktop'}`}
        className="group relative bg-background border border-border/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 overflow-hidden transition-all duration-300 hover:border-border hover:shadow-md hover:-translate-y-0.5"
      >
        {/* Ambient radial glow at top-right of card */}
        <div
          className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${cfg.glowGradient} blur-2xl pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity`}
          aria-hidden="true"
        />

        {/* Card Header: Icon badge, Title, Subtitle & Radial Gauge */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs"
              style={{
                backgroundColor: cfg.accentBg,
                borderColor: `${cfg.accentColor}30`,
                color: cfg.accentColor,
              }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-text tracking-tight truncate">
                  {info.title}
                </span>
              </div>
              <p className="text-[11px] text-text-muted truncate font-medium">
                {info.sub}
              </p>
            </div>
          </div>

          {/* Circular Radial Percentage Ring */}
          <RadialGauge
            percent={info.ratio * 100}
            accentColor={cfg.accentColor}
            accentBg={cfg.accentBg}
            size={44}
          />
        </div>

        {/* Centerpiece: Precision Chronometer Digit Blocks with Unit Sub-Labels */}
        <div className="relative z-10 flex items-center justify-start gap-1 sm:gap-1.5 select-none py-1">
          {id !== 'day' && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-0.5">
                {pad(days, id === 'year' ? 3 : 2)
                  .split('')
                  .map((ch, idx) => (
                    <SmoothRollingDigit
                      key={`d-${idx}`}
                      digit={ch}
                      direction={direction}
                      width={id === 'year' ? 15 : 16}
                      height={28}
                    />
                  ))}
              </div>
              <span className="text-[8.5px] font-mono uppercase font-bold text-text-muted/80 mt-1 tracking-wider">
                DAYS
              </span>
            </div>
          )}

          {id !== 'day' && (
            <span className="text-text-muted/50 font-black text-sm pb-3">:</span>
          )}

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              {pad(hours)
                .split('')
                .map((ch, idx) => (
                  <SmoothRollingDigit
                    key={`h-${idx}`}
                    digit={ch}
                    urgent={isUrgent}
                    direction={direction}
                    width={16}
                    height={28}
                  />
                ))}
            </div>
            <span className="text-[8.5px] font-mono uppercase font-bold text-text-muted/80 mt-1 tracking-wider">
              HOURS
            </span>
          </div>

          <span className="text-text-muted/50 font-black text-sm pb-3">:</span>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              {pad(min)
                .split('')
                .map((ch, idx) => (
                  <SmoothRollingDigit
                    key={`m-${idx}`}
                    digit={ch}
                    direction={direction}
                    width={16}
                    height={28}
                  />
                ))}
            </div>
            <span className="text-[8.5px] font-mono uppercase font-bold text-text-muted/80 mt-1 tracking-wider">
              MINS
            </span>
          </div>

          <span className="text-text-muted/50 font-black text-sm pb-3">:</span>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              {pad(s)
                .split('')
                .map((ch, idx) => (
                  <SmoothRollingDigit
                    key={`s-${idx}`}
                    digit={ch}
                    direction={direction}
                    width={16}
                    height={28}
                  />
                ))}
            </div>
            <span className="text-[8.5px] font-mono uppercase font-bold text-text-muted/80 mt-1 tracking-wider">
              SECS
            </span>
          </div>
        </div>

        {/* Bottom: Glowing Velocity Progress Track & Telemetry Sub-labels */}
        <div className="relative z-10 space-y-1.5 pt-1">
          {/* Linear progress track with glowing tip */}
          <div className="w-full h-1.5 bg-border/50 dark:bg-white/[0.08] rounded-full overflow-hidden p-[0.5px]">
            <div
              ref={(el) => {
                registerBarRef(id, el);
              }}
              className="h-full rounded-full will-change-transform transition-transform duration-100"
              style={{
                backgroundColor: cfg.accentColor,
                boxShadow: `0 0 8px ${cfg.accentColor}`,
                transformOrigin: 'left',
                transform: `scaleX(${info.ratio})`,
              }}
            />
          </div>

          {/* Sub-bar numeric telemetry status */}
          <div className="flex items-center justify-between text-[10.5px] font-mono text-text-muted">
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: cfg.accentColor }}
              />
              <span>{mode === 'countdown' ? 'Remaining' : 'Elapsed'}</span>
            </span>
            <span className="font-semibold text-text">
              {mode === 'countdown'
                ? id === 'day'
                  ? `${hours}h ${min}m left`
                  : `${days}d ${hours}h left`
                : id === 'day'
                ? `${hours}h ${min}m elapsed`
                : `${days}d ${hours}h elapsed`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      className={`w-full bg-surface/90 backdrop-blur-md border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm transition-all ${font.className}`}
      aria-label="Time countdown for current Day, Month, and Year"
    >
      {/* ========================================================================= */}
      {/* TOP CONSOLE HEADER: Mode Switcher [Remaining | Elapsed] & Current Time    */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border/80 gap-3">
        {/* Left: Mode Switcher [Remaining | Elapsed] & Current Time */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Tactile Segmented Pill Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-background border border-border shadow-2xs">
            <button
              type="button"
              onClick={() => setMode('countdown')}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold tracking-tight transition-all ${
                mode === 'countdown'
                  ? 'bg-surface text-accent font-bold shadow-xs border border-border/60'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Remaining
            </button>
            <button
              type="button"
              onClick={() => setMode('elapsed')}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold tracking-tight transition-all ${
                mode === 'elapsed'
                  ? 'bg-surface text-accent font-bold shadow-xs border border-border/60'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Elapsed
            </button>
          </div>

          {/* Live Precision Current Time Capsule */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-background border border-border shadow-2xs">
            <span className="relative flex h-2 w-2" title="Live clock active">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-text font-bold text-xs tracking-tight">
              {liveClock}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE ONLY TOGGLE: Switch between Today, Month, Year (Hidden on Desktop)  */}
      {/* ========================================================================= */}
      <div className="flex md:hidden items-center p-1 rounded-xl bg-background border border-border shadow-2xs gap-1 w-full">
        {(['day', 'month', 'year'] as SpanId[]).map((id) => {
          const cfg = SPAN_CONFIGS[id];
          const Icon = cfg.icon;
          const isActive = activeSpan === id;
          return (
            <button
              key={`mobile-tab-${id}`}
              type="button"
              onClick={() => setActiveSpan(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold tracking-tight transition-all ${
                isActive
                  ? 'bg-surface text-accent font-bold shadow-xs border border-border/80'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE CARD VIEW: Shows ONLY single card at a time (< md)                  */}
      {/* ========================================================================= */}
      <div className="block md:hidden">
        {renderCard(activeSpan, true)}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP 3-COLUMN CARDS: Unchanged 3 cards side-by-side (>= md)             */}
      {/* ========================================================================= */}
      <div className="hidden md:grid md:grid-cols-3 gap-3.5 lg:gap-4">
        {(['day', 'month', 'year'] as SpanId[]).map((id) => renderCard(id, false))}
      </div>
    </section>
  );
}
