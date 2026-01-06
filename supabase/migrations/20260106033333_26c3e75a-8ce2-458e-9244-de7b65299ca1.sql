-- Phase 1: Core Feature Completion

-- 1.1 Character Classes Table
CREATE TABLE public.character_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  primary_area public.life_area,
  secondary_area public.life_area,
  xp_bonus_percent INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert predefined classes
INSERT INTO public.character_classes (name, description, icon, primary_area, secondary_area) VALUES
  ('Warrior', 'Masters of physical discipline and productivity. Excel at fitness and getting things done.', '⚔️', 'physical', 'productivity'),
  ('Scholar', 'Devoted to knowledge and mental growth. Thrive in learning and intellectual pursuits.', '📚', 'mental', 'productivity'),
  ('Mystic', 'Seekers of inner peace and personal growth. Strong in spiritual and personal development.', '🔮', 'spiritual', 'personal'),
  ('Socialite', 'Natural connectors and relationship builders. Excel in social and financial domains.', '🎭', 'social', 'financial'),
  ('Merchant', 'Ambitious wealth builders and career climbers. Masters of financial and productivity.', '💰', 'financial', 'productivity'),
  ('Ranger', 'Balanced adventurers who excel across all life areas. Jack of all trades.', '🏹', NULL, NULL);

-- Everyone can view classes
ALTER TABLE public.character_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view character classes" ON public.character_classes FOR SELECT USING (true);

-- 1.2 Add class_id and grace_period_hours to profiles
ALTER TABLE public.profiles 
  ADD COLUMN class_id UUID REFERENCES public.character_classes(id),
  ADD COLUMN grace_period_hours INTEGER DEFAULT 2;

-- 1.3 Spiritual Logs Table (dedicated spiritual practice tracking)
CREATE TABLE public.spiritual_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  practice_type TEXT NOT NULL CHECK (practice_type IN ('meditation', 'prayer', 'gratitude', 'nature', 'service', 'mindfulness')),
  duration_minutes INTEGER,
  notes TEXT,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for spiritual logs
ALTER TABLE public.spiritual_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spiritual logs" 
  ON public.spiritual_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spiritual logs" 
  ON public.spiritual_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spiritual logs" 
  ON public.spiritual_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spiritual logs" 
  ON public.spiritual_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- 1.4 Daily Logins Table (for login streak tracking)
CREATE TABLE public.daily_logins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  consecutive_days INTEGER DEFAULT 1,
  bonus_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, login_date)
);

ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own login history" 
  ON public.daily_logins FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logins" 
  ON public.daily_logins FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logins" 
  ON public.daily_logins FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_spiritual_logs_user_id ON public.spiritual_logs(user_id);
CREATE INDEX idx_spiritual_logs_practice_type ON public.spiritual_logs(practice_type);
CREATE INDEX idx_spiritual_logs_created_at ON public.spiritual_logs(created_at);
CREATE INDEX idx_daily_logins_user_id ON public.daily_logins(user_id);
CREATE INDEX idx_daily_logins_login_date ON public.daily_logins(login_date);