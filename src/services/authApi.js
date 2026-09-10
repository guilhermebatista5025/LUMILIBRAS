import { apiRequest } from "./api.js";

export const authApi = {
  status() {
    return apiRequest("/auth/status");
  },

  cadastrar(dados) {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  },

  entrar(credenciais) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credenciais),
    });
  },

  sessao() {
    return apiRequest("/auth/session");
  },

  renovarSessao() {
    return apiRequest("/auth/refresh", { method: "POST" });
  },

  sair() {
    return apiRequest("/auth/logout", { method: "POST" });
  },
};
