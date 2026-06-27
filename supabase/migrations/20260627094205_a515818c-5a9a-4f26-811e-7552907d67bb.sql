
ALTER TABLE public.teacher_assignments ADD COLUMN IF NOT EXISTS section text;

DROP INDEX IF EXISTS public.idx_teacher_assignments_dept_sem;
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_dept_sem_section
  ON public.teacher_assignments (department, semester, section);

CREATE OR REPLACE FUNCTION public.teacher_assigned_to_student(_teacher_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.teacher_assignments ta
      ON ta.department = p.department
     AND ta.semester = p.semester
     AND (ta.section IS NULL OR ta.section = '' OR ta.section = p.section)
    WHERE p.user_id = _student_id
      AND ta.teacher_id = _teacher_id
  );
$$;
