-- Create timetable table for weekly schedules
CREATE TABLE public.timetable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- Everyone can view timetable (it's schedule info)
CREATE POLICY "Anyone can view timetable"
ON public.timetable FOR SELECT
USING (true);

-- Only teachers/admins can manage timetable
CREATE POLICY "Teachers can manage their subject timetable"
ON public.timetable FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teacher_subjects ts
    WHERE ts.teacher_id = auth.uid() AND ts.subject_id = timetable.subject_id
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Teachers can update their subject timetable"
ON public.timetable FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM teacher_subjects ts
    WHERE ts.teacher_id = auth.uid() AND ts.subject_id = timetable.subject_id
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Teachers can delete their subject timetable"
ON public.timetable FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM teacher_subjects ts
    WHERE ts.teacher_id = auth.uid() AND ts.subject_id = timetable.subject_id
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create index for efficient queries
CREATE INDEX idx_timetable_day ON public.timetable(day_of_week);
CREATE INDEX idx_timetable_subject ON public.timetable(subject_id);