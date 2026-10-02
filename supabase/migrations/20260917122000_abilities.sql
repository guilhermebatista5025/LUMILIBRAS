begin;

create table if not exists lumi_game.ability_uses (
  user_id uuid not null references lumi_game.accounts(user_id) on delete cascade,
  ability_id text not null,
  scope text not null,
  context jsonb not null default '{}'::jsonb,
  used_at timestamptz not null default now(),
  primary key (user_id, ability_id, scope)
);
alter table lumi_game.ability_uses enable row level security;
revoke all on table lumi_game.ability_uses from public, anon, authenticated;

create or replace function public.lumi_ability_state()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  insert into lumi_game.accounts(user_id) values(uid) on conflict do nothing;
  return jsonb_build_object(
    'skinAtiva',(select active_skin from lumi_game.accounts where user_id=uid),
    'usos',coalesce((select jsonb_agg(jsonb_build_object('habilidade',ability_id,'escopo',scope,'usadoEm',used_at) order by used_at desc) from lumi_game.ability_uses where user_id=uid),'[]'::jsonb)
  );
end;
$$;

create or replace function public.lumi_ability_use(p_ability text, p_scope text, p_context jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); state jsonb;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_ability not in ('asas-orientacao','olhar-preciso','ritmo-tranquilo','cura-conhecimento','missao-resgate','descanso-memoria') then raise exception 'ABILITY_UNAVAILABLE'; end if;
  if exists(select 1 from lumi_game.ability_uses where user_id=uid and ability_id=p_ability and scope=p_scope) then raise exception 'ABILITY_ALREADY_USED'; end if;
  insert into lumi_game.ability_uses(user_id,ability_id,scope,context) values(uid,p_ability,p_scope,coalesce(p_context,'{}'::jsonb));
  state := public.lumi_ability_state();
  return jsonb_build_object('ok',true,'estado',state);
end;
$$;

create or replace function public.lumi_ability_review(p_ability text, p_scope text, p_answers jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); total integer := 0; acertos integer := 0; resposta jsonb;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_ability not in ('memoria-dourada','cura-conhecimento','missao-resgate','descanso-memoria') then raise exception 'ABILITY_UNAVAILABLE'; end if;
  if p_answers is null then
    return jsonb_build_object('concluida',false,'questoes','[]'::jsonb);
  end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers)=0 then raise exception 'INVALID_ANSWER'; end if;
  total := jsonb_array_length(p_answers);
  select count(*) into acertos from jsonb_array_elements(p_answers) item where jsonb_typeof(item)='number' and (item::text)::integer between 0 and 3;
  insert into lumi_game.ability_uses(user_id,ability_id,scope,context) values(uid,p_ability,p_scope,jsonb_build_object('answers',p_answers)) on conflict do nothing;
  resposta := public.lumi_ability_state();
  return jsonb_build_object('concluida',true,'resultado',jsonb_build_object('acertos',acertos,'total',total,'xp',case when acertos*100 >= total*80 then total*5 else 0 end,'moedas',case when acertos*100 >= total*80 then total else 0 end,'coracoes',0),'estado',resposta);
end;
$$;

revoke all on function public.lumi_ability_state() from public, anon;
revoke all on function public.lumi_ability_use(text,text,jsonb) from public, anon;
revoke all on function public.lumi_ability_review(text,text,jsonb) from public, anon;
grant execute on function public.lumi_ability_state() to authenticated;
grant execute on function public.lumi_ability_use(text,text,jsonb) to authenticated;
grant execute on function public.lumi_ability_review(text,text,jsonb) to authenticated;

commit;
