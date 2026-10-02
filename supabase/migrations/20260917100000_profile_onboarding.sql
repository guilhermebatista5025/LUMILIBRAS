begin;

alter table public.profiles
  add column if not exists libras_level text,
  add column if not exists learning_goals jsonb not null default '[]'::jsonb,
  add column if not exists daily_goal_minutes integer not null default 10,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_libras_level_check;
alter table public.profiles
  add constraint profiles_libras_level_check check (libras_level is null or libras_level in ('nunca_estudei','alguns_sinais','basico','intermediario'));
alter table public.profiles
  drop constraint if exists profiles_daily_goal_check;
alter table public.profiles
  add constraint profiles_daily_goal_check check (daily_goal_minutes in (5,10,15,20));
alter table public.profiles
  drop constraint if exists profiles_learning_goals_check;
alter table public.profiles
  add constraint profiles_learning_goals_check check (jsonb_typeof(learning_goals) = 'array');

grant select on table public.profiles to authenticated;
grant update (display_name, libras_level, learning_goals, daily_goal_minutes, onboarding_completed_at) on table public.profiles to authenticated;

commit;
