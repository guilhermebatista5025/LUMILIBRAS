import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  createSupabaseAuthClient,
  isSupabaseConfigured,
} from "../config/supabase.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "../lib/auth-cookies.js";
import { asyncHandler } from "../lib/async-handler.js";

const router = Router();

export const TERMS_VERSION = "2026-09-10-v1";
export const PRIVACY_VERSION = "2026-09-11-v2";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    code: "RATE_LIMITED",
  },
});

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    nome: user.user_metadata?.display_name || "",
    emailConfirmado: Boolean(user.email_confirmed_at),
  };
}

function validateEmail(email) {
  return typeof email === "string"
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function refreshFromCookie(request, response) {
  const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];
  if (!refreshToken) return null;

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user) {
    clearAuthCookies(response);
    return null;
  }

  setAuthCookies(response, data.session);
  return data.user;
}

router.get("/status", (_request, response) => {
  response.json({
    configured: isSupabaseConfigured(),
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
  });
});

router.post("/register", authLimiter, asyncHandler(async (request, response) => {
  const nome = typeof request.body.nome === "string" ? request.body.nome.trim() : "";
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const senha = request.body.senha;
  const aceitouTermos = request.body.aceitouTermos === true;

  if (nome.length < 2 || nome.length > 80) {
    throw httpError(422, "Informe um nome entre 2 e 80 caracteres.", "INVALID_NAME");
  }
  if (!validateEmail(email)) {
    throw httpError(422, "Informe um e-mail válido.", "INVALID_EMAIL");
  }
  if (typeof senha !== "string" || senha.length < 8 || senha.length > 128) {
    throw httpError(422, "A senha deve ter entre 8 e 128 caracteres.", "INVALID_PASSWORD");
  }
  if (!aceitouTermos) {
    throw httpError(422, "É necessário aceitar os Termos de Serviço.", "TERMS_REQUIRED");
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        display_name: nome,
        accepted_terms: true,
        terms_version: TERMS_VERSION,
        privacy_acknowledged: true,
        privacy_version: PRIVACY_VERSION,
      },
    },
  });

  if (error) {
    const rateLimited = error.status === 429;
    throw httpError(
      rateLimited ? 429 : 400,
      rateLimited
        ? "Muitas tentativas de cadastro. Aguarde e tente novamente."
        : "Não foi possível criar a conta. Verifique os dados e tente novamente.",
      rateLimited ? "RATE_LIMITED" : "SIGNUP_FAILED",
    );
  }

  if (data.session) setAuthCookies(response, data.session);

  response.status(201).json({
    message: data.session
      ? "Conta criada e sessão iniciada com sucesso."
      : "Conta criada. Confira seu e-mail para confirmar o cadastro.",
    requiresEmailConfirmation: !data.session,
    user: data.user ? publicUser(data.user) : null,
  });
}));

router.post("/login", authLimiter, asyncHandler(async (request, response) => {
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const senha = request.body.senha;

  if (!validateEmail(email) || typeof senha !== "string" || !senha) {
    throw httpError(422, "Informe e-mail e senha válidos.", "INVALID_CREDENTIALS");
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error || !data.session || !data.user) {
    throw httpError(401, "E-mail ou senha incorretos.", "INVALID_CREDENTIALS");
  }

  setAuthCookies(response, data.session);
  response.json({
    message: "Login realizado com sucesso.",
    user: publicUser(data.user),
  });
}));

router.get("/session", asyncHandler(async (request, response) => {
  response.set("Cache-Control", "no-store");
  const accessToken = request.cookies[ACCESS_TOKEN_COOKIE];
  let user = null;

  if (accessToken) {
    const supabase = createSupabaseAuthClient();
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error) user = data.user;
  }

  if (!user) user = await refreshFromCookie(request, response);

  response.json({ user: user ? publicUser(user) : null });
}));

router.post("/refresh", asyncHandler(async (request, response) => {
  const user = await refreshFromCookie(request, response);

  if (!user) {
    throw httpError(401, "Não foi possível renovar a sessão.", "INVALID_REFRESH_TOKEN");
  }

  response.json({ user: publicUser(user) });
}));

router.post("/logout", asyncHandler(async (request, response) => {
  const accessToken = request.cookies[ACCESS_TOKEN_COOKIE];
  const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];

  if (accessToken && refreshToken && isSupabaseConfigured()) {
    const supabase = createSupabaseAuthClient();
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) await supabase.auth.signOut({ scope: "local" });
  }

  clearAuthCookies(response);
  response.status(204).end();
}));

export default router;
