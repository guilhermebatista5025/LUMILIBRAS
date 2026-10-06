begin;

grant insert on table public.profiles to authenticated;

drop policy if exists "Usuário cria o próprio perfil" on public.profiles;
create policy "Usuário cria o próprio perfil"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

commit;
