-- Fix RLS policies for pending_users table to allow admin invites

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Admins can manage pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Permitir leitura pública via token válido" ON public.pending_users;

-- Allow admins full access to pending_users
CREATE POLICY "Admins can manage pending users"
ON public.pending_users
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow public read access only for valid tokens (for the invite acceptance flow)
CREATE POLICY "Public can read valid tokens"
ON public.pending_users
FOR SELECT
USING (
  token IS NOT NULL 
  AND usado = false 
  AND expires_at > now()
);

-- Allow service role (edge functions) full access to pending_users
CREATE POLICY "Service role can manage pending users"
ON public.pending_users
FOR ALL
USING (true)
WITH CHECK (true);

-- Ensure profiles table allows service role to insert new users
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Ensure user_roles table allows service role to insert roles
DROP POLICY IF EXISTS "Service role can insert roles" ON public.user_roles;
CREATE POLICY "Service role can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (true);