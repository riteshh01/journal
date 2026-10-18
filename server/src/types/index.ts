import { Request } from 'express';

export type PriorityLevel = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'dropped';
export type MediaType = 'image' | 'video';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  banner_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  banner_text: string | null;
}

export interface JournalTask {
  id: string;
  user_id: string;
  journal_entry_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  title: string;
  content: string;
  mood: number | null;
  tasks?: JournalTask[];
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: PriorityLevel;
  status: GoalStatus;
  progress: number;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  user_id: string;
  media_type: MediaType;
  cloudinary_public_id: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  mime_type: string;
  size_bytes: number;
  journal_entry_id: string | null;
  taken_on: string | null;
  created_at: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
