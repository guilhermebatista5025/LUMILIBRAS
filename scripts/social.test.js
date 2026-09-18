import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('migração social protege contas e calcula ranking por amizade e estado', async t => {
  let PGlite;
  try { ({ PGlite } = await import('../.runtime/game-db-test/node_modules/@electric-sql/pglite/dist/index.js')); }
  catch { t.skip('PGlite opcional não instalado'); return; }
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema lumi_game;
    create table auth.users(id uuid primary key);
    create table public.profiles(id uuid primary key, display_name text not null);
    create table lumi_game.accounts(user_id uuid primary key, xp integer, streak integer);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
    insert into public.profiles values ('11111111-1111-4111-8111-111111111111','Aluno A'),('22222222-2222-4222-8222-222222222222','Aluno B');
    insert into lumi_game.accounts values ('11111111-1111-4111-8111-111111111111',100,2),('22222222-2222-4222-8222-222222222222',200,4);
    select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`);
  await db.exec(await readFile(new URL('../supabase/migrations/20260917120000_social_notifications.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/20260917121000_social_ranking.sql', import.meta.url), 'utf8'));
  const found = await db.query("select * from public.lumi_find_friends('Aluno')");
  assert.equal(found.rows.length, 1);
  assert.equal(found.rows[0].relationship, 'none');
  await db.query("select public.lumi_friend_action('22222222-2222-4222-8222-222222222222','request')");
  assert.equal((await db.query("select relationship from public.lumi_find_friends('Aluno')")).rows[0].relationship, 'sent');
  await db.exec("select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false)");
  await db.query("select public.lumi_friend_action('11111111-1111-4111-8111-111111111111','accept')");
  await db.exec("select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false)");
  const friends = await db.query("select * from public.lumi_social_ranking('friends')");
  assert.deepEqual(friends.rows.map(row => row.xp), [200,100]);
  await db.exec("insert into public.lumi_social_settings(user_id,region) values ('11111111-1111-4111-8111-111111111111','SP'),('22222222-2222-4222-8222-222222222222','SP')");
  const regional = await db.query("select * from public.lumi_social_ranking('regional')");
  assert.equal(regional.rows.length, 2);
  await db.exec('set role anon');
  await assert.rejects(db.query('select * from public.lumi_social_ranking(\'friends\')'), /permission denied/);
});
