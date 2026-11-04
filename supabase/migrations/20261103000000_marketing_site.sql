-- The public marketing site (site/) at christiansinnovate.com.
--
-- Visitors aren't signed in, so everything they can do goes through narrow SECURITY DEFINER
-- functions instead of table grants:
--   * contact and suggestion forms land in the admin Inbox (inbox_messages)
--   * Bible Year signups join the mailing list (external_contacts) and drop a note in the Inbox
--   * NYTW: approved events are public; anyone can submit one for review and like one

-- ── Contact and suggestions → Inbox ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.site_contact(
  p_name TEXT,
  p_email TEXT,
  p_topic TEXT,
  p_message TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT := nullif(btrim(coalesce(p_name, '')), '');
  v_email TEXT := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_topic TEXT := coalesce(nullif(btrim(coalesce(p_topic, '')), ''), 'Website message');
  v_message TEXT := btrim(coalesce(p_message, ''));
BEGIN
  IF length(v_message) < 2 OR length(v_message) > 5000 THEN
    RAISE EXCEPTION 'message must be 2 to 5000 characters' USING ERRCODE = '22023';
  END IF;
  IF v_email IS NOT NULL AND (length(v_email) > 254 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'invalid email' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(v_name, '')) > 120 OR length(v_topic) > 120 THEN
    RAISE EXCEPTION 'name or topic too long' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.inbox_messages (from_email, from_name, to_email, reply_to, subject, body_text, headers)
  VALUES (
    coalesce(v_email, 'anonymous'),
    coalesce(v_name, 'Anonymous'),
    'community@christiansinnovate.com',
    v_email,
    '[Website] ' || v_topic,
    v_message,
    jsonb_build_object('source', 'website')
  );
END;
$$;

-- ── Bible Year signup → mailing list ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.site_signup(
  p_name TEXT,
  p_email TEXT,
  p_referred_by TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT := btrim(coalesce(p_name, ''));
  v_email TEXT := lower(btrim(coalesce(p_email, '')));
  v_ref TEXT := nullif(btrim(coalesce(p_referred_by, '')), '');
  v_first TEXT := split_part(v_name, ' ', 1);
  v_last TEXT := nullif(btrim(substr(v_name, length(split_part(v_name, ' ', 1)) + 1)), '');
BEGIN
  IF length(v_name) < 1 OR length(v_name) > 120 THEN
    RAISE EXCEPTION 'name must be 1 to 120 characters' USING ERRCODE = '22023';
  END IF;
  IF length(v_email) > 254 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid email' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(v_ref, '')) > 120 THEN
    RAISE EXCEPTION 'referral too long' USING ERRCODE = '22023';
  END IF;

  -- Signing up again is an explicit opt-in, so it resubscribes; existing names are kept.
  INSERT INTO public.external_contacts (email, first_name, last_name, notes)
  VALUES (
    v_email, v_first, v_last,
    'Bible Year signup on the website' || coalesce('; referred by ' || v_ref, '')
  )
  ON CONFLICT (email) DO UPDATE SET
    is_unsubscribed = false,
    first_name = coalesce(public.external_contacts.first_name, EXCLUDED.first_name),
    last_name = coalesce(public.external_contacts.last_name, EXCLUDED.last_name);

  INSERT INTO public.inbox_messages (from_email, from_name, to_email, reply_to, subject, body_text, headers)
  VALUES (
    v_email, v_name, 'community@christiansinnovate.com', v_email,
    '[Website] Bible Year signup',
    v_name || ' (' || v_email || ') joined Bible Year' || coalesce(', referred by ' || v_ref, '') || '.',
    jsonb_build_object('source', 'website', 'kind', 'signup')
  );
END;
$$;

-- ── NYTW curated events ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.nytw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  event_date DATE NOT NULL,
  time TEXT,
  address TEXT,
  neighborhood TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nytw_event_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  link TEXT CHECK (length(link) <= 500),
  event_date DATE,
  time TEXT CHECK (length(time) <= 60),
  address TEXT CHECK (length(address) <= 300),
  neighborhood TEXT CHECK (length(neighborhood) <= 80),
  details TEXT CHECK (length(details) <= 3000),
  submitter_email TEXT CHECK (length(submitter_email) <= 254),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nytw_event_likes (
  event_id UUID NOT NULL REFERENCES public.nytw_events(id) ON DELETE CASCADE,
  -- A random id the browser keeps, so a visitor can like and unlike without an account.
  anon_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, anon_id)
);

CREATE INDEX IF NOT EXISTS idx_nytw_events_date ON public.nytw_events(event_date);

ALTER TABLE public.nytw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nytw_event_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nytw_event_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active NYTW events" ON public.nytw_events;
CREATE POLICY "Anyone can view active NYTW events" ON public.nytw_events
  FOR SELECT USING (is_active OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins manage NYTW events" ON public.nytw_events;
CREATE POLICY "Admins manage NYTW events" ON public.nytw_events
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can submit a NYTW event for review" ON public.nytw_event_submissions;
CREATE POLICY "Anyone can submit a NYTW event for review" ON public.nytw_event_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
DROP POLICY IF EXISTS "Admins manage NYTW submissions" ON public.nytw_event_submissions;
CREATE POLICY "Admins manage NYTW submissions" ON public.nytw_event_submissions
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Likes are only read and written through the functions below.
DROP POLICY IF EXISTS "Admins manage NYTW likes" ON public.nytw_event_likes;
CREATE POLICY "Admins manage NYTW likes" ON public.nytw_event_likes
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.nytw_events TO anon, authenticated;
GRANT INSERT ON public.nytw_event_submissions TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.nytw_like_counts()
RETURNS TABLE (event_id UUID, likes BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.event_id, count(*) FROM public.nytw_event_likes l
  JOIN public.nytw_events e ON e.id = l.event_id AND e.is_active
  GROUP BY l.event_id;
$$;

-- Likes or unlikes an event for this browser; returns whether it's now liked.
CREATE OR REPLACE FUNCTION public.nytw_toggle_like(p_event_id UUID, p_anon_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.nytw_events WHERE id = p_event_id AND is_active) THEN
    RAISE EXCEPTION 'no such event' USING ERRCODE = '22023';
  END IF;
  DELETE FROM public.nytw_event_likes WHERE event_id = p_event_id AND anon_id = p_anon_id;
  IF FOUND THEN
    RETURN false;
  END IF;
  INSERT INTO public.nytw_event_likes (event_id, anon_id) VALUES (p_event_id, p_anon_id);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.site_contact(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.site_signup(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nytw_like_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nytw_toggle_like(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.site_contact(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.site_signup(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nytw_like_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nytw_toggle_like(UUID, UUID) TO anon, authenticated;
