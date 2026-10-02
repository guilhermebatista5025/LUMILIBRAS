import { copyFile, mkdir, readFile, readdir, stat, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Prepara os assets oficiais do MediaPipe. A câmera permanece local no navegador.
const destino = new URL('../src/assets/public/camera/runtime/', import.meta.url);
const origem = new URL('../node_modules/@mediapipe/tasks-vision/', import.meta.url);
const modelos = [
  ['hand_landmarker.task', 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'],
  ['face_landmarker.task', 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'],
  ['pose_landmarker_lite.task', 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'],
];

await mkdir(new URL('wasm/', destino), { recursive: true });
await copyFile(new URL('vision_bundle.js', origem), new URL('vision_bundle.js', destino));
for (const arquivo of await readdir(new URL('wasm/', origem))) {
  if (/\.(js|wasm)$/.test(arquivo)) await copyFile(new URL('wasm/' + arquivo, origem), new URL('wasm/' + arquivo, destino));
}

for (const [nome, modeloUrl] of modelos) {
  const modelo = new URL(nome, destino);
  const existente = await stat(modelo).catch(() => null);
  if (!existente || existente.size < 1_000_000) {
    console.log(`Baixando modelo oficial MediaPipe: ${nome}...`);
    const response = await fetch(modeloUrl, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Não foi possível baixar ${nome}: HTTP ${response.status}. Execute npm run setup:camera com acesso à internet.`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1_000_000) throw new Error(`Download incompleto: ${nome}.`);
    const temporario = new URL(`${nome}.download`, destino);
    await writeFile(temporario, bytes);
    await rename(temporario, modelo);
  }
  console.log(`${nome} SHA-256:`, createHash('sha256').update(await readFile(modelo)).digest('hex'));
}
console.log('MediaPipe preparado localmente: mãos + rosto + pose.');
