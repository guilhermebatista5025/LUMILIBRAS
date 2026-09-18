import { analisarMao, normalizarMao } from './handGeometry.js';

export const META_CAMERA = 90;
export const QUADROS_ESTAVEIS_CAMERA = 4;
const ESTADOS = new Set(['Estendido', 'Flexionado', 'Intermediário']);

export function resumirMao(mao, largura = 1, altura = 1) {
  const dados = analisarMao(mao.landmarks, mao.worldLandmarks, largura, altura);
  return {
    estados: dados?.dedos.map(dedo => dedo.estado) || [],
    pontos: dados?.normalizados || [],
  };
}

export function maoValida(mao) {
  return mao?.estados?.length === 5 && mao.estados.every(estado => ESTADOS.has(estado)) &&
    !!normalizarMao(mao.pontos);
}

function notaMao(esperada, atual, espelhar) {
  if (!maoValida(esperada) || !maoValida(atual)) return 0;
  const dedos = atual.estados.filter((estado, i) => estado === esperada.estados[i]).length / 5;
  const distancia = atual.pontos.reduce((total, p, i) => {
    const base = esperada.pontos[i];
    return total + Math.hypot(p.x - base.x * (espelhar ? -1 : 1), p.y - base.y, p.z - base.z);
  }, 0) / 21;
  return Math.max(0, dedos * 0.7 + Math.max(0, 1 - distancia / 0.32) * 0.3) * 100;
}

// A ordem de retorno do detector pode mudar. Compare as duas permutações e
// permita a execução com a outra mão dominante, espelhando toda a configuração.
export function compararPosicao(esperadas, atuais) {
  if (!esperadas?.length || esperadas.length > 2 || esperadas.length !== atuais.length ||
      !esperadas.every(maoValida) || !atuais.every(maoValida)) {
    return { ok: false, percentual: 0, indices: [], espelhada: false };
  }
  const ordens = atuais.length === 2 ? [[0, 1], [1, 0]] : [[0]];
  let melhor = { nota: -1, indices: [], espelhada: false };
  for (const espelhada of [false, true]) {
    for (const indices of ordens) {
      // Ambas as mãos precisam atingir a meta; uma não compensa a outra.
      const nota = Math.min(...indices.map((atual, i) => notaMao(esperadas[i], atuais[atual], espelhada)));
      if (nota > melhor.nota) melhor = { nota, indices, espelhada };
    }
  }
  return { ...melhor, ok: melhor.nota >= META_CAMERA, percentual: Math.floor(melhor.nota) };
}

export function avancarSequencia(etapa, total, resultado) {
  if (!Number.isInteger(total) || total < 1 || etapa >= total || !resultado.ok) return { etapa, concluida: false };
  return { etapa: etapa + 1, concluida: etapa + 1 === total };
}

export function atualizarEstabilidade(atual, resultado, necessario = QUADROS_ESTAVEIS_CAMERA) {
  if (!resultado?.ok) return 0;
  const valor = Number.isInteger(atual) && atual > 0 ? atual : 0;
  return Math.min(necessario, valor + 1);
}
