import { z } from 'zod';

export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  display_name: z.string().trim().min(1, 'Display name cannot be empty').max(100),
  banner_text: z.string().trim().max(255).nullable().optional(),
});

export const journalParamSchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
});

export const upsertJournalSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(200),
  content: z.string().default(''),
  mood: z.coerce.number().int().min(1).max(5).nullable().optional(),
});

export const journalQuerySchema = z.object({
  from: z.string().regex(dateRegex, 'Invalid from date format (YYYY-MM-DD)').optional(),
  to: z.string().regex(dateRegex, 'Invalid to date format (YYYY-MM-DD)').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const priorityLevelSchema = z.enum(['low', 'medium', 'high']);
export const goalStatusSchema = z.enum(['active', 'completed', 'paused', 'dropped']);

export const createGoalSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().nullable().optional(),
  category: z.string().trim().max(50).nullable().optional(),
  priority: priorityLevelSchema.default('medium'),
  status: goalStatusSchema.default('active'),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  target_date: z.string().regex(dateRegex, 'Target date must be YYYY-MM-DD').nullable().optional(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const goalQuerySchema = z.object({
  status: goalStatusSchema.optional(),
  category: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const mediaQuerySchema = z.object({
  type: z.enum(['image', 'video']),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

export const updateMediaSchema = z.object({
  caption: z.string().trim().max(300).nullable().optional(),
});

export const createJournalTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(255),
});

export const toggleJournalTaskSchema = z.object({
  is_completed: z.boolean().optional(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpsertJournalInput = z.infer<typeof upsertJournalSchema>;
export type CreateJournalTaskInput = z.infer<typeof createJournalTaskSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
