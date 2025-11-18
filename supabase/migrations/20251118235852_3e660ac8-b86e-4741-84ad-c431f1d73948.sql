-- Primeiro, limpar duplicados mantendo apenas o registro mais recente de cada email
DELETE FROM public.pending_users
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id
  FROM public.pending_users
  ORDER BY email, created_at DESC
);

-- Remover a constraint de PK antiga
ALTER TABLE public.pending_users DROP CONSTRAINT IF EXISTS pending_users_pkey;
ALTER TABLE public.pending_users DROP CONSTRAINT IF EXISTS pending_users_token_key;

-- Adicionar email como PK
ALTER TABLE public.pending_users ADD PRIMARY KEY (email);

-- Manter o token como único
ALTER TABLE public.pending_users ADD CONSTRAINT pending_users_token_key UNIQUE (token);