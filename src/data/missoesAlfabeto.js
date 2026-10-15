export const LETRAS_MODELO = ["A", "B", "C", "D", null];

// O modelo de referência foi treinado somente para A–D. As missões ficam
// separadas do componente para a troca por um modelo A–Z não exigir outra UI.
export const MISSOES_ALFABETO = [
  { id: "sequencia", titulo: "Primeiras letras", texto: "ABCD", descricao: "Faça A, B, C e D em ordem." },
  { id: "cada", titulo: "Monte uma palavra", texto: "CADA", descricao: "Soletre a palavra CADA." },
  { id: "dada", titulo: "Missão relâmpago", texto: "DADA", descricao: "Complete a sequência sem pular letras." },
];

