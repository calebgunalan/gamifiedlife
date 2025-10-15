-- Add predefined activities table
CREATE TABLE IF NOT EXISTS public.predefined_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area public.life_area NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  xp_value INTEGER NOT NULL,
  frequency TEXT DEFAULT 'daily',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL, -- 'solo' or 'party'
  area public.life_area,
  xp_reward INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID NOT NULL,
  party_id UUID REFERENCES public.parties(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add challenge participants table
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- Add leaderboard entries table
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  leaderboard_type TEXT NOT NULL, -- 'daily_xp', 'weekly_xp', 'streaks', 'balance'
  score INTEGER NOT NULL,
  period DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, leaderboard_type, period)
);

-- Insert predefined activities
INSERT INTO public.predefined_activities (area, name, description, xp_value, frequency, icon) VALUES
-- Physical
('physical', 'Morning Workout', '30 minutes of exercise', 10, 'daily', '💪'),
('physical', 'Yoga Session', 'Mindful stretching and poses', 8, 'daily', '🧘'),
('physical', '10,000 Steps', 'Daily step goal', 5, 'daily', '👟'),
('physical', 'Healthy Meal', 'Nutritious meal preparation', 5, 'daily', '🥗'),
('physical', 'Drink Water', '8 glasses of water', 3, 'daily', '💧'),

-- Mental
('mental', 'Read 30 Minutes', 'Reading books or articles', 8, 'daily', '📚'),
('mental', 'Learn New Skill', 'Online course or tutorial', 12, 'daily', '🎓'),
('mental', 'Puzzle/Brain Game', 'Mental exercises', 5, 'daily', '🧩'),
('mental', 'Podcast Learning', 'Educational podcast', 6, 'daily', '🎧'),
('mental', 'Write Journal', 'Reflective writing', 7, 'daily', '✍️'),

-- Productivity
('productivity', 'Deep Work Session', '2 hours focused work', 15, 'daily', '🎯'),
('productivity', 'Complete Task', 'Finish important task', 10, 'daily', '✅'),
('productivity', 'Plan Tomorrow', 'Daily planning session', 5, 'daily', '📋'),
('productivity', 'Clear Inbox', 'Email management', 5, 'daily', '📧'),
('productivity', 'Time Block', 'Schedule your day', 8, 'daily', '⏰'),

-- Social
('social', 'Call Friend/Family', 'Meaningful conversation', 8, 'daily', '📞'),
('social', 'Social Activity', 'Spend time with others', 10, 'weekly', '🎉'),
('social', 'Help Someone', 'Act of kindness', 12, 'daily', '🤝'),
('social', 'Network Meeting', 'Professional networking', 10, 'weekly', '☕'),
('social', 'Quality Time', 'With loved ones', 8, 'daily', '❤️'),

-- Financial
('financial', 'Track Expenses', 'Log daily spending', 5, 'daily', '💰'),
('financial', 'Review Budget', 'Check financial plan', 10, 'weekly', '📊'),
('financial', 'Save Money', 'Transfer to savings', 8, 'daily', '🏦'),
('financial', 'Learn Finance', 'Financial education', 10, 'weekly', '📈'),
('financial', 'Side Income', 'Extra earning activity', 15, 'daily', '💵'),

-- Personal
('personal', 'Practice Hobby', 'Creative pursuit', 10, 'daily', '🎨'),
('personal', 'Self-Care', 'Personal wellness', 8, 'daily', '🛁'),
('personal', 'Set Goals', 'Personal planning', 10, 'weekly', '🎯'),
('personal', 'Learn About Self', 'Self-reflection', 8, 'daily', '🪞'),
('personal', 'Organize Space', 'Declutter & tidy', 5, 'daily', '🧹'),

-- Spiritual
('spiritual', 'Morning Meditation', '10-20 minute session', 10, 'daily', '🧘‍♂️'),
('spiritual', 'Gratitude Practice', 'List 3 things', 5, 'daily', '🙏'),
('spiritual', 'Nature Walk', 'Outdoor mindfulness', 8, 'daily', '🌳'),
('spiritual', 'Prayer/Contemplation', 'Spiritual practice', 8, 'daily', '✨'),
('spiritual', 'Service Work', 'Volunteer or help', 15, 'weekly', '🕊️');

-- Enable RLS on new tables
ALTER TABLE public.predefined_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for predefined_activities
CREATE POLICY "Everyone can view predefined activities"
ON public.predefined_activities FOR SELECT
USING (true);

-- RLS Policies for challenges
CREATE POLICY "Users can view challenges they participate in"
ON public.challenges FOR SELECT
USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.challenge_participants WHERE challenge_id = challenges.id AND user_id = auth.uid())
);

CREATE POLICY "Users can create challenges"
ON public.challenges FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Challenge creators can update their challenges"
ON public.challenges FOR UPDATE
USING (auth.uid() = created_by);

-- RLS Policies for challenge_participants
CREATE POLICY "Users can view challenge participants"
ON public.challenge_participants FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.challenges WHERE id = challenge_participants.challenge_id AND 
    (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.challenge_participants cp WHERE cp.challenge_id = challenges.id AND cp.user_id = auth.uid())))
);

CREATE POLICY "Users can join challenges"
ON public.challenge_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their challenge progress"
ON public.challenge_participants FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for leaderboard_entries
CREATE POLICY "Users can view leaderboard entries"
ON public.leaderboard_entries FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own leaderboard entries"
ON public.leaderboard_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entries"
ON public.leaderboard_entries FOR UPDATE
USING (auth.uid() = user_id);