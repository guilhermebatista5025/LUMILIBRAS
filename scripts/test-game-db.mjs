import { readFile } from 'node:fs/promises';

// Banco PostgreSQL descartável: nunca conecta ao Supabase de produção.
export async function criarBancoTeste() {
  const { PGlite } = await import('../.runtime/game-db-test/node_modules/@electric-sql/pglite/dist/index.js');
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create table public.profiles(id uuid primary key, display_name text);
    create function auth.uid() returns uuid language sql as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    insert into auth.users values ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
    insert into public.profiles values ('11111111-1111-4111-8111-111111111111','Aluno teste');
    select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`);
  for (const arquivo of ['20260914100000_game.sql', '20260914100100_game_catalog.sql', '20260915120000_hearts_for_pairs.sql', '20260916100000_store.sql']) {
    await db.exec(await readFile(new URL('../supabase/migrations/' + arquivo, import.meta.url), 'utf8'));
  }
  return db;
}

export async function acao(db, action, phase = null, payload = {}, eventId = null) {
  const result = await db.query('select public.lumi_game_action($1,$2,$3::jsonb,$4::uuid) as data', [action, phase, JSON.stringify(payload), eventId]);
  return result.rows[0].data;
}
