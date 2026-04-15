
-- Add replied_at to suggestions
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE;

-- Update suggestions status check to support more statuses
ALTER TABLE public.suggestions DROP CONSTRAINT IF EXISTS suggestions_status_check;
ALTER TABLE public.suggestions ADD CONSTRAINT suggestions_status_check 
  CHECK (status IN ('pending', 'novo', 'em_analise', 'reviewed', 'implemented', 'recusado'));

-- Create admin_notes table
CREATE TABLE public.admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = _user_id
  )
$$;

-- Admin notes policies
CREATE POLICY "Admins can view all notes" ON public.admin_notes 
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert notes" ON public.admin_notes 
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update notes" ON public.admin_notes 
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Admin policies for suggestions (admins can update)
CREATE POLICY "Admins can view all suggestions" ON public.suggestions 
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update suggestions" ON public.suggestions 
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Admin policies for app_events (admins can view all)
CREATE POLICY "Admins can view all events" ON public.app_events 
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Admin policies for profiles (admins can view all)
CREATE POLICY "Admins can view all profiles" ON public.profiles 
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Admin policies for expenses (admins can view all)
CREATE POLICY "Admins can view all expenses" ON public.expenses 
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Admin policies for share_cards (admins can view all)
CREATE POLICY "Admins can view all share cards" ON public.share_cards 
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Admin policies for incomes (admins can view all)
CREATE POLICY "Admins can view all incomes" ON public.incomes 
  FOR SELECT USING (public.is_admin(auth.uid()));

-- View: admin_users_overview
CREATE OR REPLACE VIEW public.admin_users_overview AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  p.plan,
  p.created_at AS joined_at,
  (SELECT ae.platform FROM public.app_events ae WHERE ae.user_id = p.user_id ORDER BY ae.created_at DESC LIMIT 1) AS platform,
  (SELECT ae.created_at FROM public.app_events ae WHERE ae.user_id = p.user_id ORDER BY ae.created_at DESC LIMIT 1) AS last_active,
  (SELECT COUNT(*) FROM public.expenses e WHERE e.user_id = p.user_id)::int AS total_expenses,
  (SELECT COUNT(*) FROM public.share_cards sc WHERE sc.user_id = p.user_id)::int AS total_shares
FROM public.profiles p;

-- View: admin_suggestions_ranked
CREATE OR REPLACE VIEW public.admin_suggestions_ranked AS
SELECT 
  s.*,
  p.full_name AS author_name
FROM public.suggestions s
LEFT JOIN public.profiles p ON p.user_id = s.user_id
ORDER BY s.upvotes DESC, s.created_at DESC;

-- View: admin_metrics_30d
CREATE OR REPLACE VIEW public.admin_metrics_30d AS
SELECT 
  d.day::date AS day,
  (SELECT COUNT(*) FROM public.profiles p WHERE p.created_at::date = d.day::date)::int AS new_users,
  (SELECT COUNT(DISTINCT ae.user_id) FROM public.app_events ae WHERE ae.created_at::date = d.day::date)::int AS active_users,
  (SELECT COUNT(*) FROM public.expenses e WHERE e.created_at::date = d.day::date)::int AS expenses_created,
  (SELECT COUNT(*) FROM public.share_cards sc WHERE sc.created_at::date = d.day::date)::int AS share_cards_created,
  (SELECT COUNT(*) FROM public.app_events ae WHERE ae.event_type = 'result_viewed' AND ae.created_at::date = d.day::date)::int AS result_viewed,
  (SELECT COUNT(*) FROM public.app_events ae WHERE ae.event_type = 'simulator_used' AND ae.created_at::date = d.day::date)::int AS simulator_used,
  (SELECT COUNT(*) FROM public.app_events ae WHERE ae.event_type = 'upgrade_clicked' AND ae.created_at::date = d.day::date)::int AS upgrade_clicked,
  (SELECT COUNT(*) FROM public.app_events ae WHERE ae.event_type = 'upgrade_completed' AND ae.created_at::date = d.day::date)::int AS upgrade_completed
FROM generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  INTERVAL '1 day'
) AS d(day);
