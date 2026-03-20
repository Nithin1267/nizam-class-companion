
-- Create the trigger that was missing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Fix existing user: assign student role to mrnithin120@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('dfd442f0-a7aa-4fa6-9cc5-2dd2fc25923a', 'student')
ON CONFLICT (user_id, role) DO NOTHING;
