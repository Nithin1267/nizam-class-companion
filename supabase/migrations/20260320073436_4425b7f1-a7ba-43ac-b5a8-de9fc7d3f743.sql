CREATE OR REPLACE FUNCTION public.is_roll_number_available(p_roll_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE roll_number = p_roll_number
  );
$$;

REVOKE ALL ON FUNCTION public.is_roll_number_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_roll_number_available(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.finalize_user_profile(
  p_user_id uuid,
  p_email text,
  p_name text,
  p_roll_number text,
  p_department text DEFAULT 'Computer Science',
  p_semester integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_by_email public.profiles%ROWTYPE;
  v_existing_by_roll public.profiles%ROWTYPE;
  v_department text;
  v_semester integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'Unauthorized profile operation.'
    );
  END IF;

  v_department := COALESCE(NULLIF(TRIM(p_department), ''), 'Computer Science');
  v_semester := COALESCE(p_semester, 1);

  UPDATE public.profiles
  SET
    name = p_name,
    email = p_email,
    roll_number = p_roll_number,
    department = v_department,
    semester = v_semester,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_existing_by_email;

  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'status', 'updated');
  END IF;

  SELECT * INTO v_existing_by_email
  FROM public.profiles
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.profiles
    SET
      user_id = p_user_id,
      name = p_name,
      roll_number = p_roll_number,
      department = v_department,
      semester = v_semester,
      updated_at = now()
    WHERE id = v_existing_by_email.id;

    RETURN jsonb_build_object('ok', true, 'status', 'claimed_by_email');
  END IF;

  SELECT * INTO v_existing_by_roll
  FROM public.profiles
  WHERE roll_number = p_roll_number
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'ROLL_NUMBER_EXISTS',
      'message', 'This roll number is already registered. Please sign in with your existing account or contact your teacher/admin.'
    );
  END IF;

  INSERT INTO public.profiles (user_id, email, name, roll_number, department, semester)
  VALUES (p_user_id, p_email, p_name, p_roll_number, v_department, v_semester);

  RETURN jsonb_build_object('ok', true, 'status', 'created');
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'PROFILE_CONFLICT',
      'message', 'An account with this email or roll number already exists.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_user_profile(uuid, text, text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_user_profile(uuid, text, text, text, text, integer) TO authenticated;