/**
 * CONFIGURAÇÃO FÁCIL PARA AJUSTAR OS EIXOS E A COLETA.
 *
 * O MediaPipe já entrega x, y e z normalizados. Para trocar X por Y, mude
 * `origem` nos dois eixos. Para espelhar um eixo entre 0 e 1, use `escala: -1`
 * e `offset: 1`. `offset` também pode deslocar o eixo.
 *
 * Atenção: mantenha exatamente a mesma configuração no futuro treinamento
 * e reconhecimento, senão os exemplos e as previsões ficam incompatíveis.
 */
export const CONFIG_EIXOS = {
  x: { origem: "x", escala: 1, offset: 0 }, // horizontal: 0 esquerda, 1 direita da imagem
  y: { origem: "y", escala: 1, offset: 0 }, // vertical: 0 topo, 1 base da imagem
  z: { origem: "z", escala: 1, offset: 0 }, // profundidade estimada pelo MediaPipe
};

// Para inverter X e Y, configure origem de x como "y" e origem de y como "x".

// Poses estáticas coletam uma amostra a cada intervalo enquanto gravando.
export const INTERVALO_POSE_MS = 180;

// J/Z precisam de vários quadros consecutivos para preservar o movimento.
export const INTERVALO_MOVIMENTO_MS = 80;

// A coleta não inicia se a mão estiver colada na borda do quadro.
export const MARGEM_MINIMA = 0.025;

