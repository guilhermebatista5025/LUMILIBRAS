begin;

-- Expande as métricas usadas pelo catálogo de conquistas.
alter table lumi_game.achievements
  drop constraint if exists achievements_metric_check;

alter table lumi_game.achievements
  add constraint achievements_metric_check
  check (metric in ('xp','login_days','streak','phases','perfect','signs','friends','alphabet'));

create or replace function lumi_game.metric_value(p_user uuid, p_metric text) returns integer
language sql stable set search_path = '' as $$
  select case p_metric
    when 'xp' then a.xp
    when 'login_days' then a.login_days
    when 'streak' then a.streak
    when 'phases' then (
      select count(*)::integer from lumi_game.progress p
      where p.user_id = p_user and p.completed_at is not null
    )
    when 'perfect' then (
      select count(*)::integer from lumi_game.progress p
      where p.user_id = p_user and p.completed_at is not null
        and (p.result->>'percentual')::integer = 100
    )
    when 'signs' then (
      select count(distinct e.payload->>'sinal')::integer
      from lumi_game.events e
      where e.user_id = p_user and e.action = 'study'
    )
    when 'friends' then (
      select count(*)::integer from public.lumi_friend_requests f
      where f.status = 'accepted'
        and (f.requester_id = p_user or f.addressee_id = p_user)
    )
    when 'alphabet' then (
      select count(distinct e.payload->>'atividade')::integer
      from lumi_game.events e
      where e.user_id = p_user and e.action = 'activity'
        and e.payload->>'atividade' like 'alfabeto:%'
    )
    else 0
  end
  from lumi_game.accounts a
  where a.user_id = p_user;
$$;

-- Metas que a pessoa consegue cumprir jogando normalmente. Os prêmios são únicos.
update lumi_game.achievements set active = true, metric = 'streak', target = 2, xp = 10, diamonds = 2
where id = 'chama';
update lumi_game.achievements set active = true, metric = 'signs', target = 20, xp = 25, diamonds = 5
where id = 'bibliotecario';
update lumi_game.achievements set active = true, metric = 'perfect', target = 1, xp = 15, diamonds = 3
where id = 'estrela';
update lumi_game.achievements set active = true, metric = 'friends', target = 1, xp = 10, diamonds = 2
where id = 'social';
update lumi_game.achievements set active = true, metric = 'alphabet', target = 1, xp = 15, diamonds = 3
where id = 'interprete';
update lumi_game.achievements set active = true, metric = 'xp', target = 100, xp = 20, diamonds = 4
where id = 'veloz';
update lumi_game.achievements set active = true, metric = 'perfect', target = 5, xp = 50, diamonds = 10
where id = 'foco';
update lumi_game.achievements set active = true, metric = 'streak', target = 7, xp = 75, diamonds = 15
where id = 'segredo';

commit;
