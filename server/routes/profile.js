import { Router } from "express";
import { createAuthenticatedSupabase } from "../lib/authenticated-supabase.js";
import { asyncHandler } from "../lib/async-handler.js";
import avatarRouter, { avatarUrl } from './avatar.js';

const router = Router();
router.use('/avatar', avatarRouter);

const LIBRAS_LEVELS = new Set([
  "nunca_estudei",
  "alguns_sinais",
  "basico",
  "intermediario",
]);
const LEARNING_GOALS = new Set([
  "familia",
  "trabalho",
  "escola",
  "inclusao",
  "curiosidade",
  "desenvolvimento_pessoal",
]);
const DAILY_GOALS = new Set([5, 10, 15, 20]);

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function publicProfile(profile) {
  return {
    id: profile.id,
    nome: profile.display_name,
    fotoUrl: avatarUrl(profile.id),
    nivelLibras: profile.libras_level,
    objetivos: profile.learning_goals,
    metaDiaria: profile.daily_goal_minutes,
    onboardingConcluido: Boolean(profile.onboarding_completed_at),
    onboardingConcluidoEm: profile.onboarding_completed_at,
    criadoEm: profile.created_at,
    atualizadoEm: profile.updated_at,
  };
}

function validateProfileInput(body) {
  const updates = {};

  if (Object.hasOwn(body, "nome")) {
    const nome = typeof body.nome === "string" ? body.nome.trim() : "";
    if (nome.length < 2 || nome.length > 80) {
      throw httpError(422, "Informe um nome entre 2 e 80 caracteres.", "INVALID_NAME");
    }
    updates.display_name = nome;
  }

  if (Object.hasOwn(body, "nivelLibras")) {
    const nivel = body.nivelLibras;
    if (nivel !== null && !LIBRAS_LEVELS.has(nivel)) {
      throw httpError(422, "Informe um nível de Libras válido.", "INVALID_LIBRAS_LEVEL");
    }
    updates.libras_level = nivel;
  }

  if (Object.hasOwn(body, "objetivos")) {
    const objetivos = body.objetivos;
    const objetivosValidos = Array.isArray(objetivos)
      && objetivos.length <= LEARNING_GOALS.size
      && new Set(objetivos).size === objetivos.length
      && objetivos.every((objetivo) => LEARNING_GOALS.has(objetivo));

    if (!objetivosValidos) {
      throw httpError(422, "Informe objetivos de aprendizado válidos.", "INVALID_LEARNING_GOALS");
    }
    updates.learning_goals = objetivos;
  }

  if (Object.hasOwn(body, "metaDiaria")) {
    if (!DAILY_GOALS.has(body.metaDiaria)) {
      throw httpError(422, "Informe uma meta diária válida.", "INVALID_DAILY_GOAL");
    }
    updates.daily_goal_minutes = body.metaDiaria;
  }

  if (body.concluirOnboarding === true) {
    const hasLevel = Object.hasOwn(updates, "libras_level");
    const hasGoals = Object.hasOwn(updates, "learning_goals");
    const hasDailyGoal = Object.hasOwn(updates, "daily_goal_minutes");

    if (!hasLevel || !hasGoals || !hasDailyGoal) {
      throw httpError(422, "Envie todas as preferências para concluir o onboarding.", "INCOMPLETE_ONBOARDING");
    }
    updates.onboarding_completed_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    throw httpError(422, "Nenhum dado de perfil foi informado.", "EMPTY_PROFILE_UPDATE");
  }

  return updates;
}

async function selectOwnProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, libras_level, learning_goals, daily_goal_minutes, onboarding_completed_at, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Falha ao carregar perfil no Supabase:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw httpError(500, "Não foi possível carregar o perfil.", "PROFILE_READ_FAILED");
  }

  return data;
}

router.get("/", asyncHandler(async (request, response) => {
  const { supabase, user } = await createAuthenticatedSupabase(request, response);
  const profile = await selectOwnProfile(supabase, user.id);
  response.json({ profile: publicProfile(profile) });
}));

router.patch("/", asyncHandler(async (request, response) => {
  const updates = validateProfileInput(request.body ?? {});
  const { supabase, user } = await createAuthenticatedSupabase(request, response);
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id, display_name, libras_level, learning_goals, daily_goal_minutes, onboarding_completed_at, created_at, updated_at")
    .single();

  if (error) {
    console.error("Falha ao atualizar perfil no Supabase:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw httpError(500, "Não foi possível salvar o perfil.", "PROFILE_UPDATE_FAILED");
  }

  response.json({
    message: "Perfil salvo com sucesso.",
    profile: publicProfile(data),
  });
}));

export default router;
