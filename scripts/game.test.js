import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { criarBancoTeste, acao } from './test-game-db.mjs';

test('Pontuação transacional, acesso, corações e conquistas no PostgreSQL', async t => {
  const db = await criarBancoTeste();
  t.after(() => db.close());
  const run = (a, p, body, id = randomUUID()) => acao(db, a, p, body, id);
  let state;
  await t.test('primeiro acesso, conquistas zeradas e acesso diário único', async () => {
    state = await run('visit');
    assert.equal(state.estatisticas.diasLogados, 1);
    assert.equal(state.estatisticas.sequencia, 1);
    assert.equal(state.estatisticas.xp, 0);
    assert.equal(state.estatisticas.diamantes, 0);
    assert.equal(state.estatisticas.coracoes, 5);
    assert.equal(state.conquistas.length, 8);
    assert(state.conquistas.every(c => !c.ativa && !c.desbloqueada && c.atual === 0));
    assert.equal((await run('visit')).estatisticas.diasLogados, 1);
    assert.equal((await db.query('select count(*)::int as n from lumi_game.phases')).rows[0].n, 64);
  });
  await t.test('bloqueio de fases e nenhuma permissão direta nas tabelas', async () => {
    await assert.rejects(run('start','saude:1:sinais-4'), /PHASE_LOCKED/);
    await db.exec('set role authenticated');
    assert.equal((await run('sync')).estatisticas.xp, 0);
    await assert.rejects(db.query('update lumi_game.accounts set xp=900'), /permission denied/);
    await db.exec('reset role; set role anon');
    await assert.rejects(run('sync'), /permission denied/);
    await db.exec('reset role');
  });
  async function estudo(phase) {
    const p = (await db.query('select * from lumi_game.phases where id=$1',[phase])).rows[0];
    await run('start',phase);
    for (const sinal of p.study_ids) await run('study',phase,{sinal});
    for (const id of p.pair_ids) state = await run('pair',phase,{imagem:id,palavra:id});
    return state;
  }
  await t.test('persistência de passos, recompensa única e idempotência', async () => {
    const p='saude:1:sinais-1';
    await run('start',p);
    const id=randomUUID();
    const first=await run('study',p,{sinal:1},id);
    assert.deepEqual(await run('study',p,{sinal:1},id),first);
    await assert.rejects(run('study',p,{sinal:2},id),/EVENT_CONFLICT/);
    assert.equal((await run('sync')).aprendizado[p].rascunho.passo,1);
    await assert.rejects(run('pair',p,{imagem:1,palavra:1}),/STEP_CONFLICT/);
    await run('study',p,{sinal:2}); await run('study',p,{sinal:3});
    await run('pair',p,{imagem:1,palavra:2});
    assert.equal((await run('sync')).estatisticas.xp,0);
    for(const n of [1,2,3]) state=await run('pair',p,{imagem:n,palavra:n});
    assert.deepEqual(state.recompensa,{xp:15,diamantes:5});
    assert(state.aprendizado[p].concluida);
    state=await estudo(p);
    assert.deepEqual(state.recompensa,{xp:0,diamantes:0});
    assert.equal(state.estatisticas.xp,15);
    assert.equal(state.estatisticas.diamantes,5);
    await estudo('saude:1:sinais-4');
  });
  await t.test('cada erro custa um coração; duplicata não desconta duas vezes; zero bloqueia', async () => {
    const p='saude:1:avaliacao';
    const answers=(await db.query('select answers from lumi_game.phases where id=$1',[p])).rows[0].answers;
    await run('start',p);
    const id=randomUUID(), body={indice:0,resposta:(answers[0]+1)%4};
    state=await run('answer',p,body,id);
    assert.equal(state.estatisticas.coracoes,4);
    assert.deepEqual(await run('answer',p,body,id),state);
    for(let i=1;i<5;i++) state=await run('answer',p,{indice:i,resposta:(answers[i]+1)%4});
    assert.equal(state.estatisticas.coracoes,0);
    state=await run('answer',p,{indice:5,resposta:answers[5]});
    assert(state.semCoracoes);
    assert.equal(state.aprendizado[p].rascunho.passo,5);
    await db.exec("update lumi_game.accounts set hearts_at=now()-interval '31 minutes'");
    state=await run('sync');
    assert.equal(state.estatisticas.coracoes,1);
    state=await run('answer',p,{indice:5,resposta:answers[5]});
    assert.equal(state.aprendizado[p].resultado.aprovada,false);
    assert.equal(state.estatisticas.xp,30);
    assert.equal(state.estatisticas.diamantes,10);
    await assert.rejects(run('start','saude:2:sinais-1'),/PHASE_LOCKED/);
  });
  await t.test('aprovação em 80%, revisão sem prêmio e próxima unidade liberada', async () => {
    const p='saude:1:avaliacao';
    const answers=(await db.query('select answers from lumi_game.phases where id=$1',[p])).rows[0].answers;
    await db.exec("update lumi_game.accounts set hearts_at=now()-interval '4 hours'");
    await run('retry',p);
    for(let i=0;i<answers.length;i++) state=await run('answer',p,{indice:i,resposta:i===0?(answers[i]+1)%4:answers[i]});
    assert.equal(state.aprendizado[p].resultado.percentual,83);
    assert(state.aprendizado[p].concluida);
    assert.deepEqual(state.recompensa,{xp:60,diamantes:5});
    assert.equal(state.estatisticas.xp,90);
    await run('start','saude:2:sinais-1');
    await run('retry',p);
    for(let i=0;i<answers.length;i++) state=await run('answer',p,{indice:i,resposta:answers[i]});
    assert.deepEqual(state.recompensa,{xp:0,diamantes:0});
    assert.equal(state.estatisticas.xp,90);
    assert(state.conquistas.every(c=>!c.desbloqueada));
    assert.equal(state.ranking[0].xp,90);
  });
  await t.test('contagem por Brasília, continuidade e quebra da sequência', async () => {
    await db.exec("delete from lumi_game.visits; update lumi_game.accounts set last_login=(now() at time zone 'America/Sao_Paulo')::date-1,streak=3,longest_streak=3");
    state=await run('visit');
    assert.equal(state.estatisticas.sequencia,4);
    assert.equal(state.estatisticas.diasLogados,2);
    await db.exec("delete from lumi_game.visits; update lumi_game.accounts set last_login=(now() at time zone 'America/Sao_Paulo')::date-2");
    state=await run('visit');
    assert.equal(state.estatisticas.sequencia,1);
    assert.equal(state.estatisticas.maiorSequencia,4);
  });
  await t.test('regra futura só desbloqueia quando ativada e recompensa uma vez', async () => {
    await db.exec("update lumi_game.achievements set active=true,metric='phases',target=3,xp=20,diamonds=2 where id='chama'");
    state=await run('sync');
    assert(state.conquistas.find(c=>c.id==='chama').desbloqueada);
    assert.equal(state.estatisticas.xp,110);
    assert.equal(state.estatisticas.diamantes,17);
    assert.equal((await run('sync')).estatisticas.xp,110);
  });
  await t.test('outra conta tem progresso independente e não herda prêmios', async () => {
    await db.exec("select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false)");
    state=await run('visit');
    assert.equal(state.estatisticas.xp,0);
    assert.equal(state.estatisticas.diamantes,0);
    assert.equal(state.estatisticas.coracoes,5);
    assert.deepEqual(state.aprendizado,{});
    assert(state.conquistas.every(c=>!c.desbloqueada));
  });
});
