-- Drop the old has_role function with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;

-- Create new has_role function with text parameter
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
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

-- Recreate all RLS policies that were dropped

-- user_roles table
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- wedding_details table
CREATE POLICY "Admins and couples can manage wedding details" ON public.wedding_details
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- events table
CREATE POLICY "Authorized users can manage events" ON public.events
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- photos table
CREATE POLICY "Authorized users can manage photos" ON public.photos
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- rsvps table
CREATE POLICY "Authorized users can view RSVPs" ON public.rsvps
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- storage.objects table (wedding photos bucket)
CREATE POLICY "Authorized users can upload wedding photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'wedding-photos' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'))
  );

CREATE POLICY "Authorized users can delete wedding photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'wedding-photos' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'))
  );

-- invitations table
CREATE POLICY "Authorized users can manage invitations" ON public.invitations
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- profiles table
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- pending_users table
CREATE POLICY "Admins can manage pending users" ON public.pending_users
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- guests table
CREATE POLICY "Admins can manage guests" ON public.guests
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- rsvp_tokens table
CREATE POLICY "Admins can manage tokens" ON public.rsvp_tokens
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- timeline_events table
CREATE POLICY "Authorized users can manage timeline events" ON public.timeline_events
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- buffet_items table
CREATE POLICY "Authorized users can manage buffet items" ON public.buffet_items
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- playlist_songs table
CREATE POLICY "Authorized users can manage playlist songs" ON public.playlist_songs
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- checkin_logs table
CREATE POLICY "Authorized users can view checkin logs" ON public.checkin_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner') OR has_role(auth.uid(), 'cerimonial'));

CREATE POLICY "Admins can delete checkin logs" ON public.checkin_logs
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- gift_items table
CREATE POLICY "Authorized users can manage gift items" ON public.gift_items
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- admin_logs table
CREATE POLICY "Admins can view all logs" ON public.admin_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authorized users can view their own logs" ON public.admin_logs
  FOR SELECT USING (
    (has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner') OR has_role(auth.uid(), 'cerimonial'))
    AND user_id = auth.uid()
    AND table_name <> 'user_roles'
  );

-- role_profiles table
CREATE POLICY "Admins can manage role profiles" ON public.role_profiles
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- admin_permissions table
CREATE POLICY "Admins can manage all permissions" ON public.admin_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));