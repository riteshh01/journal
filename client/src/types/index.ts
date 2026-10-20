export type PriorityLevel = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'dropped';
export type MediaType = 'image' | 'video';

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
  task_count?: number;
  completed_task_count?: number;
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

export type CodingPlatform = 'leetcode' | 'codeforces' | 'codechef' | 'gfg';

export interface CodingProfile {
  platform: CodingPlatform;
  username: string;
  problemsSolved: number;
  rating?: number | null;
  ranking?: string | null;
  profileUrl: string;
}

export interface DailyActivityItem {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface CodingSummary {
  totalSolved: number;
  currentStreak: number;
  maxStreak: number;
  activeDaysCount: number;
  profiles: CodingProfile[];
  dailyActivity: DailyActivityItem[];
}

export interface DashboardSummary {
  stats: {
    totalEntries: number;
    currentStreak: number;
    activeGoalsCount: number;
    goalsCompleted: number;
    todayTasksCount?: number;
    todayTasksCompleted?: number;
  };
  todayEntry?: {
    id: string;
    title: string;
    entry_date: string;
  } | null;
  todayTasks?: {
    id: string;
    title: string;
    is_completed: boolean;
  }[];
  todayTasksStats?: {
    total: number;
    completed: number;
    completionRate: number;
  };
  weeklyEntries: {
    label: string;
    weekStart: string;
    count: number;
  }[];
  moodTrend: {
    date: string;
    label: string;
    mood: number | null;
  }[];
  goalsByCategory: {
    category: string;
    count: number;
  }[];
  activeGoals: {
    id: string;
    title: string;
    category: string | null;
    priority: PriorityLevel;
    status: GoalStatus;
    progress: number;
    target_date: string | null;
  }[];
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
