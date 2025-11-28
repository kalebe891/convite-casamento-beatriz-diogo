-- Drop the old check constraint on pending_users.papel
ALTER TABLE public.pending_users 
DROP CONSTRAINT IF EXISTS pending_users_papel_check;

-- Add a foreign key constraint to validate against role_profiles
-- First, add an index on role_profiles.role_key for better performance
CREATE INDEX IF NOT EXISTS idx_role_profiles_role_key ON public.role_profiles(role_key);

-- Add foreign key constraint to ensure papel references valid roles
ALTER TABLE public.pending_users
ADD CONSTRAINT pending_users_papel_fkey 
FOREIGN KEY (papel) 
REFERENCES public.role_profiles(role_key)
ON DELETE RESTRICT
ON UPDATE CASCADE;