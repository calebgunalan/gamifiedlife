-- Fix security warning: Set search_path for handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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