export const DEDOS = [
  { nome: 'Polegar', pontos: [1, 2, 3, 4] },
  { nome: 'Indicador', pontos: [5, 6, 7, 8] },
  { nome: 'Médio', pontos: [9, 10, 11, 12] },
  { nome: 'Anelar', pontos: [13, 14, 15, 16] },
  { nome: 'Mínimo', pontos: [17, 18, 19, 20] },
];
export const CONEXOES = [[0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17], ...DEDOS.flatMap(d => d.pontos.slice(1).map((p, i) => [d.pontos[i], p]))];
const vetor = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) });
const norma = p => Math.hypot(p.x, p.y, p.z || 0);
export function angulo(a, b, c) {
  const u = vetor(a, b), v = vetor(c, b), denominador = norma(u) * norma(v);
  if (denominador < 1e-9) return null;
  return Math.acos(Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y + u.z * v.z) / denominador))) * 180 / Math.PI;
}
export function pontosValidos(pontos) {
  return Array.isArray(pontos) && pontos.length === 21 && pontos.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
}
// Translação e escala removidas; orientação preservada, pois faz parte do sinal.
export function normalizarMao(pontos) {
  if (!pontosValidos(pontos)) return null;
  const escala = norma(vetor(pontos[9], pontos[0]));
  if (escala < 1e-6) return null;
  return pontos.map(p => { const v = vetor(p, pontos[0]); return { x: v.x / escala, y: v.y / escala, z: v.z / escala }; });
}
export function coordenadaTela(p, largura, altura, espelhada = true) {
  return { x: (espelhada ? 1 - p.x : p.x) * largura, y: p.y * altura };
}
export function analisarMao(pontos, mundo, largura, altura) {
  if (!pontosValidos(pontos)) return null;
  // World landmarks têm a mesma unidade nos três eixos. No fallback corrigimos
  // a proporção do quadro: y normalizado pela altura não tem a escala de x.
  const geometria = pontosValidos(mundo) ? mundo : pontos.map(p => ({ x: p.x, y: p.y * altura / largura, z: p.z }));
  return {
    normalizados: normalizarMao(geometria),
    dedos: DEDOS.map(({ nome, pontos: ids }) => {
      const proximal = angulo(...ids.slice(0, 3).map(i => geometria[i]));
      const distal = angulo(...ids.slice(1).map(i => geometria[i]));
      const flexao = proximal === null || distal === null ? null : Math.min(proximal, distal);
      // Heurística geométrica, não diagnóstico anatômico nem tradução de Libras.
      const estado = flexao === null ? 'Indefinido' : flexao > 155 ? 'Estendido' : flexao < 115 ? 'Flexionado' : 'Intermediário';
      return { nome, ponta: ids[3], x: pontos[ids[3]].x, y: pontos[ids[3]].y, z: pontos[ids[3]].z, angulo: flexao, estado };
    }),
  };
}
