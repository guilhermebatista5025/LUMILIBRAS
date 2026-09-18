import test from "node:test";
import assert from "node:assert/strict";
import { compararSequencias, coberturaDasMaos } from "../src/lib/temporalGesture.js";

function quadro(deslocamento = 0, curvatura = 0) {
  const landmarks = Array.from({ length: 21 }, (_, indice) => ({
    x: 0.35 + deslocamento + (indice % 4) * 0.012,
    y: 0.55 - Math.floor(indice / 4) * 0.018 + Math.sin(indice) * curvatura,
    z: indice * -0.001,
  }));
  return {
    landmarks: [landmarks],
    handedness: [[{ categoryName: "Left", displayName: "Left" }]],
  };
}

test("sequências temporais iguais atingem semelhança máxima", () => {
  const sequencia = Array.from({ length: 28 }, (_, indice) => quadro(indice * 0.004));
  assert.equal(compararSequencias(sequencia, sequencia).percentual, 100);
});
test("movimento e formato diferentes reduzem a semelhança", () => {
  const referencia = Array.from({ length: 28 }, (_, indice) => quadro(indice * 0.004));
  const diferente = Array.from({ length: 28 }, (_, indice) => quadro(-indice * 0.01, 0.035));
  assert.ok(compararSequencias(referencia, diferente).percentual < 70);
});

test("sequência sem mãos não pode ser aceita", () => {
  const vazia = Array.from({ length: 28 }, () => ({ landmarks: [], handedness: [] }));
  assert.equal(coberturaDasMaos(vazia), 0);
  assert.equal(compararSequencias(vazia, vazia).percentual, 0);
});
