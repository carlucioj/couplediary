-- ============================================================================
-- CoupleDiary Database Schema
-- Enterprise-grade security with Row Level Security (RLS)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate secure invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to check if user is a member of a couple
CREATE OR REPLACE FUNCTION public.is_couple_member(_couple_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND couple_id = _couple_id
  );
END;
$$;

-- Function to get user's couple_id
CREATE OR REPLACE FUNCTION public.get_user_couple_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _couple_id UUID;
BEGIN
  SELECT couple_id INTO _couple_id
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN _couple_id;
END;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Couples table
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  anniversary_date DATE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT public.generate_invite_code(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON public.profiles(couple_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Diary entries table
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 50000),
  mood TEXT CHECK (mood IN ('happy', 'love', 'grateful', 'excited', 'peaceful', 'sad', 'anxious', 'angry', 'neutral')),
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  media_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for diary entries
CREATE INDEX IF NOT EXISTS idx_diary_entries_couple_id ON public.diary_entries(couple_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_author_id ON public.diary_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at ON public.diary_entries(created_at DESC);

-- Memories table
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 5000),
  date DATE NOT NULL,
  location TEXT CHECK (char_length(location) <= 500),
  media_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for memories
CREATE INDEX IF NOT EXISTS idx_memories_couple_id ON public.memories(couple_id);
CREATE INDEX IF NOT EXISTS idx_memories_date ON public.memories(date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_tags ON public.memories USING GIN(tags);

-- Special dates table
CREATE TABLE IF NOT EXISTS public.special_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'anniversary' CHECK (type IN ('anniversary', 'birthday', 'first_date', 'engagement', 'wedding', 'custom')),
  reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for special dates
CREATE INDEX IF NOT EXISTS idx_special_dates_couple_id ON public.special_dates(couple_id);
CREATE INDEX IF NOT EXISTS idx_special_dates_date ON public.special_dates(date);

-- Audit logs table (for security tracking)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE')),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS handle_couples_updated_at ON public.couples;
CREATE TRIGGER handle_couples_updated_at
  BEFORE UPDATE ON public.couples
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_diary_entries_updated_at ON public.diary_entries;
CREATE TRIGGER handle_diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_memories_updated_at ON public.memories;
CREATE TRIGGER handle_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_special_dates_updated_at ON public.special_dates;
CREATE TRIGGER handle_special_dates_updated_at
  BEFORE UPDATE ON public.special_dates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can read profiles of their couple partner
DROP POLICY IF EXISTS "profiles_select_couple_partner" ON public.profiles;
CREATE POLICY "profiles_select_couple_partner" ON public.profiles
  FOR SELECT
  USING (
    couple_id IS NOT NULL 
    AND couple_id = public.get_user_couple_id()
  );

-- Users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- COUPLES POLICIES
-- ============================================================================

-- Users can read couples they are part of
DROP POLICY IF EXISTS "couples_select_member" ON public.couples;
CREATE POLICY "couples_select_member" ON public.couples
  FOR SELECT
  USING (public.is_couple_member(id));

-- Users can create a new couple
DROP POLICY IF EXISTS "couples_insert_authenticated" ON public.couples;
CREATE POLICY "couples_insert_authenticated" ON public.couples
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update couples they are part of
DROP POLICY IF EXISTS "couples_update_member" ON public.couples;
CREATE POLICY "couples_update_member" ON public.couples
  FOR UPDATE
  USING (public.is_couple_member(id))
  WITH CHECK (public.is_couple_member(id));

-- ============================================================================
-- DIARY ENTRIES POLICIES
-- ============================================================================

-- Users can read non-private entries from their couple
DROP POLICY IF EXISTS "diary_entries_select_couple" ON public.diary_entries;
CREATE POLICY "diary_entries_select_couple" ON public.diary_entries
  FOR SELECT
  USING (
    public.is_couple_member(couple_id)
    AND (NOT is_private OR author_id = auth.uid())
  );

-- Users can insert entries for their couple
DROP POLICY IF EXISTS "diary_entries_insert_own" ON public.diary_entries;
CREATE POLICY "diary_entries_insert_own" ON public.diary_entries
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_couple_member(couple_id)
  );

-- Users can update their own entries
DROP POLICY IF EXISTS "diary_entries_update_own" ON public.diary_entries;
CREATE POLICY "diary_entries_update_own" ON public.diary_entries
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Users can delete their own entries
DROP POLICY IF EXISTS "diary_entries_delete_own" ON public.diary_entries;
CREATE POLICY "diary_entries_delete_own" ON public.diary_entries
  FOR DELETE
  USING (author_id = auth.uid());

-- ============================================================================
-- MEMORIES POLICIES
-- ============================================================================

-- Users can read memories from their couple
DROP POLICY IF EXISTS "memories_select_couple" ON public.memories;
CREATE POLICY "memories_select_couple" ON public.memories
  FOR SELECT
  USING (public.is_couple_member(couple_id));

-- Users can insert memories for their couple
DROP POLICY IF EXISTS "memories_insert_own" ON public.memories;
CREATE POLICY "memories_insert_own" ON public.memories
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_couple_member(couple_id)
  );

-- Users can update their own memories
DROP POLICY IF EXISTS "memories_update_own" ON public.memories;
CREATE POLICY "memories_update_own" ON public.memories
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Users can delete their own memories
DROP POLICY IF EXISTS "memories_delete_own" ON public.memories;
CREATE POLICY "memories_delete_own" ON public.memories
  FOR DELETE
  USING (author_id = auth.uid());

-- ============================================================================
-- SPECIAL DATES POLICIES
-- ============================================================================

-- Users can read special dates from their couple
DROP POLICY IF EXISTS "special_dates_select_couple" ON public.special_dates;
CREATE POLICY "special_dates_select_couple" ON public.special_dates
  FOR SELECT
  USING (public.is_couple_member(couple_id));

-- Users can insert special dates for their couple
DROP POLICY IF EXISTS "special_dates_insert_couple" ON public.special_dates;
CREATE POLICY "special_dates_insert_couple" ON public.special_dates
  FOR INSERT
  WITH CHECK (public.is_couple_member(couple_id));

-- Users can update special dates from their couple
DROP POLICY IF EXISTS "special_dates_update_couple" ON public.special_dates;
CREATE POLICY "special_dates_update_couple" ON public.special_dates
  FOR UPDATE
  USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));

-- Users can delete special dates from their couple
DROP POLICY IF EXISTS "special_dates_delete_couple" ON public.special_dates;
CREATE POLICY "special_dates_delete_couple" ON public.special_dates
  FOR DELETE
  USING (public.is_couple_member(couple_id));

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

-- Users can only read their own audit logs
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Only service role can insert audit logs (handled by triggers)
DROP POLICY IF EXISTS "audit_logs_insert_service" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_service" ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id::TEXT, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id::TEXT, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id::TEXT, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_diary_entries ON public.diary_entries;
CREATE TRIGGER audit_diary_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_memories ON public.memories;
CREATE TRIGGER audit_memories
  AFTER INSERT OR UPDATE OR DELETE ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_function();

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;

GRANT SELECT ON public.couples TO anon, authenticated;
GRANT ALL ON public.couples TO authenticated;

GRANT SELECT ON public.diary_entries TO authenticated;
GRANT ALL ON public.diary_entries TO authenticated;

GRANT SELECT ON public.memories TO authenticated;
GRANT ALL ON public.memories TO authenticated;

GRANT SELECT ON public.special_dates TO authenticated;
GRANT ALL ON public.special_dates TO authenticated;

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.is_couple_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_couple_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO authenticated;
