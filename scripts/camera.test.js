import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { avancarSequencia, atualizarEstabilidade, compararPosicao, QUADROS_ESTAVEIS_CAMERA } from '../src/lib/gesturePractice.js';
import { colunasReferencia } from '../src/data/cameraReferencias.js';
import treinamento from '../src/data/treinamento-saude.json' with { type: 'json' };

const mao = () => ({ estados: Array(5).fill('Estendido'), pontos: Array.from({ length: 21 }, (_, i) => ({ x: i * .01, y: i * .04, z: i * .005 })) });

test('aprovação exige 90% reais, sem arredondar um resultado inferior', () => {
  const base = mao();
  const alterar = distancia => ({ ...base, pontos: base.pontos.map(p => ({ ...p, y: p.y + distancia })) });
  assert.equal(compararPosicao([base], [base]).percentual, 100);
  assert.equal(compararPosicao([base], [alterar(.32 / 3 - 1e-8)]).ok, true);
  const abaixo = compararPosicao([base], [alterar(.32 * .101 / .3)]);
  assert.equal(abaixo.ok, false);
  assert.equal(abaixo.percentual, 89);
});

test('sem referência, sem mãos, pontos inválidos e dedos indefinidos nunca aprovam', () => {
  for (const [referencia, atual] of [[[], []], [[mao()], []], [[mao()], [{ ...mao(), pontos: [] }]],
    [[mao()], [{ ...mao(), estados: Array(5).fill('Indefinido') }]], [[mao(), mao()], [mao()]]]) {
    assert.equal(compararPosicao(referencia, atual).ok, false);
  }
});

test('suporta inversão da ordem das duas mãos e exige acerto em ambas', () => {
  const a = mao(), b = { ...mao(), estados: Array(5).fill('Flexionado') };
  const resultado = compararPosicao([a, b], [b, a]);
  assert.equal(resultado.ok, true);
  assert.deepEqual(resultado.indices, [1, 0]);
  assert.equal(compararPosicao([a, b], [a, a]).ok, false);
});

test('permite outra mão dominante espelhando a configuração inteira', () => {
  const a = mao(), espelhada = { ...a, pontos: a.pontos.map(p => ({ ...p, x: -p.x })) };
  assert.equal(compararPosicao([a], [espelhada]).ok, true);
  assert.equal(compararPosicao([a], [espelhada]).espelhada, true);
});

test('a sequência só conclui na última posição e não conclui duas vezes', () => {
  assert.deepEqual(avancarSequencia(0, 2, { ok: false }), { etapa: 0, concluida: false });
  assert.deepEqual(avancarSequencia(0, 2, { ok: true }), { etapa: 1, concluida: false });
  assert.deepEqual(avancarSequencia(1, 2, { ok: true }), { etapa: 2, concluida: true });
  assert.deepEqual(avancarSequencia(2, 2, { ok: true }), { etapa: 2, concluida: false });
  assert.equal(avancarSequencia(0, 0, { ok: true }).concluida, false);
});

test('exige vários quadros corretos seguidos e reinicia a estabilidade ao perder a posição', () => {
  let estabilidade = 0;
  for (let i = 1; i < QUADROS_ESTAVEIS_CAMERA; i++) {
    estabilidade = atualizarEstabilidade(estabilidade, { ok: true });
    assert.equal(estabilidade, i);
  }
  assert.equal(atualizarEstabilidade(estabilidade, { ok: false }), 0);
  assert.equal(atualizarEstabilidade(QUADROS_ESTAVEIS_CAMERA, { ok: true }), QUADROS_ESTAVEIS_CAMERA);
});

test('as 139 lições têm separação de fotografias; IDs ausentes não recebem referência inventada', () => {
  for (const q of treinamento.questoes) assert.ok(colunasReferencia(q.id) >= 1);
  assert.equal(colunasReferencia(1), 2);
  assert.equal(colunasReferencia(136), 6);
  assert.equal(colunasReferencia(140), null);
});

test('o detector inicia em modo de vídeo para a câmera de teste não falhar no primeiro quadro', async () => {
  const worker = await readFile(new URL('../src/assets/public/camera/hand-worker.js', import.meta.url), 'utf8');
  assert.match(worker, /runningMode:\s*'VIDEO'/);
  assert.match(worker, /reference-unavailable/);
});
