import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, test } from "node:test";

// Exercita a entrada publicada, sem credenciais ou chamadas ao Supabase.
process.env.NODE_ENV = "production";
process.env.VERCEL = "1";
process.env.CLIENT_ORIGIN = "https://app.example.com";
process.env.VERCEL_URL = "preview-test.vercel.app";
process.env.VERCEL_PROJECT_PRODUCTION_URL = "production-test.vercel.app";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_PUBLISHABLE_KEY = "";
process.env.SUPABASE_ANON_KEY = "";
delete process.env.TRUST_PROXY;

const { default: app } = await import("../api/index.js");
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test("entrada Vercel atende health e status sem expor credenciais", async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");
  const status = await fetch(`${baseUrl}/api/auth/status`);
  assert.equal(status.status, 200);
  assert.equal((await status.json()).configured, false);
});

test("consulta de sessão sem cookie retorna visitante sem erro e sem cache", async () => {
  const response = await fetch(`${baseUrl}/api/auth/session`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { user: null });
});

test("perfil e progresso continuam exigindo autenticação", async () => {
  for (const [path, options] of [
    ["/api/profile", {}],
    ["/api/game", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "visit" }) }],
  ]) {
    const response = await fetch(`${baseUrl}${path}`, options);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, "UNAUTHENTICATED");
  }
});

test("renovação sem cookie continua retornando erro de autenticação", async () => {
  const response = await fetch(`${baseUrl}/api/auth/refresh`, { method: "POST" });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).code, "INVALID_REFRESH_TOKEN");
});

test("login chega ao Express nas origens configurada, produção e preview", async () => {
  for (const origin of [process.env.CLIENT_ORIGIN, `https://${process.env.VERCEL_URL}`, `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST", headers: { origin, "content-type": "application/json" }, body: "{}",
    });
    assert.equal(response.status, 422);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
    assert.equal((await response.json()).code, "INVALID_CREDENTIALS");
  }
});

test("origens externas e subdomínios semelhantes continuam bloqueados", async () => {
  for (const origin of ["https://other.vercel.app", "https://preview-test.vercel.app.example.com", "http://localhost:5173"]) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST", headers: { origin, "content-type": "application/json" }, body: "{}",
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    assert.equal((await response.json()).code, "INVALID_ORIGIN");
  }
});

test("rota de API inexistente permanece 404 JSON", async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).path, "/api/not-a-route");
});
