-- Create guests table
CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create rsvp_tokens table
CREATE TABLE public.rsvp_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guests
CREATE POLICY "Admins can manage guests"
  ON public.guests
  FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

-- RLS Policies for rsvp_tokens
CREATE POLICY "Admins can manage tokens"
  ON public.rsvp_tokens
  FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'couple') OR has_role(auth.uid(), 'planner'));

CREATE POLICY "Anyone can read valid tokens"
  ON public.rsvp_tokens
  FOR SELECT
  USING (NOT used AND expires_at > now());

-- Create indexes
CREATE INDEX idx_rsvp_tokens_token ON public.rsvp_tokens(token);
CREATE INDEX idx_rsvp_tokens_guest_id ON public.rsvp_tokens(guest_id);
CREATE INDEX idx_guests_status ON public.guests(status);