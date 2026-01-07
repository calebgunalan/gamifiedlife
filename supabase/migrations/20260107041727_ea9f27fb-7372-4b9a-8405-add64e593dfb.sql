-- Create guilds table for larger social groups (10-50+ members)
CREATE TABLE public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '⚔️',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  member_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 50,
  focus_area public.life_area,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create guild_members table
CREATE TABLE public.guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guild_id, user_id)
);

-- Create post_comments table for social feed
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create party_messages table for party chat
CREATE TABLE public.party_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_messages ENABLE ROW LEVEL SECURITY;

-- Guilds policies
CREATE POLICY "Anyone can view public guilds" ON public.guilds
  FOR SELECT USING (is_public = true OR EXISTS (
    SELECT 1 FROM public.guild_members 
    WHERE guild_members.guild_id = guilds.id 
    AND guild_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create guilds" ON public.guilds
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Guild owners can update their guilds" ON public.guilds
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Guild owners can delete their guilds" ON public.guilds
  FOR DELETE USING (auth.uid() = created_by);

-- Guild members policies
CREATE POLICY "Users can view guild members of their guilds" ON public.guild_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.guild_members gm 
    WHERE gm.guild_id = guild_members.guild_id 
    AND gm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.guilds 
    WHERE guilds.id = guild_members.guild_id 
    AND guilds.is_public = true
  ));

CREATE POLICY "Users can join guilds" ON public.guild_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave guilds" ON public.guild_members
  FOR DELETE USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "Users can view comments on visible posts" ON public.post_comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.social_posts sp
    WHERE sp.id = post_comments.post_id
    AND (
      auth.uid() = sp.user_id 
      OR sp.visibility = 'public'
      OR (sp.visibility = 'friends' AND EXISTS (
        SELECT 1 FROM public.friends
        WHERE friends.status = 'accepted'
        AND ((friends.user_id = auth.uid() AND friends.friend_id = sp.user_id)
          OR (friends.friend_id = auth.uid() AND friends.user_id = sp.user_id))
      ))
    )
  ));

CREATE POLICY "Users can create comments" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Party messages policies
CREATE POLICY "Party members can view messages" ON public.party_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.party_members pm
    WHERE pm.party_id = party_messages.party_id
    AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Party members can send messages" ON public.party_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.party_members pm
      WHERE pm.party_id = party_messages.party_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own messages" ON public.party_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for party messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_messages;