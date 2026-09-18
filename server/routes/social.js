import { Router } from 'express';
import { createAuthenticatedSupabase } from '../lib/authenticated-supabase.js';
import { asyncHandler } from '../lib/async-handler.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false }));
const booleanFields = ['notifications_enabled', 'streak_reminders', 'new_friends', 'gifts', 'friend_achievements', 'app_updates', 'store_offers'];
const regions = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);
const defaults = { region: null, notifications_enabled: false, study_time: '19:00', streak_reminders: true, new_friends: true, gifts: true, friend_achievements: false, app_updates: true, store_offers: false };

function fail(response, error) {
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code)) return response.status(503).json({ error: 'Instale a migração social no Supabase para usar esta função.', code: 'SOCIAL_SCHEMA_MISSING' });
  console.error('Falha na integração social:', error.code, error.message);
  return response.status(500).json({ error: 'Não foi possível carregar os dados. Tente novamente.', code: 'SOCIAL_ERROR' });
}

router.get('/settings', asyncHandler(async (request, response) => {
  const { supabase, user } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase.from('lumi_social_settings').select('region,notifications_enabled,study_time,streak_reminders,new_friends,gifts,friend_achievements,app_updates,store_offers').eq('user_id', user.id).maybeSingle();
  if (error) return fail(response, error);
  response.json({ settings: { ...defaults, ...data, study_time: data?.study_time?.slice(0, 5) || defaults.study_time } });
}));

router.put('/settings', asyncHandler(async (request, response) => {
  const body = request.body ?? {};
  const keys = Object.keys(body);
  if (!keys.length || keys.some(key => ![...booleanFields, 'study_time', 'region'].includes(key)) || booleanFields.some(key => key in body && typeof body[key] !== 'boolean') || ('study_time' in body && !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.study_time)) || ('region' in body && body.region !== null && !regions.has(body.region))) {
    return response.status(422).json({ error: 'Preferências inválidas.', code: 'INVALID_SOCIAL_SETTINGS' });
  }
  const { supabase, user } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase.from('lumi_social_settings').upsert({ user_id: user.id, ...body }, { onConflict: 'user_id' }).select('region,notifications_enabled,study_time,streak_reminders,new_friends,gifts,friend_achievements,app_updates,store_offers').single();
  if (error) return fail(response, error);
  response.json({ settings: { ...defaults, ...data, study_time: data.study_time.slice(0, 5) } });
}));

router.get('/friends', asyncHandler(async (request, response) => {
  const { supabase } = await createAuthenticatedSupabase(request, response);
  const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
  if (query.length > 80) return response.status(422).json({ error: 'Busca muito longa.', code: 'INVALID_QUERY' });
  const { data, error } = await supabase.rpc('lumi_find_friends', { p_query: query });
  if (error) return fail(response, error);
  response.json({ people: data });
}));

router.post('/friends/:id', asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { action } = request.body ?? {};
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !['request', 'accept', 'remove'].includes(action)) return response.status(422).json({ error: 'Ação inválida.', code: 'INVALID_FRIEND_ACTION' });
  const { supabase } = await createAuthenticatedSupabase(request, response);
  const { error } = await supabase.rpc('lumi_friend_action', { p_user: id, p_action: action });
  if (error?.message?.includes('ACCEPT_INCOMING_REQUEST')) return response.status(409).json({ error: 'Aceite o convite recebido.', code: 'ACCEPT_INCOMING_REQUEST' });
  if (error?.message?.includes('REQUEST_NOT_FOUND')) return response.status(404).json({ error: 'Convite não encontrado.', code: 'REQUEST_NOT_FOUND' });
  if (error) return fail(response, error);
  response.json({ ok: true });
}));

router.get('/ranking', asyncHandler(async (request, response) => {
  const scope = request.query.scope;
  if (!['friends', 'regional'].includes(scope)) return response.status(422).json({ error: 'Filtro inválido.', code: 'INVALID_RANKING_SCOPE' });
  const { supabase } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase.rpc('lumi_social_ranking', { p_scope: scope });
  if (error) return fail(response, error);
  response.json({ ranking: data });
}));

export default router;
