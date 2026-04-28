-- RPC: join couple by invite code (security definer to bypass RLS for the lookup)
CREATE OR REPLACE FUNCTION public.join_couple_by_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_expires timestamptz;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT id, invite_expires_at
    INTO v_couple_id, v_expires
  FROM public.couples
  WHERE invite_code = upper(_code)
  LIMIT 1;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  IF v_expires IS NOT NULL AND v_expires < now() THEN
    RAISE EXCEPTION 'code_expired';
  END IF;

  -- prevent user from joining if already in another couple
  IF EXISTS (SELECT 1 FROM public.couple_members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'already_in_couple';
  END IF;

  INSERT INTO public.couple_members (couple_id, user_id)
  VALUES (v_couple_id, v_uid)
  ON CONFLICT DO NOTHING;

  RETURN v_couple_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_couple_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_couple_by_code(text) TO authenticated;