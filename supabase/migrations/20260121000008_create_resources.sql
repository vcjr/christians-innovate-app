-- ============================================
-- RESOURCES TABLE
-- ============================================

-- Create the resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  external_url TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  
  -- Ensure at least one of file_url or external_url is provided
  CONSTRAINT resource_url_check CHECK (file_url IS NOT NULL OR external_url IS NOT NULL)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON public.resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_is_active ON public.resources(is_active);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on resources table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view active, non-hidden resources
DROP POLICY IF EXISTS "Users can view active resources" ON public.resources;
CREATE POLICY "Users can view active resources"
ON public.resources FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Users can see their own resources (even inactive/hidden)
    user_id = auth.uid() OR
    -- Users can see active, non-hidden resources from others
    (is_active = true AND is_hidden = false) OR
    -- Admins can see all resources
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.is_admin = true
    )
  )
);

-- Allow authenticated users to insert their own resources
DROP POLICY IF EXISTS "Users can create their own resources" ON public.resources;
CREATE POLICY "Users can create their own resources"
ON public.resources FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

-- Allow users to update their own resources
DROP POLICY IF EXISTS "Users can update their own resources" ON public.resources;
CREATE POLICY "Users can update their own resources"
ON public.resources FOR UPDATE
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.is_admin = true
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.is_admin = true
  )
);

-- Allow users to delete their own resources, admins can delete any
DROP POLICY IF EXISTS "Users can delete their own resources" ON public.resources;
CREATE POLICY "Users can delete their own resources"
ON public.resources FOR DELETE
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.is_admin = true
  )
);
