import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { createAuthenticatedSupabase } from "../lib/authenticated-supabase.js";
import { asyncHandler } from "../lib/async-handler.js";

const router = Router();
const actions = new Set(['visit','sync','start','study','pair','answer','retry']);
router.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));
router.post('/', asyncHandler(async (request, response) => {
  const { action, phase = null, payload = {}, eventId = null } = request.body || {};
  if (!actions.has(action) || (!['visit','sync'].includes(action) && (!phase || !eventId)) || (phase !== null && (typeof phase !== 'string' || !/^saude:\d+:(sinais-\d+|avaliacao)$/.test(phase))) || !payload || typeof payload !== 'object' || Array.isArray(payload) || (eventId !== null && (typeof eventId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)))) {
    return response.status(422).json({ error: 'Solicitação de atividade inválida.', code: 'INVALID_GAME_INPUT' });
  }
  const { supabase } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase.rpc('lumi_game_action', { p_action: action, p_phase: phase, p_payload: payload, p_event: eventId });
  if (error) {
    if (['PGRST202','42883','42P01'].includes(error.code)) return response.status(503).json({ error: 'A integração de pontuação aguarda a instalação das tabelas no banco.', code: 'GAME_SCHEMA_MISSING' });
    const mensagens = { PHASE_LOCKED: 'Conclua a fase anterior primeiro.', STEP_CONFLICT: 'Seu progresso mudou. Reabra a atividade para sincronizar.', EVENT_CONFLICT: 'Não foi possível repetir esta operação.', INVALID_ANSWER: 'Escolha uma alternativa válida.', INVALID_PAIR: 'Selecione um par válido.', PHASE_NOT_FOUND: 'Fase não encontrada.' };
    const code = Object.keys(mensagens).find(key => error.message?.includes(key));
    if (code) return response.status(409).json({ error: mensagens[code], code });
    console.error('Falha na pontuação:', error.code);
    return response.status(500).json({ error: 'Não foi possível salvar seu progresso. Tente novamente.', code: 'GAME_SAVE_FAILED' });
  }
  response.json(data);
}));
export default router;
