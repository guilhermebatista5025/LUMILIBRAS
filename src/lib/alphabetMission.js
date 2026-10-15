export const CONFIANCA_MINIMA = 0.72;
export const QUADROS_ESTAVEIS = 5;

export function melhorPredicao(probabilidades, letras, confiancaMinima = CONFIANCA_MINIMA) {
  if (!Array.isArray(probabilidades) && !ArrayBuffer.isView(probabilidades)) return { letra: null, confianca: 0, indice: -1 };
  let indice = -1;
  let confianca = -Infinity;
  for (let atual = 0; atual < probabilidades.length; atual += 1) {
    const valor = Number(probabilidades[atual]);
    if (Number.isFinite(valor) && valor > confianca) {
      indice = atual;
      confianca = valor;
    }
  }
  const letra = confianca >= confiancaMinima ? letras[indice] || null : null;
  return { letra, confianca: Number.isFinite(confianca) ? confianca : 0, indice };
}

export function atualizarLeitura(estabilidade, letraDetectada, letraEsperada, necessario = QUADROS_ESTAVEIS) {
  const anterior = estabilidade?.letra === letraDetectada ? estabilidade.quadros : 0;
  if (!letraDetectada || letraDetectada !== letraEsperada) return { letra: letraDetectada, quadros: 0, confirmou: false };
  const quadros = Math.min(necessario, anterior + 1);
  return { letra: letraDetectada, quadros, confirmou: quadros >= necessario };
}

