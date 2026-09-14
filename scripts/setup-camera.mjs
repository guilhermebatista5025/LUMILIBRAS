import { copyFile, mkdir, readFile, readdir, stat, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Gera apenas assets públicos de terceiros. Nenhuma imagem da câmera sai do app.
const destino = new URL('../public/vision/runtime/', import.meta.url);
const origem = new URL('../node_modules/@mediapipe/tasks-vision/', import.meta.url);
const modeloUrl = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
await mkdir(new URL('wasm/', destino), { recursive: true });
await copyFile(new URL('vision_bundle.js', origem), new URL('vision_bundle.js', destino));
for (const arquivo of await readdir(new URL('wasm/', origem))) {
  if (/\.(js|wasm)$/.test(arquivo)) await copyFile(new URL('wasm/' + arquivo, origem), new URL('wasm/' + arquivo, destino));
}
const modelo = new URL('hand_landmarker.task', destino);
const existente = await stat(modelo).catch(() => null);
if (!existente || existente.size < 1_000_000) {
  console.log('Baixando modelo oficial de pontos das mãos (Google MediaPipe)…');
  const response = await fetch(modeloUrl, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Não foi possível baixar o modelo: HTTP ${response.status}. Execute npm run setup:camera com acesso à internet.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1_000_000) throw new Error('Download do modelo incompleto.');
  const temporario = new URL('hand_landmarker.task.download', destino);
  await writeFile(temporario, bytes);
  await rename(temporario, modelo);
}
console.log('MediaPipe preparado localmente. SHA-256:', createHash('sha256').update(await readFile(modelo)).digest('hex'));
