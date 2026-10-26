import { CONFIG_EIXOS } from "./alfabetoCadastroConfig.js";

export const DISTANCIA_MAXIMA = 0.2;
export const MARGEM_CLASSIFICACAO = 0.025;
const VIZINHOS = 5;

export function normalizarLandmarks(pontos) {
  if (!Array.isArray(pontos) || pontos.length !== 21) return null;
  const ajustados = pontos.map(ponto => Object.fromEntries(Object.entries(CONFIG_EIXOS).map(([eixo, ajuste]) => [
    eixo,
    Number((Number(ponto[ajuste.origem]) * ajuste.escala + ajuste.offset).toFixed(6)),
  ])));
  const pulso = ajustados[0];
  const relativos = ajustados.map(ponto => ({ x: ponto.x - pulso.x, y: ponto.y - pulso.y, z: ponto.z - pulso.z }));
  const escala = Math.max(...relativos.map(ponto => Math.hypot(ponto.x, ponto.y, ponto.z)), 0.0001);
  return relativos.map(ponto => [ponto.x / escala, ponto.y / escala, ponto.z / escala]);
}

function distanciaMedia(formaA, formaB) {
  if (!Array.isArray(formaA) || !Array.isArray(formaB) || formaA.length !== 21 || formaB.length !== 21) return Infinity;
  let soma = 0;
  for (let ponto = 0; ponto < 21; ponto += 1) {
    const a = formaA[ponto];
    const b = formaB[ponto];
    soma += (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
  }
  return Math.sqrt(soma / 21);
}

/** Compara uma pose atual com as amostras rotuladas; não grava nada. */
export function reconhecerPorLandmarks(pontos, exemplos) {
  const forma = normalizarLandmarks(pontos);
  if (!forma) return { letra: null, distancia: Infinity, confianca: 0, valida: false };
  const formaObjetos = forma.map(([x, y, z]) => ({ x, y, z }));

  const porLetra = new Map();
  for (const exemplo of exemplos) {
    if (!exemplo?.letra || !Array.isArray(exemplo.forma) || exemplo.forma.length !== 21) continue;
    if (exemplo.letra === "J" || exemplo.letra === "Z") continue;
    const distancia = distanciaMedia(formaObjetos, exemplo.forma);
    if (!Number.isFinite(distancia)) continue;
    if (!porLetra.has(exemplo.letra)) porLetra.set(exemplo.letra, []);
    porLetra.get(exemplo.letra).push(distancia);
  }

  const escores = [...porLetra.entries()]
    .filter(([, distancias]) => distancias.length >= 3)
    .map(([letra, distancias]) => {
      distancias.sort((a, b) => a - b);
      const maisProximos = distancias.slice(0, Math.min(VIZINHOS, distancias.length));
      return { letra, distancia: maisProximos.reduce((soma, valor) => soma + valor, 0) / maisProximos.length };
    })
    .sort((a, b) => a.distancia - b.distancia);

  if (!escores.length) return { letra: null, distancia: Infinity, confianca: 0, valida: false };
  const melhor = escores[0];
  const segundo = escores[1];
  const margem = segundo ? segundo.distancia - melhor.distancia : Infinity;
  const confianca = Math.max(0, Math.min(1, 1 - melhor.distancia / DISTANCIA_MAXIMA));
  return {
    letra: melhor.distancia <= DISTANCIA_MAXIMA ? melhor.letra : null,
    candidata: melhor.letra,
    distancia: melhor.distancia,
    margem,
    confianca,
    valida: melhor.distancia <= DISTANCIA_MAXIMA && margem >= MARGEM_CLASSIFICACAO,
  };
}
