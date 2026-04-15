export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro';
  created_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  salary: number;
  extra_income: number;
  reference_month: number;
  reference_year: number;
}

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  reference_month: number;
  reference_year: number;
}

export interface Goal {
  id: string;
  user_id: string;
  description: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  is_completed: boolean;
}

export interface MonthlySummary {
  id: string;
  user_id: string;
  reference_month: number;
  reference_year: number;
  total_income: number;
  total_expenses: number;
  balance: number;
  work_days_cost: number;
  biggest_category: string;
}

export interface ShareCard {
  id: string;
  user_id: string;
  card_data: Record<string, unknown>;
  share_token: string;
  views_count: number;
}

export interface Suggestion {
  id: string;
  user_id: string;
  message: string;
  category: string;
  status: 'pending' | 'reviewed' | 'implemented';
  admin_reply: string | null;
  upvotes: number;
}

export interface AppEvent {
  id: string;
  user_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  platform: string;
}

export interface AdminRole {
  id: string;
  user_id: string;
  role: 'admin';
}
