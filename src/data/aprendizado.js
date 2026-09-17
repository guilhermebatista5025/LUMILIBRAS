import treinamento from "./treinamento-saude.json" with { type: "json" };
import { CURSOS } from "./cursos.js";

export const QUESTOES = treinamento.questoes;
export const META_APROVACAO = treinamento.aprovacao;
export const chaveAprendizado = usuario => `lumilibras:aprendizado:v2:${usuario || "visitante"}`;
export const chaveFase = (curso, unidade, fase) => `${curso}:${unidade}:${fase}`;

export function obterFases(cursoId, unidadeId) {
  if (cursoId !== "saude") return [
    { id: "introducao", titulo: "Conheça o tema", tipo: "preparacao", questoes: [] },
    { id: "pratica", titulo: "Pratique os sinais", tipo: "preparacao", questoes: [] },
    { id: "revisao", titulo: "Revise o que aprendeu", tipo: "preparacao", questoes: [] },
  ];
  const questoes = QUESTOES.filter(q => q.unidade === unidadeId);
  const fases = [];
  for (let i = 0; i < questoes.length; i += 3) {
    const grupo = questoes.slice(i, i + 3);
    // Grupos pequenos revisam sinais já apresentados em unidades/fases anteriores.
    const anteriores = QUESTOES.filter(q => q.id < grupo[0].id).slice(-(3 - grupo.length));
    const pares = grupo.length < 3 ? [...grupo, ...anteriores].slice(0, 3) : grupo;
    fases.push({ id: `sinais-${i + 1}`, titulo: grupo.length === 1 ? grupo[0].termo : `Sinais ${i + 1} a ${i + grupo.length}`,
      descricao: grupo.map(q => q.termo).join(" • "), tipo: "estudo", questoes: grupo, pares,
      atividades: grupo.length + 1, xp: grupo.length * 5 });
  }
  fases.push({ id: "avaliacao", titulo: "Desafio da unidade", descricao: "Reconheça os sinais e alcance pelo menos 80% de acertos.",
    tipo: "avaliacao", questoes, atividades: questoes.length, xp: questoes.length * 10 });
  return fases;
}

export function avaliar(questoes, respostas) {
  const completa = questoes.length > 0 && respostas.length === questoes.length && respostas.every(r => Number.isInteger(r) && r >= 0 && r < 4);
  const acertos = questoes.filter((q, i) => respostas[i] === q.correta).length;
  const percentual = questoes.length ? Math.round(acertos / questoes.length * 100) : 0;
  return { completa, acertos, total: questoes.length, percentual, aprovada: completa && acertos * 100 >= META_APROVACAO * questoes.length };
}

export function faseConcluida(progresso, cursoId, unidadeId, faseId) {
  return progresso?.[chaveFase(cursoId, unidadeId, faseId)]?.concluida === true;
}

export function unidadeConcluida(progresso, cursoId, unidadeId) {
  const fases = obterFases(cursoId, unidadeId);
  return fases.length > 0 && fases.every(fase => faseConcluida(progresso, cursoId, unidadeId, fase.id));
}

export function unidadeLiberada(progresso, cursoId, unidadeId) {
  const curso = CURSOS[cursoId];
  const indice = curso?.unidades.findIndex(u => u.id === unidadeId) ?? -1;
  return indice >= 0 && curso.unidades.slice(0, indice).every(u => unidadeConcluida(progresso, cursoId, u.id));
}

export function faseLiberada(progresso, cursoId, unidadeId, faseId) {
  const fases = obterFases(cursoId, unidadeId);
  const indice = fases.findIndex(fase => fase.id === faseId);
  return unidadeLiberada(progresso, cursoId, unidadeId) && indice >= 0 && fases.slice(0, indice).every(fase => faseConcluida(progresso, cursoId, unidadeId, fase.id));
}

export function resumoUnidades(progresso) {
  return Object.fromEntries(Object.values(CURSOS).map(curso => [curso.id, curso.unidades.filter(u => unidadeLiberada(progresso, curso.id, u.id) && unidadeConcluida(progresso, curso.id, u.id)).map(u => u.id)]));
}

export function proximaAtividade(progresso, cursoId) {
  const curso = CURSOS[cursoId];
  if (!curso) return null;
  for (const unidade of curso.unidades) {
    if (!unidadeLiberada(progresso, cursoId, unidade.id)) break;
    if (unidadeConcluida(progresso, cursoId, unidade.id)) continue;
    const fase = obterFases(cursoId, unidade.id).find(item => !faseConcluida(progresso, cursoId, unidade.id, item.id));
    return fase && faseLiberada(progresso, cursoId, unidade.id, fase.id) ? { unidade, fase } : null;
  }
  return null;
}

export function unidadesEmDestaque(progresso, cursoId, quantidade = 4) {
  const unidades = CURSOS[cursoId]?.unidades || [];
  const proxima = proximaAtividade(progresso, cursoId);
  const indice = proxima ? unidades.findIndex(unidade => unidade.id === proxima.unidade.id) : unidades.length - 1;
  const inicio = Math.min(Math.max(0, indice - 1), Math.max(0, unidades.length - quantidade));
  return unidades.slice(inicio, inicio + quantidade);
}

export function lerAprendizado(chave) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "{}");
    return valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {};
  } catch { return {}; }
}

export function objetivoUnidade(id) {
  return treinamento.unidades.find(unidade => unidade.id === id)?.objetivo;
}
