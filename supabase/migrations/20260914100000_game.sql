begin;

create schema if not exists lumi_game;
revoke all on schema lumi_game from public, anon, authenticated;

create table lumi_game.accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  diamonds integer not null default 0 check (diamonds >= 0),
  hearts integer not null default 5 check (hearts between 0 and 5),
  hearts_at timestamptz not null default now(),
  login_days integer not null default 0,
  streak integer not null default 0,
  longest_streak integer not null default 0,
  last_login date,
  revision bigint not null default 0
);
create table lumi_game.visits (
  user_id uuid not null references lumi_game.accounts(user_id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);
create table lumi_game.phases (
  id text primary key,
  previous_id text references lumi_game.phases(id),
  kind text not null check (kind in ('estudo', 'avaliacao')),
  study_ids jsonb not null default '[]',
  pair_ids jsonb not null default '[]',
  answers jsonb not null default '[]',
  xp integer not null check (xp >= 0),
  diamonds integer not null default 5 check 
);
create table lumi_game.progress (
  user_id uuid not null references lumi_game.accounts(user_id) on delete cascade,
  phase_id text not null references lumi_game.phases(id),
  completed_at timestamptz,
  xp integer not null default 0,
  draft jsonb not null default '{"passo":0,"respostas":[],"pares":[]}',
  result jsonb,
  primary key(user_id, phase_id)
);
create table lumi_game.events (
  user_id uuid not null references lumi_game.accounts(user_id) on delete cascade,
  event_id uuid not null,
  action text not null,
  phase_id text,
  payload jsonb not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key(user_id, event_id)
);
create table lumi_game.achievements (
  id text primary key,
  title text not null,
  active boolean not null default false,
  metric text check(metric in ('xp','login_days','streak','phases','perfect')),
  target integer check(target > 0),
  xp integer not null default 0 check(xp >= 0),
  diamonds integer not null default 0 check(diamonds >= 0),
  check(not active or (metric is not null and target is not null))
);
create table lumi_game.user_achievements (
  user_id uuid not null references lumi_game.accounts(user_id) on delete cascade,
  achievement_id text not null references lumi_game.achievements(id),
  unlocked_at timestamptz not null default now(),
  primary key(user_id, achievement_id)
);

-- Nenhum critério ou prêmio de conquista foi ativado: aguarda definição do produto.
insert into lumi_game.achievements(id,title) values
 ('chama','Chama Viva'),('bibliotecario','Bibliotecário'),('estrela','Estrela Guia'),
 ('social','Socializador'),('interprete','Intérprete'),('veloz','Veloz'),
 ('foco','Foco Total'),('segredo','Segredo de Lumi');

alter table lumi_game.accounts enable row level security;
alter table lumi_game.visits enable row level security;
alter table lumi_game.progress enable row level security;
alter table lumi_game.events enable row level security;
alter table lumi_game.phases enable row level security;
alter table lumi_game.achievements enable row level security;
alter table lumi_game.user_achievements enable row level security;

create function lumi_game.metric_value(p_user uuid, p_metric text) returns integer
language sql stable set search_path = '' as $$
 select case p_metric
   when 'xp' then a.xp when 'login_days' then a.login_days when 'streak' then a.streak
   when 'phases' then (select count(*)::integer from lumi_game.progress p where p.user_id=p_user and p.completed_at is not null)
   when 'perfect' then (select count(*)::integer from lumi_game.progress p where p.user_id=p_user and p.completed_at is not null and (p.result->>'percentual')::integer=100)
   else 0 end from lumi_game.accounts a where a.user_id=p_user;
$$;

create function lumi_game.snapshot(p_user uuid) returns jsonb
language sql stable set search_path = '' as $$
 select jsonb_build_object(
   'versao', a.revision,
   'estatisticas', jsonb_build_object('xp',a.xp,'diamantes',a.diamonds,'coracoes',a.hearts,'maxCoracoes',5,
     'proximoCoracaoEm',case when a.hearts<5 then a.hearts_at+interval '30 minutes' else null end,
     'diasLogados',a.login_days,'sequencia',a.streak,'maiorSequencia',a.longest_streak,'nivel',1+a.xp/100,
     'fasesConcluidas',(select count(*) from lumi_game.progress p where p.user_id=p_user and p.completed_at is not null),
     'fasesHoje',(select count(*) from lumi_game.progress p where p.user_id=p_user and (p.completed_at at time zone 'America/Sao_Paulo')::date=(now() at time zone 'America/Sao_Paulo')::date),
     'xpHoje',coalesce((select sum(p.xp) from lumi_game.progress p where p.user_id=p_user and (p.completed_at at time zone 'America/Sao_Paulo')::date=(now() at time zone 'America/Sao_Paulo')::date),0),
     'acessosRecentes',(select coalesce(jsonb_agg(v.day order by v.day),'[]') from lumi_game.visits v where v.user_id=p_user and v.day>=(now() at time zone 'America/Sao_Paulo')::date-6)),
   'aprendizado',coalesce((select jsonb_object_agg(p.phase_id,jsonb_build_object('concluida',p.completed_at is not null,'xp',p.xp,'rascunho',p.draft,'resultado',p.result)) from lumi_game.progress p where p.user_id=p_user),'{}'),
   'conquistas',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'nome',d.title,'ativa',d.active,'atual',case when d.active then least(d.target,lumi_game.metric_value(p_user,d.metric)) else 0 end,'total',coalesce(d.target,1),'xp',d.xp,'diamantes',d.diamonds,'desbloqueada',u.unlocked_at is not null,'desbloqueadaEm',u.unlocked_at)) from lumi_game.achievements d left join lumi_game.user_achievements u on u.achievement_id=d.id and u.user_id=p_user),'[]'),
   'ranking',coalesce((select jsonb_agg(to_jsonb(r)) from (select s.user_id as id,coalesce(p.display_name,'Estudante') as nome,s.xp,s.streak as dias,s.user_id=p_user as voce,rank() over(order by s.xp desc) as posicao from lumi_game.accounts s left join public.profiles p on p.id=s.user_id where s.xp>0 order by s.xp desc,s.user_id limit 10) r),'[]'),
   'posicao',case when a.xp>0 then 1+(select count(*) from lumi_game.accounts s where s.xp>a.xp) else null end,
   'participantes',(select count(*) from lumi_game.accounts where xp>0)
 ) from lumi_game.accounts a where a.user_id=p_user;
$$;

create function public.lumi_game_action(p_action text, p_phase text default null, p_payload jsonb default '{}', p_event uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare
 uid uuid := auth.uid(); today date := (now() at time zone 'America/Sao_Paulo')::date;
 account lumi_game.accounts%rowtype; phase lumi_game.phases%rowtype; progress lumi_game.progress%rowtype;
 previous_event lumi_game.events%rowtype; achievement lumi_game.achievements%rowtype;
 response jsonb; result jsonb; draft jsonb; answers jsonb; pairs jsonb;
 step integer; answer integer; correct integer; total integer; recovered integer; affected integer;
 complete boolean := false; awarded_xp integer := 0; awarded_diamonds integer := 0;
begin
 if uid is null then raise exception 'UNAUTHENTICATED'; end if;
 if p_action not in ('visit','sync','start','study','pair','answer','retry') then raise exception 'INVALID_ACTION'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'INVALID_PAYLOAD'; end if;
 if p_action not in ('visit','sync') and p_event is null then raise exception 'EVENT_REQUIRED'; end if;
 insert into lumi_game.accounts(user_id) values(uid) on conflict do nothing;
 select * into account from lumi_game.accounts where user_id=uid for update;
 if p_event is not null then
   select * into previous_event from lumi_game.events where user_id=uid and event_id=p_event;
   if found then
     if previous_event.action<>p_action or previous_event.phase_id is distinct from p_phase or previous_event.payload<>p_payload then raise exception 'EVENT_CONFLICT'; end if;
     return previous_event.response;
   end if;
 end if;
 if account.hearts<5 then
   recovered := greatest(0,floor(extract(epoch from now()-account.hearts_at)/1800)::integer);
   if recovered>0 then
     account.hearts := least(5,account.hearts+recovered);
     account.hearts_at := case when account.hearts=5 then now() else account.hearts_at+recovered*interval '30 minutes' end;
   end if;
 end if;
 if p_action='visit' then
   insert into lumi_game.visits(user_id,day) values(uid,today) on conflict do nothing;
   get diagnostics affected = row_count;
   if affected=1 then
     account.login_days := account.login_days+1;
     account.streak := case when account.last_login=today-1 then account.streak+1 else 1 end;
     account.longest_streak := greatest(account.longest_streak,account.streak);
     account.last_login := today;
   end if;
 end if;
 if p_action not in ('visit','sync') then
   select * into phase from lumi_game.phases where id=p_phase;
   if not found then raise exception 'PHASE_NOT_FOUND'; end if;
   if phase.previous_id is not null and not exists(select 1 from lumi_game.progress where user_id=uid and phase_id=phase.previous_id and completed_at is not null) then raise exception 'PHASE_LOCKED'; end if;
   insert into lumi_game.progress(user_id,phase_id) values(uid,p_phase) on conflict do nothing;
   select * into progress from lumi_game.progress where user_id=uid and phase_id=p_phase;
   draft := progress.draft; step := coalesce((draft->>'passo')::integer,0);
   answers := coalesce(draft->'respostas','[]'); pairs := coalesce(draft->'pares','[]');
   if p_action='retry' or (p_action='start' and (draft->>'finalizado')::boolean is true) then
     draft := '{"passo":0,"respostas":[],"pares":[]}';
   elsif p_action='study' then
     if phase.kind<>'estudo' or step>=jsonb_array_length(phase.study_ids) or p_payload->'sinal' is distinct from phase.study_ids->step then raise exception 'STEP_CONFLICT'; end if;
     draft := jsonb_set(draft,'{passo}',to_jsonb(step+1));
   elsif p_action='pair' then
     if phase.kind<>'estudo' or step<>jsonb_array_length(phase.study_ids) then raise exception 'STEP_CONFLICT'; end if;
     if not phase.pair_ids @> jsonb_build_array(p_payload->'imagem') or not phase.pair_ids @> jsonb_build_array(p_payload->'palavra') then raise exception 'INVALID_PAIR'; end if;
     if p_payload->'imagem'=p_payload->'palavra' and not pairs @> jsonb_build_array(p_payload->'imagem') then
       pairs := pairs || jsonb_build_array(p_payload->'imagem');
     end if;
     draft := jsonb_set(draft,'{pares}',pairs);
     complete := jsonb_array_length(pairs)=jsonb_array_length(phase.pair_ids);
     if complete then result := jsonb_build_object('aprovada',true,'total',jsonb_array_length(pairs),'acertos',jsonb_array_length(pairs)); end if;
   elsif p_action='answer' then
     if phase.kind<>'avaliacao' or jsonb_typeof(p_payload->'indice') is distinct from 'number' or jsonb_typeof(p_payload->'resposta') is distinct from 'number' then raise exception 'INVALID_ANSWER'; end if;
     if (p_payload->>'indice')::numeric<>step or step>=jsonb_array_length(phase.answers) then raise exception 'STEP_CONFLICT'; end if;
     if (p_payload->>'resposta')::numeric not in (0,1,2,3) then raise exception 'INVALID_ANSWER'; end if;
     if account.hearts=0 then
       update lumi_game.accounts set hearts=account.hearts,hearts_at=account.hearts_at,revision=revision+1 where user_id=uid;
       return lumi_game.snapshot(uid)||jsonb_build_object('semCoracoes',true);
     end if;
     answer := (p_payload->>'resposta')::integer;
     if answer<>(phase.answers->>step)::integer then
       if account.hearts=5 then account.hearts_at:=now(); end if;
       account.hearts:=account.hearts-1;
     end if;
     answers:=answers||to_jsonb(answer); step:=step+1;
     draft:=jsonb_build_object('passo',step,'respostas',answers,'pares',pairs);
     total:=jsonb_array_length(phase.answers);
     if step=total then
       select count(*) into correct from generate_series(0,total-1) i where answers->i=phase.answers->i;
       complete:=correct*100>=80*total;
       result:=jsonb_build_object('completa',true,'acertos',correct,'total',total,'percentual',round(correct*100.0/total),'aprovada',complete);
     end if;
   end if;
   if result is not null then draft:=draft||'{"finalizado":true}'; end if;
   if complete and progress.completed_at is null then
     awarded_xp:=phase.xp; awarded_diamonds:=phase.diamonds;
     account.xp:=account.xp+awarded_xp; account.diamonds:=account.diamonds+awarded_diamonds;
   end if;
   update lumi_game.progress set draft=draft, result=case when p_action in ('retry','start') then null else coalesce(result,progress.result) end,
     completed_at=case when complete then coalesce(progress.completed_at,now()) else progress.completed_at end,
     xp=case when complete and progress.completed_at is null then phase.xp else progress.xp end
     where user_id=uid and phase_id=p_phase;
 end if;
 update lumi_game.accounts set xp=account.xp,diamonds=account.diamonds,hearts=account.hearts,hearts_at=account.hearts_at,
   login_days=account.login_days,streak=account.streak,longest_streak=account.longest_streak,last_login=account.last_login,revision=revision+1 where user_id=uid;
 -- Regras ficam inativas até serem cadastradas pelo responsável. Prêmios são únicos.
 for achievement in select * from lumi_game.achievements where active loop
   if lumi_game.metric_value(uid,achievement.metric)>=achievement.target then
     insert into lumi_game.user_achievements(user_id,achievement_id) values(uid,achievement.id) on conflict do nothing;
     get diagnostics affected = row_count;
     if affected=1 then update lumi_game.accounts set xp=xp+achievement.xp,diamonds=diamonds+achievement.diamonds where user_id=uid; end if;
   end if;
 end loop;
 response:=lumi_game.snapshot(uid)||jsonb_build_object('recompensa',jsonb_build_object('xp',awarded_xp,'diamantes',awarded_diamonds));
 if p_event is not null then insert into lumi_game.events(user_id,event_id,action,phase_id,payload,response) values(uid,p_event,p_action,p_phase,p_payload,response); end if;
 return response;
end;
$$;

revoke all on all tables in schema lumi_game from public, anon, authenticated;
revoke all on all functions in schema lumi_game from public, anon, authenticated;
revoke all on function public.lumi_game_action(text,text,jsonb,uuid) from public, anon;
grant execute on function public.lumi_game_action(text,text,jsonb,uuid) to authenticated;
commit;
(diamonds >= 0)