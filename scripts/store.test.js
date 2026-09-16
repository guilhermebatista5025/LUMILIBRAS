import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { criarBancoTeste, acao } from './test-game-db.mjs';

test('loja persiste moedas, compras, skins, corações e boost sem débito duplicado', async t => {
  const db = await criarBancoTeste();
  t.after(() => db.close());
  const state = async () => (await db.query('select public.lumi_store_state() as data')).rows[0].data;
  const buy = async (item, event = randomUUID()) =>
    (await db.query('select public.lumi_store_buy($1,$2::uuid) as data', [item, event])).rows[0].data;
  const equip = async skin => (await db.query('select public.lumi_store_equip($1) as data', [skin])).rows[0].data;

  assert.equal((await state()).moedas, 0);
  assert.equal((await state()).itens.length, 6);
  assert.equal((await acao(db, 'visit')).estatisticas.diasLogados, 1);
  assert.equal((await state()).moedas, 10);
  await acao(db, 'visit');
  assert.equal((await state()).moedas, 10);
  await assert.rejects(buy('aurora'), /INSUFFICIENT_FUNDS/);
  await assert.rejects(equip('aurora'), /SKIN_NOT_OWNED/);

  await db.exec('update lumi_game.accounts set coins=300, diamonds=150, hearts=2');
  const event = randomUUID();
  const skin = await buy('aurora', event);
  assert.equal(skin.moedas, 50);
  assert.equal(skin.skinAtiva, 'aurora');
  assert.deepEqual(skin.skins, ['aurora']);
  assert.deepEqual(await buy('aurora', event), skin);
  assert.equal((await state()).moedas, 50);
  await assert.rejects(buy('dourada', event), /EVENT_CONFLICT/);
  await assert.rejects(buy('aurora'), /ALREADY_OWNED/);
  assert.equal((await equip('classica')).skinAtiva, 'classica');
  assert.equal((await equip('aurora')).skinAtiva, 'aurora');

  const refill = await buy('recarga-diamantes');
  assert.equal(refill.coracoes, 5);
  assert.equal(refill.diamantes, 130);
  await assert.rejects(buy('recarga-diamantes'), /HEARTS_FULL/);

  const boosted = await buy('xp-diamantes');
  assert.equal(boosted.boosts, 1);
  assert.equal(boosted.diamantes, 85);
  await acao(db, 'start', 'saude:1:sinais-1', {}, randomUUID());
  for (const sinal of [1, 2, 3]) await acao(db, 'study', 'saude:1:sinais-1', { sinal }, randomUUID());
  let result;
  for (const n of [1, 2, 3]) result = await acao(db, 'pair', 'saude:1:sinais-1', { imagem: n, palavra: n }, randomUUID());
  assert.equal(result.estatisticas.xp, 30);
  assert.equal((await state()).boosts, 0);
  assert.equal((await acao(db, 'sync')).estatisticas.xp, 30);

  await db.exec('set role authenticated');
  await assert.rejects(db.query('update lumi_game.accounts set coins=999'), /permission denied/);
  await db.exec('reset role; set role anon');
  await assert.rejects(state(), /permission denied/);
  await db.exec('reset role');
});
