-- Atomic function to set default plan without race conditions.
CREATE OR REPLACE FUNCTION public.set_default_plan_atomic(new_default_plan_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Do both operations in a single transaction
    UPDATE public.reading_plans SET is_default = false WHERE is_default = true;
    UPDATE public.reading_plans SET is_default = true WHERE id = new_default_plan_id;

    -- Verify exactly one plan in now default.
    IF (SELECT COUNT(*) FROM public.reading_plans WHERE is_default = true) != 1 THEN
        RAISE EXCEPTION 'Failed to set default plan - invalid state';
    END IF;
END;
$$;
