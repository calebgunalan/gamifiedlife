-- Create friends table
CREATE TABLE public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create social_posts table
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'achievement' CHECK (post_type IN ('achievement', 'milestone', 'streak', 'level_up', 'custom')),
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'private')),
  related_achievement_id UUID REFERENCES public.achievements(id),
  related_area TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Update profiles RLS to allow viewing friend profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.friends
      WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = profiles.id) OR (friend_id = auth.uid() AND user_id = profiles.id))
    )
  );

-- Friends policies
CREATE POLICY "Users can view their friendships"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id AND user_id != friend_id);

CREATE POLICY "Users can update friendships they receive"
  ON public.friends FOR UPDATE
  USING (auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Social posts policies
CREATE POLICY "Users can view posts based on visibility"
  ON public.social_posts FOR SELECT
  USING (
    auth.uid() = user_id OR
    visibility = 'public' OR
    (visibility = 'friends' AND EXISTS (
      SELECT 1 FROM public.friends
      WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = social_posts.user_id) OR (friend_id = auth.uid() AND user_id = social_posts.user_id))
    ))
  );

CREATE POLICY "Users can create their own posts"
  ON public.social_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.social_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.social_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "Users can view likes on visible posts"
  ON public.post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_posts
      WHERE social_posts.id = post_likes.post_id
      AND (
        auth.uid() = social_posts.user_id OR
        visibility = 'public' OR
        (visibility = 'friends' AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE status = 'accepted'
          AND ((user_id = auth.uid() AND friend_id = social_posts.user_id) OR (friend_id = auth.uid() AND user_id = social_posts.user_id))
        ))
      )
    )
  );

CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);