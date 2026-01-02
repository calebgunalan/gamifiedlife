-- Create quest_templates table for predefined quests
CREATE TABLE public.quest_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  area public.life_area NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  quest_type TEXT NOT NULL DEFAULT 'daily',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quest_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view quest templates
CREATE POLICY "Everyone can view quest templates"
  ON public.quest_templates FOR SELECT
  USING (true);

-- Create in_app_notifications table
CREATE TABLE public.in_app_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.in_app_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
  ON public.in_app_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.in_app_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "Users can insert notifications for themselves"
  ON public.in_app_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create user_onboarding table
CREATE TABLE public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  focus_areas TEXT[] DEFAULT '{}',
  commitment_level TEXT DEFAULT 'medium',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding"
  ON public.user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON public.user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON public.user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert sample quest templates
INSERT INTO public.quest_templates (title, description, area, xp_reward, quest_type, difficulty) VALUES
-- Physical
('Morning Workout', 'Complete a 30-minute workout session', 'physical', 30, 'daily', 'medium'),
('10K Steps', 'Walk at least 10,000 steps today', 'physical', 25, 'daily', 'easy'),
('Hydration Hero', 'Drink 8 glasses of water', 'physical', 15, 'daily', 'easy'),
('Weekly Fitness Challenge', 'Exercise for 5 days this week', 'physical', 100, 'weekly', 'hard'),

-- Mental
('Read for 30 Minutes', 'Spend 30 minutes reading a book', 'mental', 25, 'daily', 'medium'),
('Learn Something New', 'Complete a lesson or tutorial', 'mental', 30, 'daily', 'medium'),
('Journaling Session', 'Write in your journal for 15 minutes', 'mental', 20, 'daily', 'easy'),
('Weekly Learning Goal', 'Complete 3 learning sessions this week', 'mental', 75, 'weekly', 'medium'),

-- Productivity
('Deep Work Session', 'Complete 2 hours of focused work', 'productivity', 35, 'daily', 'hard'),
('Clear Inbox', 'Process all emails and messages', 'productivity', 20, 'daily', 'medium'),
('Weekly Review', 'Plan and review your week ahead', 'productivity', 50, 'weekly', 'medium'),
('Complete Major Task', 'Finish a significant work task', 'productivity', 40, 'daily', 'hard'),

-- Social
('Connect with a Friend', 'Have a meaningful conversation', 'social', 25, 'daily', 'easy'),
('Family Time', 'Spend quality time with family', 'social', 30, 'daily', 'medium'),
('Help Someone', 'Do a favor or help someone in need', 'social', 25, 'daily', 'medium'),
('Weekly Social Goal', 'Attend or host a social event', 'social', 60, 'weekly', 'medium'),

-- Financial
('Track Expenses', 'Log all spending for the day', 'financial', 15, 'daily', 'easy'),
('Budget Review', 'Review and update your budget', 'financial', 40, 'weekly', 'medium'),
('Save Money', 'Put aside savings for the week', 'financial', 50, 'weekly', 'medium'),
('Financial Learning', 'Read an article about finance', 'financial', 20, 'daily', 'easy'),

-- Personal
('Self-Care Activity', 'Do something just for yourself', 'personal', 25, 'daily', 'easy'),
('Practice a Hobby', 'Spend time on your hobby', 'personal', 30, 'daily', 'medium'),
('Personal Goal Progress', 'Work towards a personal goal', 'personal', 35, 'daily', 'medium'),
('Weekly Reflection', 'Reflect on personal growth', 'personal', 40, 'weekly', 'medium'),

-- Spiritual
('Morning Meditation', 'Start the day with 10 minutes of meditation', 'spiritual', 25, 'daily', 'easy'),
('Gratitude Practice', 'Write 3 things you are grateful for', 'spiritual', 20, 'daily', 'easy'),
('Mindful Moment', 'Practice mindfulness for 5 minutes', 'spiritual', 15, 'daily', 'easy'),
('Weekly Spiritual Growth', 'Dedicate time to spiritual practice 5 days', 'spiritual', 80, 'weekly', 'hard');

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.in_app_notifications;