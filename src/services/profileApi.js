import { apiRequest } from "./api.js";

export const profileApi = {
  obter() {
    return apiRequest("/profile");
  },

  atualizar(dados) {
    return apiRequest("/profile", {
      method: "PATCH",
      body: JSON.stringify(dados),
    });
  },

  concluirOnboarding(dados) {
    return apiRequest("/profile", {
      method: "PATCH",
      body: JSON.stringify({
        nivelLibras: dados.nivel || null,
        objetivos: dados.objetivos,
        metaDiaria: dados.metaDiaria,
        concluirOnboarding: true,
      }),
    });
  },
};
