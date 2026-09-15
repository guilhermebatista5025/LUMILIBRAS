import { apiRequest } from "./api.js";

export const profileApi = {
  salvarFoto(imagem) {
    return apiRequest('/profile/avatar', { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: imagem });
  },
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
