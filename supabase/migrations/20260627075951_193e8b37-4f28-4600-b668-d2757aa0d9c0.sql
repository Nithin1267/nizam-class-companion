
-- 1. subjects: require authentication
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
CREATE POLICY "Authenticated users can view subjects"
ON public.subjects FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 2. timetable: require authentication
DROP POLICY IF EXISTS "Anyone can view timetable" ON public.timetable;
CREATE POLICY "Authenticated users can view timetable"
ON public.timetable FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 3. attendance_records: tighten teacher access to require teacher role
DROP POLICY IF EXISTS "Teachers can view attendance for their subjects" ON public.attendance_records;
CREATE POLICY "View attendance: own, admins, assigned teachers only"
ON public.attendance_records FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.teacher_subjects ts
      WHERE ts.teacher_id = auth.uid()
        AND ts.subject_id = attendance_records.subject_id
    )
  )
);

DROP POLICY IF EXISTS "Teachers can insert attendance for their subjects" ON public.attendance_records;
CREATE POLICY "Insert attendance: assigned teachers or admins"
ON public.attendance_records FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.teacher_subjects ts
      WHERE ts.teacher_id = auth.uid()
        AND ts.subject_id = attendance_records.subject_id
    )
  )
);

DROP POLICY IF EXISTS "Teachers can update attendance for their subjects" ON public.attendance_records;
CREATE POLICY "Update attendance: assigned teachers or admins"
ON public.attendance_records FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.teacher_subjects ts
      WHERE ts.teacher_id = auth.uid()
        AND ts.subject_id = attendance_records.subject_id
    )
  )
);

-- 4. manual_alerts: students can view alerts addressed to them
CREATE POLICY "Students view alerts addressed to them"
ON public.manual_alerts FOR SELECT TO authenticated
USING (auth.uid() = student_id);

-- 5. profiles: restrict teacher visibility to students they actually teach
CREATE OR REPLACE FUNCTION public.teacher_teaches_student(_teacher_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.attendance_summary asum
    JOIN public.teacher_subjects ts ON ts.subject_id = asum.subject_id
    WHERE asum.user_id = _student_id
      AND ts.teacher_id = _teacher_id
  ) OR EXISTS (
    SELECT 1
    FROM public.attendance_records ar
    JOIN public.teacher_subjects ts ON ts.subject_id = ar.subject_id
    WHERE ar.user_id = _student_id
      AND ts.teacher_id = _teacher_id
  );
$$;
REVOKE ALL ON FUNCTION public.teacher_teaches_student(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.teacher_teaches_student(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;
CREATE POLICY "View profiles: own, admins, teachers' own students"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    AND public.teacher_teaches_student(auth.uid(), profiles.user_id)
  )
);

-- 6. student_invitations table (replaces orphaned profile creation)
CREATE TABLE IF NOT EXISTS public.student_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  department TEXT NOT NULL,
  semester INTEGER NOT NULL DEFAULT 1,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '60 days'),
  consumed_at TIMESTAMPTZ,
  CONSTRAINT student_invitations_email_unique UNIQUE (email),
  CONSTRAINT student_invitations_roll_unique UNIQUE (roll_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_invitations TO authenticated;
GRANT ALL ON public.student_invitations TO service_role;

ALTER TABLE public.student_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers and admins create invitations" ON public.student_invitations;
CREATE POLICY "Teachers and admins create invitations"
ON public.student_invitations FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = invited_by
  AND (public.has_role(auth.uid(), 'teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

DROP POLICY IF EXISTS "Inviters view own invitations" ON public.student_invitations;
CREATE POLICY "Inviters view own invitations"
ON public.student_invitations FOR SELECT TO authenticated
USING (auth.uid() = invited_by OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Inviters delete own invitations" ON public.student_invitations;
CREATE POLICY "Inviters delete own invitations"
ON public.student_invitations FOR DELETE TO authenticated
USING (auth.uid() = invited_by OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 7. Update finalize_user_profile to consume matching invitation on signup
CREATE OR REPLACE FUNCTION public.finalize_user_profile(
  p_user_id uuid,
  p_email text,
  p_name text,
  p_roll_number text,
  p_department text DEFAULT 'Computer Science'::text,
  p_semester integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_invitation public.student_invitations%ROWTYPE;
  v_existing_by_roll public.profiles%ROWTYPE;
  v_department text;
  v_semester integer;
  v_name text;
  v_roll text;
  v_rows int;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED', 'message', 'Unauthorized profile operation.');
  END IF;

  v_department := COALESCE(NULLIF(TRIM(p_department), ''), 'Computer Science');
  v_semester := COALESCE(p_semester, 1);
  v_name := p_name;
  v_roll := p_roll_number;

  -- If a valid invitation exists for this email, prefer its values and consume it
  SELECT * INTO v_invitation
  FROM public.student_invitations
  WHERE lower(email) = lower(p_email)
    AND consumed_at IS NULL
    AND expires_at > now()
  LIMIT 1;

  IF FOUND THEN
    v_name := v_invitation.name;
    v_roll := v_invitation.roll_number;
    v_department := v_invitation.department;
    v_semester := v_invitation.semester;
  END IF;

  -- Upsert by user_id
  UPDATE public.profiles
  SET name = v_name, email = p_email, roll_number = v_roll,
      department = v_department, semester = v_semester, updated_at = now()
  WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    SELECT * INTO v_existing_by_roll FROM public.profiles WHERE roll_number = v_roll LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', false, 'code', 'ROLL_NUMBER_EXISTS',
        'message', 'This roll number is already registered.');
    END IF;
    INSERT INTO public.profiles (user_id, email, name, roll_number, department, semester)
    VALUES (p_user_id, p_email, v_name, v_roll, v_department, v_semester);
  END IF;

  IF v_invitation.id IS NOT NULL THEN
    UPDATE public.student_invitations SET consumed_at = now() WHERE id = v_invitation.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', 'created');
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_CONFLICT',
      'message', 'An account with this email or roll number already exists.');
END;
$function$;
