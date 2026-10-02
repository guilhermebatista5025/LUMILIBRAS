begin;

insert into lumi_game.store_items (id,title,description,kind,currency,price,sort_order) values
  ('mico-leao','Nino','O mico-leão-dourado que aprende com você.','skin','moedas',200,7),
  ('historiador','Nino Historiador','Explore histórias e descobertas com o Nino.','skin','moedas',300,8),
  ('enfermeira-arara','Lumi Enfermeira','A arara cuidadosa para sua jornada.','skin','diamantes',100,9),
  ('bombeira','Kira Bombeira','A onça corajosa para cada novo desafio.','skin','diamantes',100,10)
on conflict (id) do update set title=excluded.title,description=excluded.description,kind=excluded.kind,currency=excluded.currency,price=excluded.price,sort_order=excluded.sort_order;

create or replace function public.lumi_store_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); account lumi_game.accounts%rowtype;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  insert into lumi_game.accounts(user_id) values (uid) on conflict do nothing;
  select * into account from lumi_game.accounts where user_id = uid;
  return jsonb_build_object('diamantes',account.diamonds,'moedas',account.coins,'coracoes',account.hearts,'maxCoracoes',5,
    'skinAtiva',account.active_skin,'boosts',account.boost_charges,
    'skins',coalesce((select jsonb_agg(item_id order by item_id) from lumi_game.store_purchases p join lumi_game.store_items i on i.id=p.item_id where p.user_id=uid and i.kind='skin'),'[]'::jsonb),
    'itens',coalesce((select jsonb_agg(jsonb_build_object('id',id,'titulo',title,'descricao',description,'tipo',kind,'moeda',currency,'preco',price) order by sort_order) from lumi_game.store_items),'[]'::jsonb));
end;
$$;

create or replace function public.lumi_store_equip(p_skin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_skin <> 'classica' and not exists(select 1 from lumi_game.store_purchases p join lumi_game.store_items i on i.id=p.item_id where p.user_id=uid and p.item_id=p_skin and i.kind='skin') then raise exception 'SKIN_NOT_OWNED'; end if;
  update lumi_game.accounts set active_skin=p_skin,revision=revision+1 where user_id=uid;
  return public.lumi_store_state();
end;
$$;

commit;
