import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { QUESTOES, avaliar, chaveFase, obterFases, resumoUnidades, faseLiberada, unidadeLiberada, chaveAprendizado } from "../src/data/aprendizado.js";

test("139 questões originais, com imagens e quatro alternativas válidas", () => {
  assert.equal(QUESTOES.length, 139);
  for (const q of QUESTOES) {
    assert.equal(q.alternativas.length, 4);
    assert.equal(q.alternativas[q.correta], q.termo);
    assert(existsSync(new URL(`../public${q.imagem}`, import.meta.url)), q.imagem);
  }
});

test("cada avaliação cobre exatamente todos os sinais da unidade, sem duplicações", () => {
  for (let unidade = 1; unidade <= 13; unidade++) {
    const fases = obterFases("saude", unidade);
    const ids = QUESTOES.filter(q => q.unidade === unidade).map(q => q.id);
    assert.deepEqual(fases.filter(f => f.tipo === "estudo").flatMap(f => f.questoes.map(q => q.id)), ids);
    assert.deepEqual(fases.at(-1).questoes.map(q => q.id), ids);
    assert.equal(fases.at(-1).tipo, "avaliacao");
    for (const fase of fases.filter(f => f.tipo === "estudo")) {
      assert.equal(new Set(fase.pares.map(q => q.id)).size, fase.pares.length);
      assert(fase.pares.length >= 2);
      assert(fase.pares.every(q => q.id <= fase.questoes.at(-1).id));
    }
  }
});

test("80% exatos aprovam; questão ausente, alternativa inválida e arredondamento não aprovam", () => {
  const questoes = QUESTOES.slice(0, 5);
  const certas = questoes.map(q => q.correta);
  assert.equal(avaliar(questoes, certas).aprovada, true);
  assert.equal(avaliar(questoes, [...certas.slice(0, 4), (certas[4] + 1) % 4]).aprovada, true);
  assert.equal(avaliar(questoes, certas.slice(0, 4)).aprovada, false);
  assert.equal(avaliar(questoes, [9, ...certas.slice(1)]).aprovada, false);
  const muitas = Array.from({ length: 201 }, () => ({ correta: 0 }));
  const abaixo = avaliar(muitas, Array.from({ length: 201 }, (_, i) => i < 160 ? 0 : 1));
  assert.equal(abaixo.percentual, 80);
  assert.equal(abaixo.aprovada, false);
});

test("início sem progresso libera apenas unidade 1 e fase 1", () => {
  const fases = obterFases("saude", 1);
  assert.equal(unidadeLiberada({}, "saude", 1), true);
  assert.equal(unidadeLiberada({}, "saude", 2), false);
  assert.equal(faseLiberada({}, "saude", 1, fases[0].id), true);
  for (const fase of fases.slice(1)) assert.equal(faseLiberada({}, "saude", 1, fase.id), false);
  assert.equal(faseLiberada({}, "saude", 1, "inexistente"), false);
  assert.equal(unidadeLiberada({}, "saude", 999), false);
});

test("toda a progressão sequencial exige a fase e unidade anteriores", () => {
  const progresso = {};
  for (let unidade = 1; unidade <= 13; unidade++) {
    assert.equal(unidadeLiberada(progresso, "saude", unidade), true);
    for (const fase of obterFases("saude", unidade)) {
      assert.equal(faseLiberada(progresso, "saude", unidade, fase.id), true);
      assert.equal(unidadeLiberada(progresso, "saude", unidade + 1), false);
      progresso[chaveFase("saude", unidade, fase.id)] = { concluida: true };
    }
    assert.equal(resumoUnidades(progresso).saude.length, unidade);
  }
  assert.equal(resumoUnidades(progresso).saude.length, 13);
});

test("progresso futuro isolado não ignora unidades anteriores; contas ficam separadas", () => {
  const progresso = Object.fromEntries(obterFases("saude", 2).map(f => [chaveFase("saude", 2, f.id), { concluida: true }]));
  assert.equal(unidadeLiberada(progresso, "saude", 3), false);
  assert.deepEqual(resumoUnidades(progresso).saude, []);
  assert.notEqual(chaveAprendizado("aluno-a"), chaveAprendizado("aluno-b"));
  assert(chaveAprendizado("aluno-a").includes(":v2:"));
});
