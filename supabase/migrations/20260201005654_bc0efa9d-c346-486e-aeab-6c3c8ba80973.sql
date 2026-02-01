-- Add unique constraint on roll_number to ensure each student has unique credentials
ALTER TABLE public.profiles ADD CONSTRAINT profiles_roll_number_unique UNIQUE (roll_number);

-- Add unique constraint on email as well for extra safety
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);