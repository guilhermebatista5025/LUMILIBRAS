import { createSupabaseAuthClient } from "../config/supabase.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "./auth-cookies.js";

function unauthenticatedError() {
  const error = new Error("Sessão não autenticada.");
  error.status = 401;
  error.code = "UNAUTHENTICATED";
  return error;
}

export async function createAuthenticatedSupabase(request, response) {
  const accessToken = request.cookies[ACCESS_TOKEN_COOKIE];
  const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];

  if (!accessToken || !refreshToken) throw unauthenticatedError();

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user) {
    clearAuthCookies(response);
    throw unauthenticatedError();
  }

  setAuthCookies(response, data.session);
  return { supabase, user: data.user };
}
