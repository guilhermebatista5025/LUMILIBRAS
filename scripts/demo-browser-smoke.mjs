import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import WebSocket from "ws";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = await mkdtemp(path.join(tmpdir(), "lumilibras-demo-"));
const port = 9337;
const browser = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--use-fake-device-for-media-stream",
  "--use-fake-ui-for-media-stream",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "http://127.0.0.1:5173/reconhecimento",
], { stdio: "ignore" });

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function pages() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) return response.json();
    } catch {}
    await delay(250);
  }
  throw new Error("Chrome não abriu a porta de depuração.");
}
try {
  const page = (await pages()).find(item => item.type === "page");
  if (!page) throw new Error("A página do protótipo não foi encontrada.");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
  });
  let nextId = 0;
  const pending = new Map();
  socket.on("message", raw => {
    const message = JSON.parse(raw.toString());
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  function command(method, params = {}) {
    const id = ++nextId;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }
  await command("Runtime.enable");
  await delay(16000);
  const state = await command("Runtime.evaluate", {
    expression: `({
      text: document.body.innerText,
      actionDisabled: document.querySelector('.demo-video__acao')?.disabled,
      actionLabel: document.querySelector('.demo-video__acao')?.innerText
    })`,
    returnByValue: true,
  });
  const value = state.result.value;
  if (!value.text.includes("Vídeo de referência") || !value.text.includes("Sua tentativa")) {
    throw new Error("A tela oficial não renderizou os dois painéis.");
  }
  if (value.text.includes("Não foi possível iniciar a análise")) {
    throw new Error("O MediaPipe não iniciou no navegador.");
  }
  if (value.actionDisabled) {
    throw new Error(`A referência não ficou pronta. Estado visível: ${value.text.slice(-500)}`);
  }
  console.log(`Demo pronta no navegador: botão “${value.actionLabel.trim()}” habilitado.`);
  socket.close();
} finally {
  browser.kill();
  await delay(500);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
