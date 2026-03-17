-- 1. Add the is_default column
-- We set DEFAULT false so existing plans don't accidentally become the default.
ALTER TABLE public.reading_plans
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false NOT NULL;

-- 2. Ensure the Partial Unique Index exists
-- We use DROP/CREATE to ensure it's clean if re-run
DROP INDEX IF EXISTS one_default_plan_idx;
CREATE UNIQUE INDEX one_default_plan_idx
ON public.reading_plans (is_default)
WHERE (is_default = true);

-- 3. Update the handle_new_user function
-- We need to check if the user opted in to 'bible_year' and subscribe them 
-- to the default plan automatically during the signup trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    default_plan_id UUID;
BEGIN
-- CREATE the profile first
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
-- Check if they want the Bible in a Year plan
IF (NEW.raw_user_meta_data->>'bible_year')::boolean = true THEN
    --Find the ID of the plan marked as default
    SELECT id INTO default_plan_id FROM public.reading_plans WHERE is_default = true LIMIT 1;

    -- If a default plan exists, subscribe the user
    IF default_plan_id IS NOT NULL THEN
        INSERT INTO public.plan_subscriptions (user_id, plan_id)
        VALUES (NEW.id, default_plan_id)
        ON CONFLICT (user_id, plan_id) DO NOTHING;
    ELSE 
        -- Log when no default plan exists.
        RAISE WARNING 'User % opted into bible_year but no default plan exists', NEW.email;
    END IF;
END IF;
    RETURN NEW;
END;
$$;

-- Re-bind the trigger to ensure it uses the updated function logic
-- We drop and recreate it so we are 100% sure it's active and correct.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
