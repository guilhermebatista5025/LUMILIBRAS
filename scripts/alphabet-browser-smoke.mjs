import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import WebSocket from "ws";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = await mkdtemp(path.join(tmpdir(), "lumilibras-alfabeto-"));
const port = 9338;
const vite = spawn(process.execPath, [path.resolve("node_modules/vite/bin/vite.js"), "--host", "127.0.0.1"], { stdio: "ignore" });
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

for (let tentativa = 0; tentativa < 40; tentativa += 1) {
  try {
    const response = await fetch("http://127.0.0.1:5173/alfabeto");
    if (response.ok) break;
  } catch {}
  if (tentativa === 39) throw new Error("O Vite não iniciou para o teste do alfabeto.");
  await delay(250);
}
const browser = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream",
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "http://127.0.0.1:5173/alfabeto",
], { stdio: "ignore" });

async function obterPagina() {
  for (let tentativa = 0; tentativa < 40; tentativa += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) return (await response.json()).find(item => item.type === "page");
    } catch {}
    await delay(250);
  }
  throw new Error("Chrome não abriu a porta de depuração.");
}

try {
  const page = await obterPagina();
  if (!page) throw new Error("A página da missão não foi encontrada.");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
  let nextId = 0;
  const pending = new Map();
  socket.on("message", raw => {
    const message = JSON.parse(raw.toString());
    if (!message.id || !pending.has(message.id)) return;
    const handlers = pending.get(message.id);
    pending.delete(message.id);
    message.error ? handlers.reject(new Error(message.error.message)) : handlers.resolve(message.result);
  });
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await command("Runtime.enable");
  await delay(2000);
  await command("Runtime.evaluate", { expression: "document.querySelector('.missao-alfabeto__pratica aside>button').click()" });
  await delay(30000);
  const state = await command("Runtime.evaluate", {
    expression: `({ text: document.body.innerText, video: document.querySelector('video')?.readyState, leitura: !!document.querySelector('.missao-alfabeto__leitura') })`,
    returnByValue: true,
  });
  const value = state.result.value;
  if (!value.text.includes("Complete a missão letra por letra")) throw new Error("A missão não renderizou.");
  if (value.text.includes("Não foi possível") || value.text.includes("demorou demais")) throw new Error(value.text.slice(-500));
  if (!value.leitura || value.video < 2) throw new Error(`Câmera, detector ou modelo não ficaram prontos (video=${value.video}, leitura=${value.leitura}). ${value.text.slice(-500)}`);
  console.log("Missão do alfabeto pronta: câmera, MediaPipe e TensorFlow.js carregados.");
  socket.close();
} finally {
  browser.kill();
  vite.kill();
  await delay(500);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

