-- Create pending_users table for invitation flow
create table public.pending_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nome text,
  papel text not null check (papel in ('admin', 'couple', 'planner')),
  token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null default now() + interval '48 hours',
  usado boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.pending_users enable row level security;

-- Policy: only admins can manage pending users
create policy "Admins can manage pending users"
on public.pending_users
for all
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));