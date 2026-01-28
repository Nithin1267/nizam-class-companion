-- Create a function to automatically assign roles on signup via a trigger
-- This uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  default_role app_role := 'student';
BEGIN
  -- Check if user signed up via teacher portal (metadata flag)
  IF NEW.raw_user_meta_data->>'signup_as_teacher' = 'true' THEN
    default_role := 'teacher';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Add RLS policy for admins to manage user roles
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Allow admins to manage profiles
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Allow admins to manage teacher_subjects
CREATE POLICY "Teachers can insert their own subject assignments"
  ON public.teacher_subjects FOR INSERT
  WITH CHECK (auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can delete their own subject assignments"
  ON public.teacher_subjects FOR DELETE
  USING (auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'));