import test from "node:test";
import assert from "node:assert/strict";
import { atualizarLeitura, melhorPredicao, QUADROS_ESTAVEIS } from "../src/lib/alphabetMission.js";
import { LETRAS_MODELO, MISSOES_ALFABETO } from "../src/data/missoesAlfabeto.js";

test("aceita somente uma classe conhecida acima da confiança mínima", () => {
  assert.deepEqual(melhorPredicao([0.02, 0.91, 0.03, 0.02, 0.02], LETRAS_MODELO).letra, "B");
  assert.equal(melhorPredicao([0.2, 0.2, 0.2, 0.2, 0.2], LETRAS_MODELO).letra, null);
  assert.equal(melhorPredicao([0.01, 0.01, 0.01, 0.01, 0.96], LETRAS_MODELO).letra, null);
});

test("confirma a letra apenas depois de quadros corretos consecutivos", () => {
  let leitura = { letra: null, quadros: 0 };
  for (let indice = 1; indice < QUADROS_ESTAVEIS; indice += 1) {
    leitura = atualizarLeitura(leitura, "A", "A");
    assert.equal(leitura.confirmou, false);
  }
  leitura = atualizarLeitura(leitura, "A", "A");
  assert.equal(leitura.confirmou, true);
  assert.equal(atualizarLeitura(leitura, "B", "A").quadros, 0);
});

test("todas as missões usam somente letras que o modelo conhece", () => {
  const suportadas = new Set(LETRAS_MODELO.filter(Boolean));
  assert.ok(MISSOES_ALFABETO.length > 0);
  for (const missao of MISSOES_ALFABETO) {
    assert.ok([...missao.texto].every(letra => suportadas.has(letra)));
  }
});

