-- Fotos privadas: arquivo e metadados no Supabase Storage.
-- Pode ser reaplicado; preserva as fotos já enviadas.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lumilibras-avatars', 'lumilibras-avatars', false, 2097152, array['image/png'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/png'];

drop policy if exists "lumi_avatar_read_own" on storage.objects;
create policy "lumi_avatar_read_own" on storage.objects
for select to authenticated
using (bucket_id = 'lumilibras-avatars' and name = (select auth.uid())::text || '/avatar.png');

drop policy if exists "lumi_avatar_insert_own" on storage.objects;
create policy "lumi_avatar_insert_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'lumilibras-avatars' and name = (select auth.uid())::text || '/avatar.png');

drop policy if exists "lumi_avatar_update_own" on storage.objects;
create policy "lumi_avatar_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'lumilibras-avatars' and name = (select auth.uid())::text || '/avatar.png')
with check (bucket_id = 'lumilibras-avatars' and name = (select auth.uid())::text || '/avatar.png');

commit;
