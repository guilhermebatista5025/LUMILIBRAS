import { apiRequest } from './api.js';

export const ESTATISTICAS_VAZIAS = { xp: 0, diamantes: 0, coracoes: 5, maxCoracoes: 5, sequencia: 0, diasLogados: 0, maiorSequencia: 0, nivel: 1, fasesConcluidas: 0, fasesHoje: 0, xpHoje: 0, acessosRecentes: [] };
export const GAME_VAZIO = { versao: -1, estatisticas: ESTATISTICAS_VAZIAS, aprendizado: {}, conquistas: [], ranking: [], posicao: null, participantes: 0 };

export function gameAction(action, phase = null, payload = {}, eventId = null) {
  return apiRequest('/game', { method: 'POST', body: JSON.stringify({ action, phase, payload, eventId }) });
}
