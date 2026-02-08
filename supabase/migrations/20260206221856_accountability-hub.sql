-- 1. Accountability Groups
CREATE TABLE public.accountability_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_objective TEXT NOT NULL DEFAULT 'Establish a Green Light Project',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  rhythm_config JSONB DEFAULT '{"frequency": "weekly", "day": "Monday", "time": "09:00"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Link User Profiles (Ensuring one-to-one or one-to-many relationship)
ALTER TABLE public.user_profiles 
ADD COLUMN accountability_group_id UUID REFERENCES public.accountability_groups(id) ON DELETE SET NULL;

-- 3. Group Commitments (The Friction-Remover Feed)
CREATE TABLE public.group_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.accountability_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  commitment_text TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'sacrificed')), -- Added 'sacrificed' per your brief
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Debrief Sessions (The Reflective Module)
CREATE TABLE public.debrief_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.accountability_groups(id) ON DELETE CASCADE NOT NULL,
  facilitator_id UUID REFERENCES auth.users(id) NOT NULL,
  reflection_notes TEXT,
  hard_question_response TEXT,
  session_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE OR REPLACE FUNCTION public.get_user_group()
RETURNS UUID AS $$
  SELECT accountability_group_id FROM public.user_profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.accountability_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debrief_sessions ENABLE ROW LEVEL SECURITY;

-- 1. Groups: Members can view their own group, OR the creator can always view it
CREATE POLICY "View own group" ON public.accountability_groups
FOR SELECT USING (
  id = public.get_user_group()
  OR created_by = auth.uid()
);

-- 2. Groups: Any authenticated user can create a group (they set created_by = their uid)
CREATE POLICY "Create group" ON public.accountability_groups
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 3. Groups: Only the creator can update their group
CREATE POLICY "Update own group" ON public.accountability_groups
FOR UPDATE USING (auth.uid() = created_by);

-- 4. Groups: Only the creator can delete their group
CREATE POLICY "Delete own group" ON public.accountability_groups
FOR DELETE USING (auth.uid() = created_by);

-- 5. Commitments: Members can view and create in their group
CREATE POLICY "Manage group commitments" ON public.group_commitments
FOR ALL USING (group_id = public.get_user_group());

-- 6. Debriefs: Members can view and create in their group
CREATE POLICY "Manage group debriefs" ON public.debrief_sessions
FOR ALL USING (group_id = public.get_user_group());

