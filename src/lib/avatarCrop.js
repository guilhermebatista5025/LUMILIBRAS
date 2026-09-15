export function recorteFoto(largura, altura, zoom, centro = { x: .5, y: .5 }) {
  const escala = Math.max(1, Math.min(4, Number(zoom) || 1));
  const lado = Math.min(largura, altura) / escala;
  const x = Math.max(0, Math.min(largura - lado, centro.x * largura - lado / 2));
  const y = Math.max(0, Math.min(altura - lado, centro.y * altura - lado / 2));
  return { x, y, lado, centro: { x: (x + lado / 2) / largura, y: (y + lado / 2) / altura } };
}

export async function carregarFoto(arquivo) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) throw new Error('Escolha uma foto JPG, PNG ou WebP.');
  if (arquivo.size > 10 * 1024 * 1024) throw new Error('Escolha uma imagem de até 10 MB.');
  const url = URL.createObjectURL(arquivo);
  try {
    const imagem = new Image();
    imagem.src = url;
    await imagem.decode();
    if (!imagem.naturalWidth || imagem.naturalWidth * imagem.naturalHeight > 40_000_000) throw new Error('A resolução desta imagem é muito grande. Escolha uma foto menor.');
    const escala = Math.min(1, 2048 / Math.max(imagem.naturalWidth, imagem.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(imagem.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(imagem.naturalHeight * escala));
    canvas.getContext('2d').drawImage(imagem, 0, 0, canvas.width, canvas.height);
    return canvas;
  } catch (error) {
    if (error.name === 'EncodingError') throw new Error('Não foi possível abrir esta imagem. Escolha outra foto.');
    throw error;
  } finally { URL.revokeObjectURL(url); }
}

export function girarFoto(imagem, giro) {
  const canvas = document.createElement('canvas');
  canvas.width = giro % 2 ? imagem.height : imagem.width;
  canvas.height = giro % 2 ? imagem.width : imagem.height;
  const contexto = canvas.getContext('2d');
  contexto.translate(canvas.width / 2, canvas.height / 2);
  contexto.rotate(giro * Math.PI / 2);
  contexto.drawImage(imagem, -imagem.width / 2, -imagem.height / 2);
  return canvas;
}

export function desenharRecorte(canvas, imagem, recorte) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imagem, recorte.x, recorte.y, recorte.lado, recorte.lado, 0, 0, canvas.width, canvas.height);
}

export async function exportarFoto(imagem, recorte) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  desenharRecorte(canvas, imagem, recorte);
  const arquivo = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!arquivo) throw new Error('Não foi possível preparar o recorte. Tente outra foto.');
  return arquivo;
}
