import { query } from '../config/db.js';
import { Goal, GoalStatus } from '../types/index.js';
import { CreateGoalInput, UpdateGoalInput } from '../validators/index.js';

export interface GoalListParams {
  status?: GoalStatus;
  category?: string;
  page: number;
  limit: number;
}

export class GoalsService {
  static async getGoals(
    userId: string,
    params: GoalListParams
  ): Promise<{ goals: Goal[]; total: number }> {
    const { status, category, page, limit } = params;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM goals WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].count, 10);

    values.push(limit, offset);
    const goalsRes = await query<Goal>(
      `
      SELECT id, user_id, title, description, category, priority, status, progress,
             TO_CHAR(target_date, 'YYYY-MM-DD') AS target_date, created_at, updated_at
      FROM goals
      WHERE ${whereClause}
      ORDER BY
        CASE status
          WHEN 'active' THEN 1
          WHEN 'paused' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'dropped' THEN 4
        END,
        target_date ASC NULLS LAST,
        created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
      `,
      values
    );

    return {
      goals: goalsRes.rows,
      total,
    };
  }

  static async createGoal(
    userId: string,
    data: CreateGoalInput
  ): Promise<Goal> {
    const res = await query<Goal>(
      `
      INSERT INTO goals (user_id, title, description, category, priority, status, progress, target_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, title, description, category, priority, status, progress,
                TO_CHAR(target_date, 'YYYY-MM-DD') AS target_date, created_at, updated_at
      `,
      [
        userId,
        data.title,
        data.description || null,
        data.category || null,
        data.priority,
        data.status,
        data.progress,
        data.target_date || null,
      ]
    );

    return res.rows[0];
  }

  static async updateGoal(
    userId: string,
    goalId: string,
    data: UpdateGoalInput
  ): Promise<Goal | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      values.push(data.title);
      updates.push(`title = $${values.length}`);
    }

    if (data.description !== undefined) {
      values.push(data.description);
      updates.push(`description = $${values.length}`);
    }

    if (data.category !== undefined) {
      values.push(data.category);
      updates.push(`category = $${values.length}`);
    }

    if (data.priority !== undefined) {
      values.push(data.priority);
      updates.push(`priority = $${values.length}`);
    }

    if (data.status !== undefined) {
      values.push(data.status);
      updates.push(`status = $${values.length}`);
    }

    if (data.progress !== undefined) {
      values.push(data.progress);
      updates.push(`progress = $${values.length}`);
    }

    if (data.target_date !== undefined) {
      values.push(data.target_date);
      updates.push(`target_date = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await query<Goal>(
        `
        SELECT id, user_id, title, description, category, priority, status, progress,
               TO_CHAR(target_date, 'YYYY-MM-DD') AS target_date, created_at, updated_at
        FROM goals WHERE id = $1 AND user_id = $2
        `,
        [goalId, userId]
      );
      return existing.rows[0] || null;
    }

    updates.push(`updated_at = now()`);
    values.push(goalId, userId);

    const res = await query<Goal>(
      `
      UPDATE goals
      SET ${updates.join(', ')}
      WHERE id = $${values.length - 1} AND user_id = $${values.length}
      RETURNING id, user_id, title, description, category, priority, status, progress,
                TO_CHAR(target_date, 'YYYY-MM-DD') AS target_date, created_at, updated_at
      `,
      values
    );

    return res.rows[0] || null;
  }

  static async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    const res = await query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    return (res.rowCount ?? 0) > 0;
  }
}
