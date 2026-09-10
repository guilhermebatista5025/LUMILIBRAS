import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

function getSupabaseKey() {
  return process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && getSupabaseKey());
}

export function createSupabaseAuthClient() {
  if (!isSupabaseConfigured()) {
    const error = new Error(
      "Supabase ainda não foi configurado. Preencha SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no arquivo .env.",
    );
    error.status = 503;
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }

  return createClient(process.env.SUPABASE_URL, getSupabaseKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    // O SDK inicializa o cliente Realtime junto ao de Auth. Node 20 não
    // disponibiliza WebSocket nativamente, por isso fornecemos o transporte.
    realtime: {
      transport: WebSocket,
    },
  });
}
