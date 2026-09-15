import { Router, raw } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createAuthenticatedSupabase } from '../lib/authenticated-supabase.js';
import { asyncHandler } from '../lib/async-handler.js';
import { inflateSync } from 'node:zlib';

export const AVATAR_BUCKET = 'lumilibras-avatars';
const MAX_BYTES = 2 * 1024 * 1024;
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
export const avatarUrl = id => `/api/profile/avatar?user=${encodeURIComponent(id)}`;

export function validarAvatar(buffer) {
  const cabecalho = Buffer.isBuffer(buffer) && buffer.length >= 45 && buffer.length <= MAX_BYTES &&
    buffer.subarray(0, 8).equals(PNG) && buffer.readUInt32BE(8) === 13 &&
    buffer.toString('ascii', 12, 16) === 'IHDR' && buffer.readUInt32BE(16) === 512 &&
    buffer.readUInt32BE(20) === 512 && buffer.toString('ascii', buffer.length - 8, buffer.length - 4) === 'IEND';
  if (!cabecalho || buffer[24] !== 8 || ![2,6].includes(buffer[25]) || buffer[26] || buffer[27] || buffer[28]) return false;
  try {
    const partes = [];
    for (let pos = 8; pos < buffer.length;) {
      const tamanho = buffer.readUInt32BE(pos), fim = pos + tamanho + 12;
      if (fim > buffer.length) return false;
      if (buffer.toString('ascii', pos + 4, pos + 8) === 'IDAT') partes.push(buffer.subarray(pos + 8, fim - 4));
      pos = fim;
    }
    const linha = 512 * (buffer[25] === 6 ? 4 : 3) + 1;
    const pixels = inflateSync(Buffer.concat(partes), { maxOutputLength: linha * 512 });
    return pixels.length === linha * 512 && Array.from({ length:512 }, (_, i) => pixels[i * linha]).every(filtro => filtro <= 4);
  } catch { return false; }
}

function falhaStorage(response, error) {
  const indisponivel = error?.message?.toLowerCase().includes('bucket') || String(error?.statusCode) === '404';
  return response.status(indisponivel ? 503 : 502).json({
    code: indisponivel ? 'AVATAR_STORAGE_NOT_READY' : 'AVATAR_STORAGE_FAILED',
    error: indisponivel ? 'O envio de fotos ainda não foi habilitado. Sua foto anterior foi mantida.' : 'Não foi possível salvar a foto. Tente novamente.',
  });
}

export function createAvatarRouter(autenticar = createAuthenticatedSupabase) {
  const router = Router();
  router.use(asyncHandler(async (request, response, next) => {
    response.set('Cache-Control', 'private, no-store');
    response.locals.avatarSession = await autenticar(request, response);
    next();
  }));
  router.get('/', asyncHandler(async (_request, response) => {
    const { supabase, user } = response.locals.avatarSession;
    const { data, error } = await supabase.storage.from(AVATAR_BUCKET).download(`${user.id}/avatar.png`);
    if (error) {
      const ausente = ['404', '400'].includes(String(error.statusCode)) && /not found|does not exist/i.test(error.message || '');
      if (ausente) return response.status(204).end();
      return response.status(502).json({ code: 'AVATAR_READ_FAILED', error: 'Foto indisponível.' });
    }
    response.type('png').send(Buffer.from(await data.arrayBuffer()));
  }));
  router.put('/', rateLimit({ windowMs: 60_000, limit: 15, standardHeaders: 'draft-8', legacyHeaders: false }),
    raw({ type: 'image/png', limit: MAX_BYTES }), asyncHandler(async (request, response) => {
      if (!request.is('image/png') || !validarAvatar(request.body)) {
        return response.status(422).json({ code: 'INVALID_AVATAR', error: 'Selecione uma imagem e ajuste o recorte antes de salvar.' });
      }
      const { supabase, user } = response.locals.avatarSession;
      const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(`${user.id}/avatar.png`, request.body, {
        contentType: 'image/png', upsert: true, cacheControl: '0',
      });
      if (error) return falhaStorage(response, error);
      response.json({ fotoUrl: `${avatarUrl(user.id)}&v=${Date.now()}`, message: 'Foto salva com sucesso.' });
    }));
  router.use((error, _request, response, next) => {
    if (error.type === 'entity.too.large') return response.status(413).json({ code: 'AVATAR_TOO_LARGE', error: 'A foto ficou muito grande. Escolha outra imagem.' });
    next(error);
  });
  return router;
}

export default createAvatarRouter();
