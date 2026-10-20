import { query } from '../config/db.js';

export interface DashboardSummary {
  stats: {
    totalEntries: number;
    currentStreak: number;
    activeGoalsCount: number;
    goalsCompleted: number;
    todayTasksCount: number;
    todayTasksCompleted: number;
  };
  todayEntry: {
    id: string;
    title: string;
    entry_date: string;
  } | null;
  todayTasks: {
    id: string;
    title: string;
    is_completed: boolean;
  }[];
  todayTasksStats: {
    total: number;
    completed: number;
    completionRate: number;
  };
  weeklyEntries: {
    label: string;
    weekStart: string;
    count: number;
  }[];
  moodTrend: {
    date: string;
    label: string;
    mood: number | null;
  }[];
  goalsByCategory: {
    category: string;
    count: number;
  }[];
  activeGoals: {
    id: string;
    title: string;
    category: string | null;
    priority: string;
    status: string;
    progress: number;
    target_date: string | null;
  }[];
}

export class DashboardService {
  static async getSummary(userId: string, targetDate?: string): Promise<DashboardSummary> {
    const validDate = targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : null;

    // 1. Total journal entries
    const totalEntriesRes = await query<{ count: string }>(
      'SELECT COUNT(*) FROM journal_entries WHERE user_id = $1',
      [userId]
    );
    const totalEntries = parseInt(totalEntriesRes.rows[0].count, 10);

    // 2. Consecutive writing streak
    const streakRes = await query<{ entry_date: string }>(
      `
      SELECT TO_CHAR(entry_date, 'YYYY-MM-DD') AS entry_date
      FROM journal_entries
      WHERE user_id = $1 AND entry_date <= COALESCE($2::DATE, CURRENT_DATE)
      ORDER BY entry_date DESC
      LIMIT 100
      `,
      [userId, validDate]
    );

    let currentStreak = 0;
    if (streakRes.rows.length > 0) {
      const entryDates = new Set(streakRes.rows.map((r) => r.entry_date));
      const today = validDate ? new Date(validDate + 'T12:00:00Z') : new Date();
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      let checkDate = new Date(today);
      const todayStr = formatDate(checkDate);

      // If user hasn't written today, allow streak to start from yesterday
      if (!entryDates.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (entryDates.has(formatDate(checkDate))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // 3. Active goals count
    const activeGoalsCountRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM goals WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    const activeGoalsCount = parseInt(activeGoalsCountRes.rows[0].count, 10);

    // 4. Goals completed
    const goalsCompletedRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM goals WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    const goalsCompleted = parseInt(goalsCompletedRes.rows[0].count, 10);

    // 5. Weekly entries (Last 8 weeks)
    const weeklyRes = await query<{ label: string; week_start: string; count: number }>(
      `
      WITH weeks AS (
        SELECT DATE_TRUNC('week', COALESCE($2::DATE, CURRENT_DATE) - (n || ' weeks')::interval)::DATE AS week_start
        FROM generate_series(7, 0, -1) AS n
      )
      SELECT
        TO_CHAR(w.week_start, 'Mon DD') AS label,
        TO_CHAR(w.week_start, 'YYYY-MM-DD') AS week_start,
        COUNT(je.id)::int AS count
      FROM weeks w
      LEFT JOIN journal_entries je
        ON je.user_id = $1
        AND je.entry_date >= w.week_start
        AND je.entry_date < (w.week_start + INTERVAL '7 days')::DATE
      GROUP BY w.week_start
      ORDER BY w.week_start ASC
      `,
      [userId, validDate]
    );

    // 6. Mood trend (Last 30 days)
    const moodRes = await query<{ date: string; label: string; mood: number | null }>(
      `
      WITH days AS (
        SELECT (COALESCE($2::DATE, CURRENT_DATE) - (n || ' days')::interval)::DATE AS day_date
        FROM generate_series(29, 0, -1) AS n
      )
      SELECT
        TO_CHAR(d.day_date, 'YYYY-MM-DD') AS date,
        TO_CHAR(d.day_date, 'Mon DD') AS label,
        je.mood
      FROM days d
      LEFT JOIN journal_entries je
        ON je.user_id = $1
        AND je.entry_date = d.day_date
      ORDER BY d.day_date ASC
      `,
      [userId, validDate]
    );

    // 7. Goals by category
    const categoryRes = await query<{ category: string; count: number }>(
      `
      SELECT COALESCE(category, 'General') AS category, COUNT(*)::int AS count
      FROM goals
      WHERE user_id = $1
      GROUP BY category
      ORDER BY count DESC
      `,
      [userId]
    );

    // 8. Active goals
    const goalsRes = await query<{
      id: string;
      title: string;
      category: string | null;
      priority: string;
      status: string;
      progress: number;
      target_date: string | null;
    }>(
      `
      SELECT id, title, category, priority, status, progress,
             TO_CHAR(target_date, 'YYYY-MM-DD') AS target_date
      FROM goals
      WHERE user_id = $1 AND status = 'active'
      ORDER BY progress DESC, created_at DESC
      LIMIT 10
      `,
      [userId]
    );

    // 9. Today's journal entry & tasks
    const todayEntryRes = await query<{
      id: string;
      title: string;
      entry_date: string;
    }>(
      `
      SELECT id, title, TO_CHAR(entry_date, 'YYYY-MM-DD') AS entry_date
      FROM journal_entries
      WHERE user_id = $1 AND entry_date = COALESCE($2::DATE, CURRENT_DATE)
      `,
      [userId, validDate]
    );

    const todayEntry = todayEntryRes.rows[0]
      ? {
          id: todayEntryRes.rows[0].id,
          title: todayEntryRes.rows[0].title,
          entry_date: todayEntryRes.rows[0].entry_date,
        }
      : null;

    const todayTasksRes = await query<{
      id: string;
      title: string;
      is_completed: boolean;
      created_at: string;
    }>(
      `
      SELECT jt.id, jt.title, jt.is_completed, jt.created_at
      FROM journal_tasks jt
      JOIN journal_entries je ON je.id = jt.journal_entry_id
      WHERE jt.user_id = $1 AND je.entry_date = COALESCE($2::DATE, CURRENT_DATE)
      ORDER BY jt.created_at ASC
      `,
      [userId, validDate]
    );

    const todayTasks = todayTasksRes.rows.map((t) => ({
      id: t.id,
      title: t.title,
      is_completed: Boolean(t.is_completed),
    }));
    const totalTodayTasks = todayTasks.length;
    const completedTodayTasks = todayTasks.filter((t) => t.is_completed).length;

    return {
      stats: {
        totalEntries,
        currentStreak,
        activeGoalsCount,
        goalsCompleted,
        todayTasksCount: totalTodayTasks,
        todayTasksCompleted: completedTodayTasks,
      },
      todayEntry,
      todayTasks,
      todayTasksStats: {
        total: totalTodayTasks,
        completed: completedTodayTasks,
        completionRate: totalTodayTasks > 0 ? Math.round((completedTodayTasks / totalTodayTasks) * 100) : 0,
      },
      weeklyEntries: weeklyRes.rows.map((r) => ({
        label: r.label,
        weekStart: r.week_start,
        count: r.count,
      })),
      moodTrend: moodRes.rows.map((r) => ({
        date: r.date,
        label: r.label,
        mood: r.mood !== null ? Number(r.mood) : null,
      })),
      goalsByCategory: categoryRes.rows.map((r) => ({
        category: r.category,
        count: r.count,
      })),
      activeGoals: goalsRes.rows,
    };
  }
}

