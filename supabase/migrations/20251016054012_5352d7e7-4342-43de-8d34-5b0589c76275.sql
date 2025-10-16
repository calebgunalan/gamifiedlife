-- Add privacy settings table
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  show_on_leaderboards BOOLEAN DEFAULT true,
  show_spiritual_progress BOOLEAN DEFAULT false,
  allow_party_invites BOOLEAN DEFAULT true,
  share_milestones BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own privacy settings"
ON public.privacy_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings"
ON public.privacy_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings"
ON public.privacy_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Add party invitations table
CREATE TABLE IF NOT EXISTS public.party_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(party_id, invited_user_id)
);

ALTER TABLE public.party_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invitations"
ON public.party_invitations FOR SELECT
USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);

CREATE POLICY "Party members can invite others"
ON public.party_invitations FOR INSERT
WITH CHECK (
  auth.uid() = invited_by AND
  EXISTS (
    SELECT 1 FROM public.party_members
    WHERE party_id = party_invitations.party_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Invited users can update invitation status"
ON public.party_invitations FOR UPDATE
USING (auth.uid() = invited_user_id);

-- Add monthly XP tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_reset_date DATE DEFAULT date_trunc('month', CURRENT_DATE);

-- Update handle_new_user to create privacy settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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

  -- Initialize privacy settings
  INSERT INTO privacy_settings (user_id)
  VALUES (NEW.id);

  -- Initialize notification preferences if not exists
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;