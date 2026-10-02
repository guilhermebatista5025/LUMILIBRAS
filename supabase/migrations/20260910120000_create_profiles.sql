-- Perfil mínimo da LumiLibras. E-mail e credencial permanecem no Supabase Auth.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (
    char_length(display_name) = 0
    or char_length(display_name) between 2 and 80
  ),
  terms_accepted_at timestamptz,
  terms_version text,
  privacy_acknowledged_at timestamptz,
  privacy_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

create policy "Usuário visualiza o próprio perfil"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Usuário atualiza o próprio perfil"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  accepted_terms boolean := coalesce(
    new.raw_user_meta_data -> 'accepted_terms' = 'true'::jsonb,
    false
  );
  acknowledged_privacy boolean := coalesce(
    new.raw_user_meta_data -> 'privacy_acknowledged' = 'true'::jsonb,
    false
  );
begin
  insert into public.profiles (
    id,
    display_name,
    terms_accepted_at,
    terms_version,
    privacy_acknowledged_at,
    privacy_version
  )
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80),
    case when accepted_terms then now() else null end,
    case when accepted_terms then '2026-09-10-v1' else null end,
    case when acknowledged_privacy then now() else null end,
    case when acknowledged_privacy then '2026-09-10-v1' else null end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();
