-- Create profiles table for student information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  roll_number TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  semester INTEGER NOT NULL DEFAULT 1,
  email TEXT NOT NULL,
  notification_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('theory', 'lab')),
  department TEXT NOT NULL,
  semester INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject_id, date)
);

-- Create attendance summary table (for quick lookups)
CREATE TABLE public.attendance_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  total_classes INTEGER NOT NULL DEFAULT 0,
  attended_classes INTEGER NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  last_alert_sent_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warning', 'critical', 'info')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subjects policies (readable by all authenticated users)
CREATE POLICY "Anyone can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);

-- Attendance records policies
CREATE POLICY "Users can view their own attendance" ON public.attendance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance" ON public.attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Attendance summary policies
CREATE POLICY "Users can view their own summary" ON public.attendance_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summary" ON public.attendance_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summary" ON public.attendance_summary
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update attendance percentage
CREATE OR REPLACE FUNCTION public.calculate_attendance_percentage()
RETURNS TRIGGER AS $$
BEGIN
  NEW.percentage := CASE 
    WHEN NEW.total_classes > 0 THEN ROUND((NEW.attended_classes::DECIMAL / NEW.total_classes) * 100, 2)
    ELSE 0
  END;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-calculate percentage
CREATE TRIGGER update_attendance_percentage
  BEFORE INSERT OR UPDATE ON public.attendance_summary
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_attendance_percentage();

-- Function to update profiles timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample subjects for Computer Science
INSERT INTO public.subjects (name, code, type, department, semester) VALUES
  ('Data Structures', 'CS301', 'theory', 'Computer Science', 4),
  ('Data Structures Lab', 'CS301L', 'lab', 'Computer Science', 4),
  ('Database Management', 'CS302', 'theory', 'Computer Science', 4),
  ('Database Lab', 'CS302L', 'lab', 'Computer Science', 4),
  ('Operating Systems', 'CS303', 'theory', 'Computer Science', 4),
  ('Operating Systems Lab', 'CS303L', 'lab', 'Computer Science', 4),
  ('Computer Networks', 'CS304', 'theory', 'Computer Science', 4),
  ('Software Engineering', 'CS305', 'theory', 'Computer Science', 4);