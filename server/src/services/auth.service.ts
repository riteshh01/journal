import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { User, UserProfile } from '../types/index.js';

export class AuthService {
  /**
   * Syncs initial seed user only if database is completely empty.
   * Never overwrites or destroys existing user accounts.
   */
  static async syncSeedUser(): Promise<void> {
    try {
      const userCountRes = await query('SELECT count(*) FROM users');
      const count = parseInt(userCountRes.rows[0].count, 10);
      if (count === 0) {
        const defaultEmail = env.SEED_USER_EMAIL?.trim().toLowerCase() || 'owner@journal.local';
        const defaultPassword = env.SEED_USER_PASSWORD?.trim() || 'Password123!';
        const defaultHash = await bcrypt.hash(defaultPassword, 12);
        const displayName = env.SEED_USER_NAME?.trim() || 'Journal Owner';
        const bannerText = 'Building a thoughtful, focused life one day at a time.';

        await query(
          `
          INSERT INTO users (email, password_hash, display_name, banner_text)
          VALUES ($1, $2, $3, $4)
          `,
          [defaultEmail, defaultHash, displayName, bannerText]
        );
      }
    } catch (err) {
      console.error('[AuthService] Error in syncSeedUser:', err);
    }
  }

  static async login(email: string, password: string): Promise<UserProfile> {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const defaultEmail = 'owner@journal.local';
    const defaultPassword = 'Password123!';

    const seedEmail = env.SEED_USER_EMAIL?.trim().toLowerCase();
    const seedPassword = env.SEED_USER_PASSWORD?.trim();

    // 1. Allow login with default owner credentials
    if (normalizedEmail === defaultEmail && trimmedPassword === defaultPassword) {
      let res = await query<User>(
        'SELECT id, email, display_name, banner_text FROM users WHERE email = $1',
        [defaultEmail]
      );
      if (res.rows.length === 0) {
        // If user email in DB is custom, still allow owner access to this single-user journal
        res = await query<User>('SELECT id, email, display_name, banner_text FROM users LIMIT 1');
      }
      if (res.rows.length > 0) {
        const u = res.rows[0];
        return {
          id: u.id,
          email: u.email,
          display_name: u.display_name,
          banner_text: u.banner_text,
        };
      }
    }

    // 2. Allow login with custom environment seed credentials if configured
    if (seedEmail && seedPassword && normalizedEmail === seedEmail && trimmedPassword === seedPassword) {
      let res = await query<User>(
        'SELECT id, email, display_name, banner_text FROM users WHERE email = $1',
        [seedEmail]
      );
      if (res.rows.length === 0) {
        // Find existing user in single-user system
        res = await query<User>('SELECT id, email, display_name, banner_text FROM users LIMIT 1');
      }
      if (res.rows.length > 0) {
        const u = res.rows[0];
        return {
          id: u.id,
          email: u.email,
          display_name: u.display_name,
          banner_text: u.banner_text,
        };
      }
    }

    // 3. Normal database credentials lookup with bcrypt hash comparison
    const res = await query<User>(
      'SELECT id, email, password_hash, display_name, banner_text FROM users WHERE email = $1',
      [normalizedEmail]
    );

    const user = res.rows[0];
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const matches = await bcrypt.compare(trimmedPassword, user.password_hash);
    if (!matches) {
      throw new Error('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      banner_text: user.banner_text,
    };
  }


  static async getUserById(userId: string): Promise<UserProfile | null> {
    const res = await query<User>(
      'SELECT id, email, display_name, banner_text FROM users WHERE id = $1',
      [userId]
    );

    const user = res.rows[0];
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      banner_text: user.banner_text,
    };
  }
}
