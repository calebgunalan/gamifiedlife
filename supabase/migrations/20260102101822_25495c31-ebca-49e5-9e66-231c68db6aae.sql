-- Create notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    daily_reminders BOOLEAN DEFAULT true,
    quest_reminders BOOLEAN DEFAULT true,
    streak_reminders BOOLEAN DEFAULT true,
    achievement_alerts BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    streak_warning_email BOOLEAN DEFAULT true,
    weekly_summary_email BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Add email column to profiles for notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update handle_new_user to also create notification_preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO profiles (id, character_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'character_name', 'Adventurer'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NEW.email
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

  -- Initialize privacy settings
  INSERT INTO privacy_settings (user_id)
  VALUES (NEW.id);

  -- Initialize notification preferences
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;