begin;

create table if not exists public.lumi_social_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  region text,
  notifications_enabled boolean not null default false,
  study_time time not null default '19:00',
  streak_reminders boolean not null default true,
  new_friends boolean not null default true,
  gifts boolean not null default true,
  friend_achievements boolean not null default false,
  app_updates boolean not null default true,
  store_offers boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint lumi_social_region_check check (region is null or region in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))
);

create table if not exists public.lumi_friend_requests (
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table public.lumi_social_settings enable row level security;
alter table public.lumi_friend_requests enable row level security;
revoke all on table public.lumi_social_settings from public, anon;
revoke all on table public.lumi_friend_requests from public, anon;
grant select, insert, update on table public.lumi_social_settings to authenticated;

drop policy if exists lumi_social_settings_own on public.lumi_social_settings;
create policy lumi_social_settings_own on public.lumi_social_settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.lumi_find_friends(p_query text default '')
returns table(id uuid, nome text, relationship text, xp integer, dias integer)
language sql security definer set search_path = '' as $$
  select p.id, coalesce(nullif(p.display_name,''),'Estudante'),
    case when exists(select 1 from public.lumi_friend_requests f where f.status='accepted' and ((f.requester_id=auth.uid() and f.addressee_id=p.id) or (f.addressee_id=auth.uid() and f.requester_id=p.id))) then 'friend'
      when exists(select 1 from public.lumi_friend_requests f where f.status='pending' and f.requester_id=auth.uid() and f.addressee_id=p.id) then 'sent'
      when exists(select 1 from public.lumi_friend_requests f where f.status='pending' and f.requester_id=p.id and f.addressee_id=auth.uid()) then 'received'
      else 'none' end,
    coalesce(a.xp,0), coalesce(a.streak,0)
  from public.profiles p left join lumi_game.accounts a on a.user_id=p.id
  where p.id <> auth.uid() and (coalesce(p.display_name,'') ilike '%' || coalesce(nullif(trim(p_query),''),'') || '%')
  order by coalesce(a.xp,0) desc, p.display_name asc limit 30;
$$;

create or replace function public.lumi_friend_action(p_user uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_user is null or p_user = uid or p_action not in ('request','accept','remove') then raise exception 'INVALID_FRIEND_ACTION'; end if;
  if not exists(select 1 from auth.users where id=p_user) then raise exception 'REQUEST_NOT_FOUND'; end if;
  if p_action='request' then
    insert into public.lumi_friend_requests(requester_id,addressee_id) values(uid,p_user)
      on conflict (requester_id,addressee_id) do update set status='pending',updated_at=now();
  elsif p_action='accept' then
    update public.lumi_friend_requests set status='accepted',updated_at=now() where requester_id=p_user and addressee_id=uid and status='pending';
    if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  else
    delete from public.lumi_friend_requests where (requester_id=uid and addressee_id=p_user) or (requester_id=p_user and addressee_id=uid);
  end if;
  return jsonb_build_object('ok',true);
end;
$$;

revoke all on function public.lumi_find_friends(text) from public, anon;
revoke all on function public.lumi_friend_action(uuid,text) from public, anon;
grant execute on function public.lumi_find_friends(text) to authenticated;
grant execute on function public.lumi_friend_action(uuid,text) to authenticated;

commit;
