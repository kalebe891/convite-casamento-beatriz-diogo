-- Criar função para verificar permissões na tabela admin_permissions
-- Esta função será usada nas RLS policies para verificar permissões dinâmicas
CREATE OR REPLACE FUNCTION public.has_table_permission(
  _user_id uuid,
  _menu_key text,
  _permission_type text  -- 'view', 'add', 'edit', 'delete', 'publish'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Admins sempre têm todas as permissões
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
    ) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      JOIN public.user_roles ur ON ur.role = ap.role_key
      WHERE ur.user_id = _user_id
        AND ap.menu_key = _menu_key
        AND CASE _permission_type
          WHEN 'view' THEN ap.can_view
          WHEN 'add' THEN ap.can_add
          WHEN 'edit' THEN ap.can_edit
          WHEN 'delete' THEN ap.can_delete
          WHEN 'publish' THEN ap.can_publish
          ELSE false
        END = true
    )
  END;
$$;

-- Atualizar RLS policy da tabela guests para usar permissões dinâmicas
DROP POLICY IF EXISTS "Admins can manage guests" ON public.guests;

CREATE POLICY "Users with permissions can view guests"
ON public.guests
FOR SELECT
USING (public.has_table_permission(auth.uid(), 'convidados', 'view'));

CREATE POLICY "Users with permissions can insert guests"
ON public.guests
FOR INSERT
WITH CHECK (public.has_table_permission(auth.uid(), 'convidados', 'add'));

CREATE POLICY "Users with permissions can update guests"
ON public.guests
FOR UPDATE
USING (public.has_table_permission(auth.uid(), 'convidados', 'edit'));

CREATE POLICY "Users with permissions can delete guests"
ON public.guests
FOR DELETE
USING (public.has_table_permission(auth.uid(), 'convidados', 'delete'));

-- Atualizar RLS policy da tabela gift_items
DROP POLICY IF EXISTS "Authorized users can manage gift items" ON public.gift_items;

CREATE POLICY "Users with permissions can view gift_items"
ON public.gift_items
FOR SELECT
USING (is_public = true OR public.has_table_permission(auth.uid(), 'presentes', 'view'));

CREATE POLICY "Users with permissions can insert gift_items"
ON public.gift_items
FOR INSERT
WITH CHECK (public.has_table_permission(auth.uid(), 'presentes', 'add'));

CREATE POLICY "Users with permissions can update gift_items"
ON public.gift_items
FOR UPDATE
USING (public.has_table_permission(auth.uid(), 'presentes', 'edit'));

CREATE POLICY "Users with permissions can delete gift_items"
ON public.gift_items
FOR DELETE
USING (public.has_table_permission(auth.uid(), 'presentes', 'delete'));

-- Atualizar RLS policy da tabela timeline_events
DROP POLICY IF EXISTS "Authorized users can manage timeline events" ON public.timeline_events;

CREATE POLICY "Users with permissions can view timeline_events"
ON public.timeline_events
FOR SELECT
USING (is_public = true OR public.has_table_permission(auth.uid(), 'cronograma', 'view'));

CREATE POLICY "Users with permissions can insert timeline_events"
ON public.timeline_events
FOR INSERT
WITH CHECK (public.has_table_permission(auth.uid(), 'cronograma', 'add'));

CREATE POLICY "Users with permissions can update timeline_events"
ON public.timeline_events
FOR UPDATE
USING (public.has_table_permission(auth.uid(), 'cronograma', 'edit'));

CREATE POLICY "Users with permissions can delete timeline_events"
ON public.timeline_events
FOR DELETE
USING (public.has_table_permission(auth.uid(), 'cronograma', 'delete'));

-- Atualizar RLS policy da tabela buffet_items
DROP POLICY IF EXISTS "Authorized users can manage buffet items" ON public.buffet_items;

CREATE POLICY "Users with permissions can view buffet_items"
ON public.buffet_items
FOR SELECT
USING (is_public = true OR public.has_table_permission(auth.uid(), 'buffet', 'view'));

CREATE POLICY "Users with permissions can insert buffet_items"
ON public.buffet_items
FOR INSERT
WITH CHECK (public.has_table_permission(auth.uid(), 'buffet', 'add'));

CREATE POLICY "Users with permissions can update buffet_items"
ON public.buffet_items
FOR UPDATE
USING (public.has_table_permission(auth.uid(), 'buffet', 'edit'));

CREATE POLICY "Users with permissions can delete buffet_items"
ON public.buffet_items
FOR DELETE
USING (public.has_table_permission(auth.uid(), 'buffet', 'delete'));

-- Atualizar RLS policy da tabela playlist_songs
DROP POLICY IF EXISTS "Authorized users can manage playlist songs" ON public.playlist_songs;

CREATE POLICY "Users with permissions can view playlist_songs"
ON public.playlist_songs
FOR SELECT
USING (is_public = true OR public.has_table_permission(auth.uid(), 'playlist', 'view'));

CREATE POLICY "Users with permissions can insert playlist_songs"
ON public.playlist_songs
FOR INSERT
WITH CHECK (public.has_table_permission(auth.uid(), 'playlist', 'add'));

CREATE POLICY "Users with permissions can update playlist_songs"
ON public.playlist_songs
FOR UPDATE
USING (public.has_table_permission(auth.uid(), 'playlist', 'edit'));

CREATE POLICY "Users with permissions can delete playlist_songs"
ON public.playlist_songs
FOR DELETE
USING (public.has_table_permission(auth.uid(), 'playlist', 'delete'));

-- Atualizar RLS policy da tabela photos
DROP POLICY IF EXISTS "Authorized users can manage photos" ON public.photos;

CREATE POLICY "Users with permissions can view photos"
ON public.photos
FOR SELECT
USING (true);  -- Fotos são públicas para visualização

CREATE POLICY "Users with permissions can insert photos"
ON public.photos
FOR INSERT
WITH CHECK (public.has_table_permission(auth.uid(), 'momentos', 'add'));

CREATE POLICY "Users with permissions can update photos"
ON public.photos
FOR UPDATE
USING (public.has_table_permission(auth.uid(), 'momentos', 'edit'));

CREATE POLICY "Users with permissions can delete photos"
ON public.photos
FOR DELETE
USING (public.has_table_permission(auth.uid(), 'momentos', 'delete'));