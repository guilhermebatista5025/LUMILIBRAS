begin;

create or replace function public.lumi_social_ranking(p_scope text)
returns table(id uuid, nome text, xp integer, dias integer, posicao bigint, voce boolean)
language sql security definer set search_path = '' as $$
  with eligible as (
    select a.user_id id, coalesce(nullif(p.display_name,''),'Estudante') nome, a.xp, a.streak dias
    from lumi_game.accounts a join public.profiles p on p.id=a.user_id
    where a.xp > 0 and (p_scope='regional' or exists(select 1 from public.lumi_friend_requests f where f.status='accepted' and ((f.requester_id=auth.uid() and f.addressee_id=a.user_id) or (f.addressee_id=auth.uid() and f.requester_id=a.user_id)) or a.user_id=auth.uid()))
      and (p_scope <> 'regional' or coalesce((select region from public.lumi_social_settings s where s.user_id=auth.uid()),'') = coalesce((select region from public.lumi_social_settings s where s.user_id=a.user_id),'') or a.user_id=auth.uid())
  )
  select id,nome,xp,dias,rank() over(order by xp desc,id),id=auth.uid() from eligible order by xp desc,id limit 50;
$$;

revoke all on function public.lumi_social_ranking(text) from public, anon;
grant execute on function public.lumi_social_ranking(text) to authenticated;

commit;
