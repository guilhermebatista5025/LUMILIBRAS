// Número de fotografias por sequência, conferido nas imagens da cartilha.
// Cada fotografia é analisada separadamente para não misturar mãos de etapas distintas.
const COLUNAS = [
  2,2,2,4,3,4,1,2,3,3,2,1,2,1,1,2,3,3,4,2,4,3,4,2,
  3,2,4,3,3,4,3,3,2,2,3,3,3,4,1,2,4,2,2,1,2,1,2,2,
  2,2,2,2,2,2,1,1,4,1,1,2,2,1,1,1,2,1,1,1,1,2,2,1,
  2,1,1,1,3,3,1,1,2,1,1,1,2,2,2,2,2,1,2,4,1,1,1,2,
  3,1,2,2,2,3,1,2,2,2,3,1,3,2,3,2,2,3,2,4,1,4,3,2,
  2,1,1,2,1,2,1,2,2,5,2,5,2,2,2,6,3,3,3,
];

export function colunasReferencia(sinalId) {
  return COLUNAS[Number(sinalId) - 1] || null;
}
