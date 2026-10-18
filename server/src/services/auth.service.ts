import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { User, UserProfile } from '../types/index.js';

export class AuthService {
  /**
   * Syncs the seed user from environment variables into the database if configured.
   * Ensures that whenever SEED_USER_EMAIL or SEED_USER_PASSWORD are set in Vercel,
   * the database stays in sync without requiring manual terminal commands.
   */
  static async syncSeedUser(): Promise<void> {
    const seedEmail = env.SEED_USER_EMAIL?.trim().toLowerCase();
    const seedPassword = env.SEED_USER_PASSWORD?.trim();
    if (!seedEmail || !seedPassword) return;

    try {
      const displayName = env.SEED_USER_NAME?.trim() || 'Journal Owner';
      const bannerText = 'Building a thoughtful, focused life one day at a time.';
      const passwordHash = await bcrypt.hash(seedPassword, 12);

      // Check if user with seedEmail already exists
      const existingSeedUser = await query<User>(
        'SELECT id FROM users WHERE email = $1',
        [seedEmail]
      );

      if (existingSeedUser.rows.length === 0) {
        // If default owner@journal.local exists, migrate it in-place to preserve records
        const defaultOwner = await query<User>(
          'SELECT id FROM users WHERE email = $1',
          ['owner@journal.local']
        );

        if (defaultOwner.rows.length > 0 && seedEmail !== 'owner@journal.local') {
          console.log(`[AuthService] Migrating default owner to ${seedEmail}`);
          await query(
            `
            UPDATE users
            SET email = $1, password_hash = $2, display_name = COALESCE($3, display_name), updated_at = now()
            WHERE id = $4
            `,
            [seedEmail, passwordHash, displayName, defaultOwner.rows[0].id]
          );
        } else {
          console.log(`[AuthService] Inserting seed user ${seedEmail}`);
          await query(
            `
            INSERT INTO users (email, password_hash, display_name, banner_text)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email)
            DO UPDATE SET
              password_hash = EXCLUDED.password_hash,
              updated_at = now()
            `,
            [seedEmail, passwordHash, displayName, bannerText]
          );
        }
      }
    } catch (err) {
      console.error('[AuthService] Error in syncSeedUser:', err);
    }
  }

  static async login(email: string, password: string): Promise<UserProfile> {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const seedEmail = env.SEED_USER_EMAIL?.trim().toLowerCase();
    const seedPassword = env.SEED_USER_PASSWORD?.trim();

    // Check if the credentials match SEED_USER_EMAIL & SEED_USER_PASSWORD configured in env
    const isEnvSeedMatch = !!(
      seedEmail &&
      seedPassword &&
      normalizedEmail === seedEmail &&
      trimmedPassword === seedPassword
    );

    let res = await query<User>(
      'SELECT id, email, password_hash, display_name, banner_text FROM users WHERE email = $1',
      [normalizedEmail]
    );

    let user = res.rows[0];

    // If credentials match env seed, ensure user is created/updated in the database immediately
    if (isEnvSeedMatch) {
      const passwordHash = await bcrypt.hash(trimmedPassword, 12);
      const displayName = env.SEED_USER_NAME?.trim() || 'Journal Owner';
      const bannerText = 'Building a thoughtful, focused life one day at a time.';

      // Check if default owner exists to migrate
      const defaultOwner = await query<User>(
        'SELECT id FROM users WHERE email = $1',
        ['owner@journal.local']
      );

      if (defaultOwner.rows.length > 0 && !user && seedEmail !== 'owner@journal.local') {
        const updateRes = await query<User>(
          `
          UPDATE users
          SET email = $1, password_hash = $2, display_name = COALESCE($3, display_name), updated_at = now()
          WHERE id = $4
          RETURNING id, email, display_name, banner_text
          `,
          [seedEmail, passwordHash, displayName, defaultOwner.rows[0].id]
        );
        user = updateRes.rows[0];
      } else {
        const upsertRes = await query<User>(
          `
          INSERT INTO users (email, password_hash, display_name, banner_text)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email)
          DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            updated_at = now()
          RETURNING id, email, display_name, banner_text
          `,
          [seedEmail, passwordHash, displayName, bannerText]
        );
        user = upsertRes.rows[0];
      }

      return {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        banner_text: user.banner_text,
      };
    }

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
