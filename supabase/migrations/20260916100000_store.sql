begin;

alter table lumi_game.accounts
  add column coins integer not null default 0 check (coins >= 0),
  add column active_skin text not null default 'classica',
  add column boost_charges integer not null default 0 check (boost_charges >= 0);

create table lumi_game.store_items (
  id text primary key,
  title text not null,
  description text not null,
  kind text not null check (kind in ('skin', 'boost', 'hearts')),
  currency text not null check (currency in ('diamantes', 'moedas')),
  price integer not null check (price > 0),
  sort_order integer not null
);

insert into lumi_game.store_items (id, title, description, kind, currency, price, sort_order) values
  ('recarga-diamantes', 'Corações cheios', 'Recupere todos os corações agora.', 'hearts', 'diamantes', 20, 1),
  ('recarga-moedas', 'Corações cheios', 'Recupere todos os corações agora.', 'hearts', 'moedas', 80, 2),
  ('xp-diamantes', 'Dobro de XP', 'A próxima recompensa em XP será dobrada.', 'boost', 'diamantes', 45, 3),
  ('xp-moedas', 'Dobro de XP', 'A próxima recompensa em XP será dobrada.', 'boost', 'moedas', 140, 4),
  ('aurora', 'Lumi Aurora', 'Um novo visual violeta para a Lumi.', 'skin', 'moedas', 250, 5),
  ('dourada', 'Lumi Dourada', 'Um brilho dourado para acompanhar sua jornada.', 'skin', 'diamantes', 100, 6);

create table lumi_game.store_purchases (
  user_id uuid not null references lumi_game.accounts(user_id) on delete cascade,
  event_id uuid not null,
  item_id text not null references lumi_game.store_items(id),
  purchased_at timestamptz not null default now(),
  response jsonb not null,
  primary key (user_id, event_id)
);

alter table lumi_game.store_items enable row level security;
alter table lumi_game.store_purchases enable row level security;

-- Uma visita diária rende moedas uma única vez (visits já tem chave user_id, day).
create function lumi_game.award_daily_coins() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update lumi_game.accounts set coins = coins + 10 where user_id = new.user_id;
  return new;
end;
$$;
create trigger award_daily_coins after insert on lumi_game.visits
for each row execute function lumi_game.award_daily_coins();

-- Aplica o bônus somente à primeira atualização de XP; evita recursão do próprio trigger.
create function lumi_game.apply_xp_boost() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if pg_trigger_depth() = 1 and old.boost_charges > 0 and new.xp > old.xp then
    update lumi_game.accounts
       set xp = xp + (new.xp - old.xp), boost_charges = boost_charges - 1, revision = revision + 1
     where user_id = new.user_id;
  end if;
  return new;
end;
$$;
create trigger apply_xp_boost after update of xp on lumi_game.accounts
for each row execute function lumi_game.apply_xp_boost();

create function public.lumi_store_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); account lumi_game.accounts%rowtype;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  insert into lumi_game.accounts(user_id) values (uid) on conflict do nothing;
  select * into account from lumi_game.accounts where user_id = uid;
  return jsonb_build_object(
    'diamantes', account.diamonds, 'moedas', account.coins,
    'coracoes', account.hearts, 'maxCoracoes', 5,
    'skinAtiva', account.active_skin, 'boosts', account.boost_charges,
    'skins', coalesce((select jsonb_agg(distinct item_id) from lumi_game.store_purchases
      where user_id = uid and item_id in ('aurora', 'dourada')), '[]'::jsonb),
    'itens', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'titulo', title, 'descricao', description, 'tipo', kind,
      'moeda', currency, 'preco', price) order by sort_order)
      from lumi_game.store_items), '[]'::jsonb)
  );
end;
$$;

create function public.lumi_store_buy(p_item text, p_event uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); account lumi_game.accounts%rowtype;
  item lumi_game.store_items%rowtype; previous lumi_game.store_purchases%rowtype;
  recovered integer; result_json jsonb;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_event is null then raise exception 'EVENT_REQUIRED'; end if;
  insert into lumi_game.accounts(user_id) values (uid) on conflict do nothing;
  select * into account from lumi_game.accounts where user_id = uid for update;
  select * into previous from lumi_game.store_purchases where user_id = uid and event_id = p_event;
  if found then
    if previous.item_id <> p_item then raise exception 'EVENT_CONFLICT'; end if;
    return previous.response;
  end if;
  select * into item from lumi_game.store_items where id = p_item;
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;
  if item.kind = 'skin' and exists(select 1 from lumi_game.store_purchases
    where user_id = uid and item_id = p_item) then raise exception 'ALREADY_OWNED'; end if;
  if item.kind = 'hearts' then
    if account.hearts < 5 then
      recovered := greatest(0, floor(extract(epoch from now() - account.hearts_at) / 1800)::integer);
      if recovered > 0 then
        account.hearts := least(5, account.hearts + recovered);
        account.hearts_at := case when account.hearts = 5 then now()
          else account.hearts_at + recovered * interval '30 minutes' end;
      end if;
    end if;
    if account.hearts = 5 then raise exception 'HEARTS_FULL'; end if;
  end if;
  if item.currency = 'diamantes' and account.diamonds < item.price then raise exception 'INSUFFICIENT_FUNDS'; end if;
  if item.currency = 'moedas' and account.coins < item.price then raise exception 'INSUFFICIENT_FUNDS'; end if;
  update lumi_game.accounts set
    diamonds = diamonds - case when item.currency = 'diamantes' then item.price else 0 end,
    coins = coins - case when item.currency = 'moedas' then item.price else 0 end,
    hearts = case when item.kind = 'hearts' then 5 else account.hearts end,
    hearts_at = case when item.kind = 'hearts' then now() else account.hearts_at end,
    active_skin = case when item.kind = 'skin' then item.id else active_skin end,
    boost_charges = boost_charges + case when item.kind = 'boost' then 1 else 0 end,
    revision = revision + 1 where user_id = uid;
  insert into lumi_game.store_purchases(user_id, event_id, item_id, response)
    values (uid, p_event, p_item, '{}'::jsonb);
  result_json := public.lumi_store_state() || jsonb_build_object('mensagem',
    case when item.kind = 'skin' then 'Skin equipada!'
      when item.kind = 'boost' then 'Boost ativado para sua próxima recompensa!'
      else 'Corações recuperados!' end);
  update lumi_game.store_purchases set response = result_json
    where user_id = uid and event_id = p_event;
  return result_json;
end;
$$;

create function public.lumi_store_equip(p_skin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_skin <> 'classica' and not exists(select 1 from lumi_game.store_purchases
    where user_id = uid and item_id = p_skin and p_skin in ('aurora', 'dourada')) then
    raise exception 'SKIN_NOT_OWNED';
  end if;
  update lumi_game.accounts set active_skin = p_skin, revision = revision + 1 where user_id = uid;
  return public.lumi_store_state();
end;
$$;

revoke all on function public.lumi_store_state() from public, anon;
revoke all on function public.lumi_store_buy(text, uuid) from public, anon;
revoke all on function public.lumi_store_equip(text) from public, anon;
grant execute on function public.lumi_store_state() to authenticated;
grant execute on function public.lumi_store_buy(text, uuid) to authenticated;
grant execute on function public.lumi_store_equip(text) to authenticated;

commit;
