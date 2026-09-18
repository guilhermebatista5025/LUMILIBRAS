const QUADROS_PADRAO = 28;

function nomeMao(categorias) {
  return categorias?.[0]?.categoryName || categorias?.[0]?.displayName || "";
}

function distancia(a, b) {
  return Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0), (a?.z || 0) - (b?.z || 0));
}

function espelharQuadro(quadro) {
  return {
    ...quadro,
    landmarks: (quadro.landmarks || []).map(mao => mao.map(ponto => ({ ...ponto, x: 1 - ponto.x }))),
    handedness: (quadro.handedness || []).map(categorias => categorias.map(categoria => ({
      ...categoria,
      categoryName: categoria.categoryName === "Left" ? "Right" : categoria.categoryName === "Right" ? "Left" : categoria.categoryName,
      displayName: categoria.displayName === "Left" ? "Right" : categoria.displayName === "Right" ? "Left" : categoria.displayName,
    }))),
  };
}

function ordenarMaos(quadro) {
  const pares = (quadro.landmarks || []).map((landmarks, indice) => ({
    landmarks,
    lado: nomeMao(quadro.handedness?.[indice]),
  }));
  pares.sort((a, b) => (a.lado || "Z").localeCompare(b.lado || "Z"));
  return pares.slice(0, 2);
}

function codificarSequencia(quadros) {
  const primeirasPosicoes = [null, null];
  return quadros.map(quadro => {
    const maos = ordenarMaos(quadro);
    const vetor = [];
    for (let indice = 0; indice < 2; indice += 1) {
      const pontos = maos[indice]?.landmarks;
      if (!pontos?.length) {
        vetor.push(0, ...Array(62).fill(0));
        continue;
      }
      const pulso = pontos[0];
      const escala = Math.max(0.025, distancia(pulso, pontos[9]));
      primeirasPosicoes[indice] ||= { x: pulso.x, y: pulso.y };
      vetor.push(1, (pulso.x - primeirasPosicoes[indice].x) / escala, (pulso.y - primeirasPosicoes[indice].y) / escala);
      for (let ponto = 1; ponto < 21; ponto += 1) {
        vetor.push(
          (pontos[ponto].x - pulso.x) / escala,
          (pontos[ponto].y - pulso.y) / escala,
          (pontos[ponto].z - pulso.z) / escala,
        );
      }
    }
    return vetor;
  });
}

function interpolar(a, b, peso) {
  return a.map((valor, indice) => valor + (b[indice] - valor) * peso);
}

function reamostrar(sequencia, total = QUADROS_PADRAO) {
  if (!sequencia.length) return [];
  if (sequencia.length === 1) return Array.from({ length: total }, () => [...sequencia[0]]);
  return Array.from({ length: total }, (_, indice) => {
    const posicao = (indice / (total - 1)) * (sequencia.length - 1);
    const anterior = Math.floor(posicao);
    const seguinte = Math.min(sequencia.length - 1, anterior + 1);
    return interpolar(sequencia[anterior], sequencia[seguinte], posicao - anterior);
  });
}

function distanciaVetores(a, b) {
  let total = 0;
  for (let indice = 0; indice < a.length; indice += 1) {
    const diferenca = a[indice] - b[indice];
    const peso = indice % 63 < 3 ? 1.5 : 1;
    total += Math.min(4, Math.abs(diferenca)) * peso;
  }
  return total / a.length;
}

function distanciaTemporal(a, b) {
  const linhas = a.length + 1;
  const colunas = b.length + 1;
  const matriz = Array.from({ length: linhas }, () => Array(colunas).fill(Infinity));
  matriz[0][0] = 0;
  for (let i = 1; i < linhas; i += 1) {
    for (let j = 1; j < colunas; j += 1) {
      const custo = distanciaVetores(a[i - 1], b[j - 1]);
      matriz[i][j] = custo + Math.min(matriz[i - 1][j], matriz[i][j - 1], matriz[i - 1][j - 1]);
    }
  }
  return matriz[a.length][b.length] / Math.max(a.length, b.length);
}

export function coberturaDasMaos(quadros) {
  if (!quadros.length) return 0;
  return quadros.filter(quadro => quadro.landmarks?.length).length / quadros.length;
}

export function compararSequencias(referencia, tentativa) {
  if (coberturaDasMaos(referencia) < 0.45 || coberturaDasMaos(tentativa) < 0.45) {
    return { percentual: 0, distancia: Infinity, motivo: "Mantenha as mãos visíveis durante todo o sinal." };
  }
  const esperada = reamostrar(codificarSequencia(referencia));
  const normal = distanciaTemporal(esperada, reamostrar(codificarSequencia(tentativa)));
  const espelhada = distanciaTemporal(esperada, reamostrar(codificarSequencia(tentativa.map(espelharQuadro))));
  const melhor = Math.min(normal, espelhada);
  const percentual = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-2.35 * melhor))));
  return { percentual, distancia: melhor, espelhada: espelhada < normal, motivo: null };
}

export { codificarSequencia, reamostrar };
