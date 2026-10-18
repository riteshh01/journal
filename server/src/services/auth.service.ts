import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { User, UserProfile } from '../types/index.js';

export class AuthService {
  static async login(email: string, password: string): Promise<UserProfile> {
    const res = await query<User>(
      'SELECT id, email, password_hash, display_name, banner_text FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = res.rows[0];
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const matches = await bcrypt.compare(password, user.password_hash);
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
