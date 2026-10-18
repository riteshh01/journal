import { query } from '../config/db.js';
import { JournalEntry, JournalTask } from '../types/index.js';

export interface JournalListParams {
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export class JournalService {
  static async getEntries(
    userId: string,
    params: JournalListParams
  ): Promise<{ entries: (JournalEntry & { task_count?: number; completed_task_count?: number })[]; total: number }> {
    const { from, to, page, limit } = params;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['je.user_id = $1'];
    const values: any[] = [userId];

    if (from) {
      values.push(from);
      conditions.push(`je.entry_date >= $${values.length}`);
    }

    if (to) {
      values.push(to);
      conditions.push(`je.entry_date <= $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM journal_entries je WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].count, 10);

    // Entries with task counts
    values.push(limit, offset);
    const entriesRes = await query<JournalEntry & { task_count: number; completed_task_count: number }>(
      `
      SELECT
        je.id,
        je.user_id,
        TO_CHAR(je.entry_date, 'YYYY-MM-DD') AS entry_date,
        je.title,
        je.content,
        je.mood,
        je.created_at,
        je.updated_at,
        COUNT(jt.id)::int AS task_count,
        COUNT(CASE WHEN jt.is_completed THEN 1 END)::int AS completed_task_count
      FROM journal_entries je
      LEFT JOIN journal_tasks jt ON jt.journal_entry_id = je.id
      WHERE ${whereClause}
      GROUP BY je.id
      ORDER BY je.entry_date DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
      `,
      values
    );

    return {
      entries: entriesRes.rows,
      total,
    };
  }

  static async getEntryByDate(
    userId: string,
    date: string
  ): Promise<JournalEntry | null> {
    const res = await query<JournalEntry>(
      `
      SELECT id, user_id, TO_CHAR(entry_date, 'YYYY-MM-DD') AS entry_date, title, content, mood, created_at, updated_at
      FROM journal_entries
      WHERE user_id = $1 AND entry_date = $2
      `,
      [userId, date]
    );

    const entry = res.rows[0] || null;
    if (!entry) return null;

    // Fetch tasks for this entry
    const tasksRes = await query<JournalTask>(
      `
      SELECT id, user_id, journal_entry_id, title, is_completed, created_at, updated_at
      FROM journal_tasks
      WHERE user_id = $1 AND journal_entry_id = $2
      ORDER BY created_at ASC
      `,
      [userId, entry.id]
    );

    entry.tasks = tasksRes.rows;
    return entry;
  }

  static async upsertEntry(
    userId: string,
    date: string,
    data: { title: string; content: string; mood?: number | null }
  ): Promise<JournalEntry> {
    const res = await query<JournalEntry>(
      `
      INSERT INTO journal_entries (user_id, entry_date, title, content, mood)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, entry_date)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        mood = EXCLUDED.mood,
        updated_at = now()
      RETURNING id, user_id, TO_CHAR(entry_date, 'YYYY-MM-DD') AS entry_date, title, content, mood, created_at, updated_at
      `,
      [userId, date, data.title, data.content, data.mood ?? null]
    );

    const entry = res.rows[0];

    // Fetch tasks
    const tasksRes = await query<JournalTask>(
      `
      SELECT id, user_id, journal_entry_id, title, is_completed, created_at, updated_at
      FROM journal_tasks
      WHERE user_id = $1 AND journal_entry_id = $2
      ORDER BY created_at ASC
      `,
      [userId, entry.id]
    );

    entry.tasks = tasksRes.rows;
    return entry;
  }

  static async deleteEntryByDate(
    userId: string,
    date: string
  ): Promise<boolean> {
    const res = await query(
      'DELETE FROM journal_entries WHERE user_id = $1 AND entry_date = $2',
      [userId, date]
    );

    return (res.rowCount ?? 0) > 0;
  }

  /* ------------------------------ journal tasks ----------------------------- */

  static async getTasksByDate(userId: string, date: string): Promise<JournalTask[]> {
    const res = await query<JournalTask>(
      `
      SELECT jt.id, jt.user_id, jt.journal_entry_id, jt.title, jt.is_completed, jt.created_at, jt.updated_at
      FROM journal_tasks jt
      JOIN journal_entries je ON je.id = jt.journal_entry_id
      WHERE jt.user_id = $1 AND je.entry_date = $2
      ORDER BY jt.created_at ASC
      `,
      [userId, date]
    );
    return res.rows;
  }

  static async addTask(userId: string, date: string, title: string): Promise<JournalTask> {
    // Ensure journal entry exists for this date
    let entryRes = await query<{ id: string }>(
      'SELECT id FROM journal_entries WHERE user_id = $1 AND entry_date = $2',
      [userId, date]
    );

    let entryId = entryRes.rows[0]?.id;
    if (!entryId) {
      // Auto-create minimal journal entry so tasks can attach cleanly
      const createdEntry = await query<{ id: string }>(
        `
        INSERT INTO journal_entries (user_id, entry_date, title, content)
        VALUES ($1, $2, $3, '')
        ON CONFLICT (user_id, entry_date) DO UPDATE SET updated_at = now()
        RETURNING id
        `,
        [userId, date, `Journal Entry - ${date}`]
      );
      entryId = createdEntry.rows[0].id;
    }

    const taskRes = await query<JournalTask>(
      `
      INSERT INTO journal_tasks (user_id, journal_entry_id, title, is_completed)
      VALUES ($1, $2, $3, false)
      RETURNING id, user_id, journal_entry_id, title, is_completed, created_at, updated_at
      `,
      [userId, entryId, title]
    );

    return taskRes.rows[0];
  }

  static async toggleTask(userId: string, taskId: string, isCompleted?: boolean): Promise<JournalTask | null> {
    let res;
    if (typeof isCompleted === 'boolean') {
      res = await query<JournalTask>(
        `
        UPDATE journal_tasks
        SET is_completed = $1, updated_at = now()
        WHERE id = $2 AND user_id = $3
        RETURNING id, user_id, journal_entry_id, title, is_completed, created_at, updated_at
        `,
        [isCompleted, taskId, userId]
      );
    } else {
      res = await query<JournalTask>(
        `
        UPDATE journal_tasks
        SET is_completed = NOT is_completed, updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, journal_entry_id, title, is_completed, created_at, updated_at
        `,
        [taskId, userId]
      );
    }

    return res.rows[0] || null;
  }

  static async deleteTask(userId: string, taskId: string): Promise<boolean> {
    const res = await query(
      'DELETE FROM journal_tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }
}
