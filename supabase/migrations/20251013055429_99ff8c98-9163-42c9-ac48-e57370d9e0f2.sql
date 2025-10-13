-- Create enum for life areas
CREATE TYPE life_area AS ENUM (
  'physical',
  'mental',
  'productivity',
  'social',
  'financial',
  'personal',
  'spiritual'
);

-- Create profiles table for character data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  avatar_url TEXT,
  total_xp INTEGER DEFAULT 0,
  character_level INTEGER DEFAULT 1,
  monthly_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create area_progress table for skill trees
CREATE TABLE area_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  area life_area NOT NULL,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  weekly_xp INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area)
);

-- Create activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  area life_area NOT NULL,
  name TEXT NOT NULL,
  xp_value INTEGER NOT NULL CHECK (xp_value > 0 AND xp_value <= 50),
  frequency TEXT DEFAULT 'daily',
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  area life_area NOT NULL,
  xp_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Create quests table
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  area life_area NOT NULL,
  xp_reward INTEGER NOT NULL,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly')),
  is_completed BOOLEAN DEFAULT false,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create streaks table
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  area life_area NOT NULL,
  current_count INTEGER DEFAULT 0,
  longest_count INTEGER DEFAULT 0,
  last_activity_date DATE,
  freeze_count INTEGER DEFAULT 2,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area)
);

-- Create achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  area life_area,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create parties table
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create party_members table
CREATE TABLE party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for area_progress
CREATE POLICY "Users can view their own area progress"
  ON area_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own area progress"
  ON area_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own area progress"
  ON area_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for activities
CREATE POLICY "Users can view their own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for quests
CREATE POLICY "Users can view their own quests"
  ON quests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quests"
  ON quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quests"
  ON quests FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for streaks
CREATE POLICY "Users can view their own streaks"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Everyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for parties
CREATE POLICY "Users can view parties they are members of"
  ON parties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM party_members
      WHERE party_members.party_id = parties.id
      AND party_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create parties"
  ON parties FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Party creators can update their parties"
  ON parties FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for party_members
CREATE POLICY "Users can view party members of their parties"
  ON party_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM party_members pm
      WHERE pm.party_id = party_members.party_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join parties"
  ON party_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave parties"
  ON party_members FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, character_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'character_name', 'Adventurer'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  -- Initialize area progress for all 7 areas
  INSERT INTO area_progress (user_id, area, total_xp, level, weekly_xp)
  VALUES
    (NEW.id, 'physical', 0, 1, 0),
    (NEW.id, 'mental', 0, 1, 0),
    (NEW.id, 'productivity', 0, 1, 0),
    (NEW.id, 'social', 0, 1, 0),
    (NEW.id, 'financial', 0, 1, 0),
    (NEW.id, 'personal', 0, 1, 0),
    (NEW.id, 'spiritual', 0, 1, 0);

  -- Initialize streaks for all 7 areas
  INSERT INTO streaks (user_id, area, current_count, longest_count, freeze_count)
  VALUES
    (NEW.id, 'physical', 0, 0, 2),
    (NEW.id, 'mental', 0, 0, 2),
    (NEW.id, 'productivity', 0, 0, 2),
    (NEW.id, 'social', 0, 0, 2),
    (NEW.id, 'financial', 0, 0, 2),
    (NEW.id, 'personal', 0, 0, 2),
    (NEW.id, 'spiritual', 0, 0, 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert default achievements
INSERT INTO achievements (code, name, description, icon, area, requirement_type, requirement_value) VALUES
('first_steps', 'First Steps', 'Complete your first activity', '🎯', NULL, 'activity_count', 1),
('early_riser', 'Early Riser', 'Log 7 days of activities', '🌅', NULL, 'activity_count', 7),
('dedicated', 'Dedicated Adventurer', 'Maintain a 30-day streak', '🔥', NULL, 'streak_days', 30),
('physical_warrior', 'Physical Warrior', 'Reach level 10 in Physical Health', '💪', 'physical', 'area_level', 10),
('mental_sage', 'Mental Sage', 'Reach level 10 in Mental Development', '🧠', 'mental', 'area_level', 10),
('productivity_master', 'Productivity Master', 'Reach level 10 in Productivity', '⚡', 'productivity', 'area_level', 10),
('social_butterfly', 'Social Butterfly', 'Reach level 10 in Social', '🦋', 'social', 'area_level', 10),
('financial_guru', 'Financial Guru', 'Reach level 10 in Financial', '💰', 'financial', 'area_level', 10),
('personal_champion', 'Personal Champion', 'Reach level 10 in Personal Growth', '🌟', 'personal', 'area_level', 10),
('spiritual_warrior', 'Spiritual Warrior', 'Reach level 10 in Spiritual', '🕉️', 'spiritual', 'area_level', 10),
('balance_master', 'Balance Master', 'Hit targets in 5+ areas in one week', '⚖️', NULL, 'balanced_week', 5),
('meditation_initiate', 'Meditation Initiate', '7-day meditation streak', '🧘', 'spiritual', 'meditation_streak', 7),
('inner_peace', 'Inner Peace', '30-day meditation streak', '☮️', 'spiritual', 'meditation_streak', 30),
('gratitude_heart', 'Gratitude Heart', 'Log 30 days of gratitude', '❤️', 'spiritual', 'gratitude_count', 30),
('nature_lover', 'Nature Lover', 'Spend 10 hours in nature', '🌲', 'spiritual', 'nature_hours', 10),
('sacred_service', 'Sacred Service', 'Complete 20 acts of service', '🙏', 'spiritual', 'service_count', 20),
('compassion_master', 'Compassion Master', 'Complete 50 compassion practices', '💝', 'spiritual', 'compassion_count', 50);