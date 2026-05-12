-- =============================================================
-- CodeConnect Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- USERS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  leetcode_username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_leetcode_username ON public.users(leetcode_username);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- LEETCODE STATS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.leetcode_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leetcode_username TEXT NOT NULL,
  total_solved INTEGER DEFAULT 0,
  easy_solved INTEGER DEFAULT 0,
  medium_solved INTEGER DEFAULT 0,
  hard_solved INTEGER DEFAULT 0,
  total_easy INTEGER DEFAULT 0,
  total_medium INTEGER DEFAULT 0,
  total_hard INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  ranking INTEGER DEFAULT 0,
  contribution_points INTEGER DEFAULT 0,
  last_fetched TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leetcode_stats_user_id ON public.leetcode_stats(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leetcode_stats_user_unique ON public.leetcode_stats(user_id);

-- =============================================================
-- FRIEND REQUESTS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

-- =============================================================
-- FRIENDS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);

-- =============================================================
-- POSTS TABLE (Doubt Posts)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  problem_url TEXT,
  problem_title TEXT,
  tags TEXT[] DEFAULT '{}',
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- COMMENTS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);

-- =============================================================
-- POST LIKES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =============================================================
-- CONVERSATIONS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON public.conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last ON public.conversations(last_message_at DESC);

-- =============================================================
-- MESSAGES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leetcode_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users: anyone can view, only self can update
CREATE POLICY "Users are viewable by all" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- LeetCode Stats: viewable by all, editable by owner
CREATE POLICY "Stats viewable by all" ON public.leetcode_stats FOR SELECT USING (true);
CREATE POLICY "Stats insertable by owner" ON public.leetcode_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Stats updatable by owner" ON public.leetcode_stats FOR UPDATE USING (auth.uid() = user_id);

-- Friend Requests: visible to sender and receiver
CREATE POLICY "Friend requests visible to participants" ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver can update request" ON public.friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);
CREATE POLICY "Participants can delete request" ON public.friend_requests FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Friends: visible to participants
CREATE POLICY "Friends visible to both users" ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Friends insertable by system" ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Friends deletable by participants" ON public.friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Posts: viewable by all authenticated users
CREATE POLICY "Posts viewable by authenticated users" ON public.posts FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update posts" ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete posts" ON public.posts FOR DELETE
  USING (auth.uid() = author_id);

-- Comments: viewable by all authenticated
CREATE POLICY "Comments viewable by authenticated" ON public.comments FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can comment" ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete comments" ON public.comments FOR DELETE
  USING (auth.uid() = author_id);

-- Post Likes
CREATE POLICY "Likes viewable by all" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Conversations: only friends can message (participants only)
CREATE POLICY "Conversations visible to participants" ON public.conversations FOR SELECT
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "Participants can create conversations" ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Messages: only conversation participants
CREATE POLICY "Messages visible to conversation participants" ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );
CREATE POLICY "Sender can update message status" ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

-- =============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- REALTIME - Enable for live features
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;

