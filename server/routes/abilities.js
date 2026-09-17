import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createAuthenticatedSupabase } from '../lib/authenticated-supabase.js';
import { asyncHandler } from '../lib/async-handler.js';

const router = Router();
const abilities = new Set(['asas-orientacao', 'olhar-preciso', 'ritmo-tranquilo']);
const reviews = new Set(['memoria-dourada', 'cura-conhecimento', 'missao-resgate', 'descanso-memoria']);
router.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false }));

function send(response, data, error) {
  if (!error) return response.json(data);
  if (['PGRST202', '42883', '42P01', '42703'].includes(error.code)) {
    return response.status(503).json({ error: 'As habilidades aguardam a migração do banco.', code: 'ABILITY_SCHEMA_MISSING' });
  }
  const messages = {
    ABILITY_UNAVAILABLE: 'Esta habilidade não está disponível para o personagem equipado.',
    ABILITY_NOT_READY: 'Esta habilidade ainda não pode ser usada neste momento.',
    ABILITY_ALREADY_USED: 'Esta habilidade já foi usada no limite permitido.',
    INVALID_ABILITY_INPUT: 'Dados da habilidade inválidos.',
    INVALID_ANSWER: 'Escolha uma alternativa válida para cada sinal.',
  };
  const code = Object.keys(messages).find(key => error.message?.includes(key));
  if (code) return response.status(409).json({ error: messages[code], code });
  console.error('Falha na habilidade:', error.code);
  return response.status(500).json({ error: 'Não foi possível usar a habilidade. Tente novamente.', code: 'ABILITY_FAILED' });
}

router.get('/', asyncHandler(async (request, response) => {
  const { supabase } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase.rpc('lumi_ability_state');
  return send(response, data, error);
}));

router.post('/use', asyncHandler(async (request, response) => {
  const { abilityId, scope, context = {} } = request.body || {};
  if (!abilities.has(abilityId) || typeof scope !== 'string' || !/^[a-z0-9:-]{1,100}$/.test(scope)
    || !context || typeof context !== 'object' || Array.isArray(context)) {
    return response.status(422).json({ error: 'Dados da habilidade inválidos.', code: 'INVALID_ABILITY_INPUT' });
  }
  const { supabase } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase.rpc('lumi_ability_use', { p_ability: abilityId, p_scope: scope, p_context: context });
  return send(response, data, error);
}));

router.post('/review', asyncHandler(async (request, response) => {
  const { abilityId, scope, answers = null } = request.body || {};
  if (!reviews.has(abilityId) || typeof scope !== 'string' || !/^[a-z0-9:-]{1,100}$/.test(scope)
    || (answers !== null && (!Array.isArray(answers) || answers.length > 5 || answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer > 3)))) {
    return response.status(422).json({ error: 'Dados da revisão inválidos.', code: 'INVALID_ABILITY_INPUT' });
  }
  const { supabase } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase.rpc('lumi_ability_review', { p_ability: abilityId, p_scope: scope, p_answers: answers });
  return send(response, data, error);
}));

export default router;
