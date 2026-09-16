import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createAuthenticatedSupabase } from '../lib/authenticated-supabase.js';
import { asyncHandler } from '../lib/async-handler.js';

const router = Router();
const itemIds = new Set(['recarga-diamantes', 'recarga-moedas', 'xp-diamantes', 'xp-moedas', 'aurora', 'dourada']);
const skinIds = new Set(['classica', 'aurora', 'dourada']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false }));

function sendResult(response, data, error) {
  if (!error) return response.json(data);
  if (['PGRST202', '42883', '42P01', '42703'].includes(error.code)) {
    return response.status(503).json({ error: 'A loja aguarda a instalação da migração no banco.', code: 'STORE_SCHEMA_MISSING' });
  }
  const messages = {
    INSUFFICIENT_FUNDS: 'Você ainda não tem saldo suficiente.',
    ALREADY_OWNED: 'Esta skin já faz parte da sua coleção.',
    HEARTS_FULL: 'Seus corações já estão cheios.',
    SKIN_NOT_OWNED: 'Esta skin ainda não foi desbloqueada.',
    EVENT_CONFLICT: 'Esta compra já foi registrada para outro item.',
    ITEM_NOT_FOUND: 'Item não encontrado.',
  };
  const code = Object.keys(messages).find(key => error.message?.includes(key));
  if (code) return response.status(409).json({ error: messages[code], code });
  console.error('Falha na loja:', error.code);
  return response.status(500).json({ error: 'Não foi possível atualizar a loja. Tente novamente.', code: 'STORE_FAILED' });
}

router.get('/', asyncHandler(async (request, response) => {
  const { supabase } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase.rpc('lumi_store_state');
  return sendResult(response, data, error);
}));

router.post('/buy', asyncHandler(async (request, response) => {
  const { itemId, eventId } = request.body || {};
  if (!itemIds.has(itemId) || typeof eventId !== 'string' || !uuid.test(eventId)) {
    return response.status(422).json({ error: 'Escolha um item válido.', code: 'INVALID_STORE_INPUT' });
  }
  const { supabase } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase.rpc('lumi_store_buy', { p_item: itemId, p_event: eventId });
  return sendResult(response, data, error);
}));

router.post('/equip', asyncHandler(async (request, response) => {
  const { skinId } = request.body || {};
  if (!skinIds.has(skinId)) return response.status(422).json({ error: 'Escolha uma skin válida.', code: 'INVALID_STORE_INPUT' });
  const { supabase } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase.rpc('lumi_store_equip', { p_skin: skinId });
  return sendResult(response, data, error);
}));

export default router;
