-- ============================================
-- COMPLETE DATABASE SCHEMA EXPORT
-- Generated for: christians-innovate-app
-- ============================================

-- ============================================
-- DROP EXISTING TABLES (for clean migration)
-- ============================================

DROP TABLE IF EXISTS public.day_comments CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.post_reactions CASCADE;
DROP TABLE IF EXISTS public.launch_prayer_posts CASCADE;
DROP TABLE IF EXISTS public.meeting_attendance CASCADE;
DROP TABLE IF EXISTS public.meeting_attendees CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.plan_subscriptions CASCADE;
DROP TABLE IF EXISTS public.plan_days CASCADE;
DROP TABLE IF EXISTS public.reading_plans CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.bible_verses CASCADE;

-- ============================================
-- TABLES
-- ============================================

-- User profiles table (linked to auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  ci_updates BOOLEAN DEFAULT false,
  bible_year BOOLEAN DEFAULT false,
  skill_share BOOLEAN DEFAULT false,
  referral TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}'::TEXT[],
  interests TEXT[] DEFAULT '{}'::TEXT[],
  looking_for_business_partner BOOLEAN DEFAULT false,
  looking_for_accountability_partner BOOLEAN DEFAULT false,
  linkedin_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reading plans table
CREATE TABLE public.reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Plan days table
CREATE TABLE public.plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.reading_plans(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  scripture_reference TEXT NOT NULL,
  content_markdown TEXT,
  date_assigned DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(plan_id, day_number)
);

-- Plan subscriptions table
CREATE TABLE public.plan_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.reading_plans(id) ON DELETE CASCADE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, plan_id)
);

-- User progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_id UUID REFERENCES public.plan_days(id) ON DELETE CASCADE NOT NULL,
  is_completed BOOLEAN DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, day_id)
);

-- Meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  zoom_link TEXT NOT NULL,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Meeting attendees table
CREATE TABLE public.meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(meeting_id, user_id)
);

-- Launch/Prayer posts table
CREATE TABLE public.launch_prayer_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('launch', 'prayer', 'win')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Post reactions table
CREATE TABLE public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.launch_prayer_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id, emoji)
);

-- Post comments table
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.launch_prayer_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Day comments table
CREATE TABLE public.day_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES public.plan_days(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Meeting attendance table (for tracking who attended meetings)
CREATE TABLE public.meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(meeting_id, user_id)
);

-- Bible verses cache table
CREATE TABLE public.bible_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER,
  verse_end INTEGER,
  reference TEXT NOT NULL,
  text TEXT NOT NULL,
  html_text TEXT,
  bible_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_days_plan_id ON public.plan_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_subscriptions_user_id ON public.plan_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_subscriptions_plan_id ON public.plan_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_day_id ON public.user_progress(day_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON public.meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user_id ON public.meeting_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting_id ON public.meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_user_id ON public.meeting_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_launch_prayer_posts_user_id ON public.launch_prayer_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_launch_prayer_posts_type ON public.launch_prayer_posts(type);
CREATE INDEX IF NOT EXISTS idx_launch_prayer_posts_is_hidden ON public.launch_prayer_posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_day_comments_day_id ON public.day_comments(day_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_lookup ON public.bible_verses(translation, book, chapter, verse_start, verse_end);

-- ============================================
-- FUNCTIONS (Required for RLS Policies)
-- ============================================

-- Function to check if user is admin (bypasses RLS to prevent infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = is_admin.user_id 
    AND is_admin = true
  );
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_prayer_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_comments ENABLE ROW LEVEL SECURITY;

-- User profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
CREATE POLICY "Users can view all profiles" ON public.user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User roles policies
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (
  public.is_admin(auth.uid())
);

-- Reading plans policies
DROP POLICY IF EXISTS "Anyone can view plans" ON public.reading_plans;
CREATE POLICY "Anyone can view plans" ON public.reading_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can manage plans" ON public.reading_plans;
CREATE POLICY "Only admins can manage plans" ON public.reading_plans FOR ALL USING (
  public.is_admin(auth.uid())
);

-- Plan days policies
DROP POLICY IF EXISTS "Anyone can view plan days" ON public.plan_days;
CREATE POLICY "Anyone can view plan days" ON public.plan_days FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can manage plan days" ON public.plan_days;
CREATE POLICY "Only admins can manage plan days" ON public.plan_days FOR ALL USING (
  public.is_admin(auth.uid())
);

-- Plan subscriptions policies
DROP POLICY IF EXISTS "Users can view all subscriptions" ON public.plan_subscriptions;
CREATE POLICY "Users can view all subscriptions" ON public.plan_subscriptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.plan_subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON public.plan_subscriptions FOR ALL USING (auth.uid() = user_id);

-- User progress policies
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;
CREATE POLICY "Users can manage own progress" ON public.user_progress FOR ALL USING (auth.uid() = user_id);

-- Meetings policies
DROP POLICY IF EXISTS "Anyone can view meetings" ON public.meetings;
CREATE POLICY "Anyone can view meetings" ON public.meetings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can manage meetings" ON public.meetings;
CREATE POLICY "Only admins can manage meetings" ON public.meetings FOR ALL USING (
  public.is_admin(auth.uid())
);

-- Meeting attendees policies
DROP POLICY IF EXISTS "Users can view all attendees" ON public.meeting_attendees;
CREATE POLICY "Users can view all attendees" ON public.meeting_attendees FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can register themselves" ON public.meeting_attendees;
CREATE POLICY "Users can register themselves" ON public.meeting_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unregister themselves" ON public.meeting_attendees;
CREATE POLICY "Users can unregister themselves" ON public.meeting_attendees FOR DELETE USING (auth.uid() = user_id);

-- Launch/Prayer posts policies
DROP POLICY IF EXISTS "Anyone can view active posts" ON public.launch_prayer_posts;
CREATE POLICY "Anyone can view active posts" ON public.launch_prayer_posts FOR SELECT USING (is_active = true OR user_id = auth.uid());
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.launch_prayer_posts;
CREATE POLICY "Authenticated users can create posts" ON public.launch_prayer_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own posts" ON public.launch_prayer_posts;
CREATE POLICY "Users can update own posts" ON public.launch_prayer_posts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own posts" ON public.launch_prayer_posts;
CREATE POLICY "Users can delete own posts" ON public.launch_prayer_posts FOR DELETE USING (auth.uid() = user_id);

-- Post reactions policies
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.post_reactions;
CREATE POLICY "Anyone can view reactions" ON public.post_reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can add own reactions" ON public.post_reactions;
CREATE POLICY "Users can add own reactions" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove own reactions" ON public.post_reactions;
CREATE POLICY "Users can remove own reactions" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Post comments policies
DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.post_comments;
CREATE POLICY "Authenticated users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own comments" ON public.post_comments;
CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Day comments policies
DROP POLICY IF EXISTS "Anyone can view day comments" ON public.day_comments;
CREATE POLICY "Anyone can view day comments" ON public.day_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create day comments" ON public.day_comments;
CREATE POLICY "Authenticated users can create day comments" ON public.day_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own day comments" ON public.day_comments;
CREATE POLICY "Users can update own day comments" ON public.day_comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own day comments" ON public.day_comments;
CREATE POLICY "Users can delete own day comments" ON public.day_comments FOR DELETE USING (auth.uid() = user_id);

-- Meeting attendance policies
DROP POLICY IF EXISTS "Users can view all attendance" ON public.meeting_attendance;
CREATE POLICY "Users can view all attendance" ON public.meeting_attendance FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can track attendance" ON public.meeting_attendance;
CREATE POLICY "Users can track attendance" ON public.meeting_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bible verses policies (public read, authenticated write for caching)
DROP POLICY IF EXISTS "Anyone can read Bible verses" ON public.bible_verses;
CREATE POLICY "Anyone can read Bible verses" ON public.bible_verses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can cache verses" ON public.bible_verses;
CREATE POLICY "Authenticated users can cache verses" ON public.bible_verses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to check if user is admin (bypasses RLS to prevent infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = is_admin.user_id 
    AND is_admin = true
  );
END;
$$;

-- Function to handle new user signup and create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, full_name, ci_updates, bible_year, skill_share, referral)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'ci_updates')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'bible_year')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'skill_share')::boolean, false),
    NEW.raw_user_meta_data->>'referral'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to sync user metadata updates
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE user_profiles
  SET 
    full_name = NEW.raw_user_meta_data->>'full_name',
    updated_at = NOW()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger for user metadata updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.sync_user_metadata();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reading_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.plan_days FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.launch_prayer_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.day_comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();