import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Starting database seeding...');

    const email = env.SEED_USER_EMAIL || 'owner@journal.local';
    const password = env.SEED_USER_PASSWORD || 'Password123!';
    const displayName = env.SEED_USER_NAME || 'Journal Owner';
    const bannerText = 'Building a thoughtful, focused life one day at a time.';

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Upsert the single user
    const userRes = await client.query(
      `
      INSERT INTO users (email, password_hash, display_name, banner_text)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        display_name = EXCLUDED.display_name,
        updated_at = now()
      RETURNING id, email, display_name
      `,
      [email, passwordHash, displayName, bannerText]
    );

    const user = userRes.rows[0];
    console.log(`Seeded user: ${user.email} (ID: ${user.id})`);

    // Add initial goals if none exist
    const goalCountRes = await client.query('SELECT COUNT(*) FROM goals WHERE user_id = $1', [user.id]);
    if (parseInt(goalCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding initial goals...');
      await client.query(
        `
        INSERT INTO goals (user_id, title, description, category, priority, status, progress, target_date)
        VALUES
          ($1, 'Read 24 Books This Year', 'Deep reading across philosophy, engineering, and history.', 'Learning', 'high', 'active', 65, '2026-12-31'),
          ($1, 'Run 10km under 50 minutes', 'Consistent zone 2 training and interval sessions.', 'Health', 'medium', 'active', 80, '2026-11-30'),
          ($1, 'Launch Side Project v1.0', 'Complete end-to-end implementation and deploy.', 'Career', 'high', 'completed', 100, '2026-10-15'),
          ($1, 'Meditate 15 mins daily', 'Morning mindfulness practice before starting work.', 'Mindset', 'low', 'active', 45, '2026-12-15')
        `,
        [user.id]
      );
    }


    // Add initial journal entries if none exist
    const journalCountRes = await client.query('SELECT COUNT(*) FROM journal_entries WHERE user_id = $1', [user.id]);
    if (parseInt(journalCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding initial journal entries across past weeks...');
      await client.query(
        `
        INSERT INTO journal_entries (user_id, entry_date, title, content, mood)
        VALUES
          ($1, CURRENT_DATE, 'A New Chapter of Intentional Living', 'Today marked the completion of the life dashboard project. Everything is clean, focused, and minimal. Clarity comes from constraints.', 5),
          ($1, CURRENT_DATE - INTERVAL '1 day', 'Deep Work & Evening Walk', 'Finished the core backend architecture. Spent the evening walking through the neighborhood while listening to ambient music.', 4),
          ($1, CURRENT_DATE - INTERVAL '3 days', 'Solving Complex SQL Aggregations', 'Designed the dashboard summary queries with single-pass CTEs. Everything runs under 5ms.', 5),
          ($1, CURRENT_DATE - INTERVAL '5 days', 'Rest and Recharge', 'Took time off the screen. Read three chapters of Seneca. Stillness is essential for long-term endurance.', 4),
          ($1, CURRENT_DATE - INTERVAL '8 days', 'Weekly System Audit', 'Reviewed all goals and streamlined priorities. Eliminated two unnecessary meetings from next week.', 3),
          ($1, CURRENT_DATE - INTERVAL '12 days', 'Pushing Forward on Fitness', 'Ran 7km in the morning fog. Felt energized throughout the entire workday.', 5),
          ($1, CURRENT_DATE - INTERVAL '15 days', 'Overcoming Creative Friction', 'Felt a bit sluggish at start, but a 25-minute Pomodoro helped regain rhythm. Progress over perfection.', 3),
          ($1, CURRENT_DATE - INTERVAL '22 days', 'Reflecting on Monthly Milestones', 'Reviewed monthly milestones. Solid consistency on reading and training.', 4)
        ON CONFLICT (user_id, entry_date) DO NOTHING
        `,
        [user.id]
      );
    }

    console.log('Database seeding completed successfully.');
    console.log(`Credentials for login:`);
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
