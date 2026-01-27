-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers and admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Add teacher_id column to subjects table
ALTER TABLE public.subjects ADD COLUMN teacher_id UUID REFERENCES auth.users(id);

-- Create teacher_subjects junction table for teachers assigned to subjects
CREATE TABLE public.teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, subject_id)
);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their assigned subjects"
ON public.teacher_subjects FOR SELECT
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage teacher subjects"
ON public.teacher_subjects FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update subjects policies to allow teachers to manage their subjects
CREATE POLICY "Teachers can insert subjects"
ON public.subjects FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update their subjects"
ON public.subjects FOR UPDATE
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can delete their subjects"
ON public.subjects FOR DELETE
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Update attendance_records policies for teachers
CREATE POLICY "Teachers can insert attendance for their subjects"
ON public.attendance_records FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teacher_subjects ts
    WHERE ts.teacher_id = auth.uid()
    AND ts.subject_id = attendance_records.subject_id
  ) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Teachers can view attendance for their subjects"
ON public.attendance_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_subjects ts
    WHERE ts.teacher_id = auth.uid()
    AND ts.subject_id = attendance_records.subject_id
  ) OR public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id
);

CREATE POLICY "Teachers can update attendance for their subjects"
ON public.attendance_records FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_subjects ts
    WHERE ts.teacher_id = auth.uid()
    AND ts.subject_id = attendance_records.subject_id
  ) OR public.has_role(auth.uid(), 'admin')
);

-- Allow teachers to view student profiles for their subjects
CREATE POLICY "Teachers can view student profiles"
ON public.profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin') OR 
  auth.uid() = user_id
);

-- Allow teachers to view attendance summaries for their subjects
CREATE POLICY "Teachers can view attendance summaries for their subjects"
ON public.attendance_summary FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_subjects ts
    WHERE ts.teacher_id = auth.uid()
    AND ts.subject_id = attendance_summary.subject_id
  ) OR public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id
);

-- Create manual_alerts table to track sent alerts
CREATE TABLE public.manual_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can insert alerts"
ON public.manual_alerts FOR INSERT
WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can view their sent alerts"
ON public.manual_alerts FOR SELECT
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));