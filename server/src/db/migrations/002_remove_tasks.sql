-- 002_remove_tasks.sql: Remove tasks table and task_status enum completely

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
