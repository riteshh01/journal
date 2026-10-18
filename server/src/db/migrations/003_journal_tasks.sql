-- 003_journal_tasks.sql: Add journal_tasks table associated with journal entries

CREATE TABLE IF NOT EXISTS journal_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  is_completed     BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_tasks_user_entry ON journal_tasks (user_id, journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_tasks_created ON journal_tasks (created_at ASC);

DROP TRIGGER IF EXISTS trg_journal_tasks_updated_at ON journal_tasks;
CREATE TRIGGER trg_journal_tasks_updated_at
  BEFORE UPDATE ON journal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
