-- ────────────────────────────────────────────────────────────────────────────
-- External Contacts
--
-- Tracks email contacts who are not yet app members. Used to send meeting
-- reminders (and other emails) to the broader Christians Innovate community.
-- Supabase is source of truth; Resend Audience is a downstream sync target.
-- ────────────────────────────────────────────────────────────────────────────

-- Add resend_contact_id to user_profiles so we can update/manage app members
-- in the Resend Audience after syncing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'user_profiles'
      AND column_name  = 'resend_contact_id'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN resend_contact_id TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.user_profiles.resend_contact_id IS
  'Resend Audience contact ID; populated after first sync so we can update or unsubscribe them in Resend';

-- ── External contacts table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.external_contacts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT        NOT NULL UNIQUE,
  first_name        TEXT,
  last_name         TEXT,
  is_unsubscribed   BOOLEAN     NOT NULL DEFAULT false,
  resend_contact_id TEXT,
  last_synced_at    TIMESTAMP WITH TIME ZONE,
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.external_contacts IS
  'Email contacts who are not yet app members. Receives meeting reminders with a signup CTA.';
COMMENT ON COLUMN public.external_contacts.email             IS 'Primary identifier for the contact';
COMMENT ON COLUMN public.external_contacts.is_unsubscribed   IS 'True if the contact has opted out of all emails';
COMMENT ON COLUMN public.external_contacts.resend_contact_id IS 'Resend Audience contact ID; populated after first sync';
COMMENT ON COLUMN public.external_contacts.last_synced_at    IS 'Timestamp of the last successful push to Resend';
COMMENT ON COLUMN public.external_contacts.notes             IS 'Optional admin notes (e.g. how they joined the list)';

-- ── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_external_contacts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS external_contacts_updated_at ON public.external_contacts;
CREATE TRIGGER external_contacts_updated_at
  BEFORE UPDATE ON public.external_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_external_contacts_updated_at();

-- ── Row-level security ───────────────────────────────────────────────────────

ALTER TABLE public.external_contacts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage external contacts"
  ON public.external_contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id  = auth.uid()
        AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id  = auth.uid()
        AND is_admin = true
    )
  );
