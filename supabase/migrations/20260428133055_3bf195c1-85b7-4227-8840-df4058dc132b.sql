
-- ========== TABLES (criadas antes das funções que as referenciam) ==========
CREATE TABLE public.profiles (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.couples (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  anniversary_date DATE NOT NULL,
  invite_code TEXT UNIQUE,
  invite_expires_at TIMESTAMPTZ,
  public_handle TEXT UNIQUE,
  public_avatar_url TEXT,
  public_city TEXT,
  is_discoverable BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_couples_invite_code ON public.couples(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX idx_couples_handle ON public.couples(public_handle) WHERE public_handle IS NOT NULL;

CREATE TABLE public.couple_members (
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (couple_id, user_id),
  UNIQUE (user_id)
);
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_couple_members_user ON public.couple_members(user_id);

CREATE TABLE public.restaurants (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('visited','wishlist')),
  name TEXT NOT NULL,
  location TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  favorite_dish TEXT,
  image_url TEXT,
  visited_at DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_restaurants_couple ON public.restaurants(couple_id);

CREATE TABLE public.wishlist_items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price NUMERIC(12,2),
  currency TEXT DEFAULT 'BRL',
  brand TEXT,
  for_whom TEXT NOT NULL DEFAULT 'us' CHECK (for_whom IN ('her','him','us')),
  status TEXT NOT NULL DEFAULT 'wanted' CHECK (status IN ('wanted','bought','gifted')),
  status_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_wishlist_couple ON public.wishlist_items(couple_id);

CREATE TABLE public.events (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'date' CHECK (event_type IN ('anniversary','birthday','milestone','date','trip','other')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  recurrence TEXT CHECK (recurrence IN ('yearly','monthly','weekly')),
  google_event_id TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_events_couple_date ON public.events(couple_id, starts_at);

CREATE TABLE public.day_memories (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  memory_date DATE NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  mood TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.day_memories ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_day_memories_couple_date ON public.day_memories(couple_id, memory_date);

CREATE TABLE public.couple_friendships (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_a UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  couple_b UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (couple_a <> couple_b),
  UNIQUE (couple_a, couple_b)
);
ALTER TABLE public.couple_friendships ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_friendships_a ON public.couple_friendships(couple_a);
CREATE INDEX idx_friendships_b ON public.couple_friendships(couple_b);

CREATE TABLE public.shared_posts (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('memory','restaurant','milestone','custom')),
  ref_id UUID,
  caption TEXT NOT NULL,
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shared_posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_shared_posts_couple ON public.shared_posts(couple_id, created_at DESC);

CREATE TABLE public.activities (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activities_couple ON public.activities(couple_id, created_at DESC);

-- ========== SECURITY DEFINER HELPERS (após tabelas) ==========
CREATE OR REPLACE FUNCTION public.get_user_couple_id(_user_id UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT couple_id FROM public.couple_members WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_couple_member(_couple_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.couple_members WHERE couple_id = _couple_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.are_couples_friends(_a UUID, _b UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couple_friendships
    WHERE status = 'accepted'
      AND ((couple_a = _a AND couple_b = _b) OR (couple_a = _b AND couple_b = _a))
  );
$$;

-- ========== POLICIES ==========
-- profiles
CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users see partner profile" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.couple_members cm1
    JOIN public.couple_members cm2 ON cm1.couple_id = cm2.couple_id
    WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.user_id
  ));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- couples
CREATE POLICY "Members see their couple" ON public.couples FOR SELECT TO authenticated USING (public.is_couple_member(id, auth.uid()));
CREATE POLICY "Discoverable couples are public" ON public.couples FOR SELECT TO authenticated USING (is_discoverable = true);
CREATE POLICY "Users create their couple" ON public.couples FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Members update their couple" ON public.couples FOR UPDATE TO authenticated USING (public.is_couple_member(id, auth.uid()));
CREATE POLICY "Members delete their couple" ON public.couples FOR DELETE TO authenticated USING (public.is_couple_member(id, auth.uid()));

-- couple_members
CREATE POLICY "Members see their membership" ON public.couple_members FOR SELECT TO authenticated USING (public.is_couple_member(couple_id, auth.uid()));
CREATE POLICY "Users join couples" ON public.couple_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave their couple" ON public.couple_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- restaurants
CREATE POLICY "Couple members manage restaurants" ON public.restaurants FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid())) WITH CHECK (public.is_couple_member(couple_id, auth.uid()));

-- wishlist
CREATE POLICY "Couple members manage wishlist" ON public.wishlist_items FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid())) WITH CHECK (public.is_couple_member(couple_id, auth.uid()));

-- events
CREATE POLICY "Couple members manage events" ON public.events FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid())) WITH CHECK (public.is_couple_member(couple_id, auth.uid()));

-- day_memories
CREATE POLICY "Couple members manage memories" ON public.day_memories FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid())) WITH CHECK (public.is_couple_member(couple_id, auth.uid()));

-- couple_friendships
CREATE POLICY "Members see their friendships" ON public.couple_friendships FOR SELECT TO authenticated
  USING (public.is_couple_member(couple_a, auth.uid()) OR public.is_couple_member(couple_b, auth.uid()));
CREATE POLICY "Members create friend requests" ON public.couple_friendships FOR INSERT TO authenticated
  WITH CHECK (public.is_couple_member(couple_a, auth.uid()) AND requested_by = auth.uid());
CREATE POLICY "Receivers update friendships" ON public.couple_friendships FOR UPDATE TO authenticated
  USING (public.is_couple_member(couple_a, auth.uid()) OR public.is_couple_member(couple_b, auth.uid()));
CREATE POLICY "Members delete friendships" ON public.couple_friendships FOR DELETE TO authenticated
  USING (public.is_couple_member(couple_a, auth.uid()) OR public.is_couple_member(couple_b, auth.uid()));

-- shared_posts
CREATE POLICY "Couple sees own shared posts" ON public.shared_posts FOR SELECT TO authenticated USING (public.is_couple_member(couple_id, auth.uid()));
CREATE POLICY "Friends see shared posts" ON public.shared_posts FOR SELECT TO authenticated
  USING (public.are_couples_friends(public.get_user_couple_id(auth.uid()), couple_id));
CREATE POLICY "Couple members create shared posts" ON public.shared_posts FOR INSERT TO authenticated WITH CHECK (public.is_couple_member(couple_id, auth.uid()));
CREATE POLICY "Couple members update shared posts" ON public.shared_posts FOR UPDATE TO authenticated USING (public.is_couple_member(couple_id, auth.uid()));
CREATE POLICY "Couple members delete shared posts" ON public.shared_posts FOR DELETE TO authenticated USING (public.is_couple_member(couple_id, auth.uid()));

-- activities
CREATE POLICY "Couple members see activities" ON public.activities FOR SELECT TO authenticated USING (public.is_couple_member(couple_id, auth.uid()));
CREATE POLICY "Couple members create activities" ON public.activities FOR INSERT TO authenticated
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()) AND actor_id = auth.uid());

-- ========== TRIGGERS ==========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_couples_updated BEFORE UPDATE ON public.couples FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_wishlist_updated BEFORE UPDATE ON public.wishlist_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_memories_updated BEFORE UPDATE ON public.day_memories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_friendships_updated BEFORE UPDATE ON public.couple_friendships FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
