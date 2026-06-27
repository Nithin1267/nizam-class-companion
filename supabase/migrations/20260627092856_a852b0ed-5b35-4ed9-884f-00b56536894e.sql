
CREATE TABLE public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  semester INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, department, semester)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage teacher assignments"
  ON public.teacher_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers view own assignments"
  ON public.teacher_assignments FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE INDEX idx_teacher_assignments_teacher ON public.teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_dept_sem ON public.teacher_assignments(department, semester);

-- Helper: teacher assigned to the student's (dept, semester)
CREATE OR REPLACE FUNCTION public.teacher_assigned_to_student(_teacher_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.teacher_assignments ta
      ON ta.department = p.department AND ta.semester = p.semester
    WHERE p.user_id = _student_id
      AND ta.teacher_id = _teacher_id
  );
$$;

-- Extend profile visibility for teachers via assignments
DROP POLICY IF EXISTS "View profiles: own, admins, teachers' own students" ON public.profiles;
CREATE POLICY "View profiles: own, admins, teachers' own students"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'teacher')
      AND (
        public.teacher_teaches_student(auth.uid(), user_id)
        OR public.teacher_assigned_to_student(auth.uid(), user_id)
      )
    )
  );
