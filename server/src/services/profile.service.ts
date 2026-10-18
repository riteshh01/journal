import { query } from '../config/db.js';
import { User, UserProfile } from '../types/index.js';

export class ProfileService {
  static async getProfile(userId: string): Promise<UserProfile> {
    const res = await query<User>(
      'SELECT id, email, display_name, banner_text FROM users WHERE id = $1',
      [userId]
    );

    const user = res.rows[0];
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      banner_text: user.banner_text,
    };
  }

  static async updateProfile(
    userId: string,
    data: { display_name: string; banner_text?: string | null }
  ): Promise<UserProfile> {
    const res = await query<User>(
      `
      UPDATE users
      SET display_name = $1, banner_text = $2, updated_at = now()
      WHERE id = $3
      RETURNING id, email, display_name, banner_text
      `,
      [data.display_name, data.banner_text !== undefined ? data.banner_text : null, userId]
    );

    const user = res.rows[0];
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      banner_text: user.banner_text,
    };
  }
}
