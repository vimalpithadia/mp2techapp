-- Add new columns to attendance table
ALTER TABLE public.attendance 
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(user_id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
