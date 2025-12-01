-- Add invitation_message column to wedding_details for WhatsApp/Email invitations
ALTER TABLE public.wedding_details 
ADD COLUMN IF NOT EXISTS invitation_message text;