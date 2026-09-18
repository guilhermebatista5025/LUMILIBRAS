import { Camera, Play } from "lucide-react";
import { VIDEOS_SAUDE } from "../../data/cursos.js";
import "./CameraGestoTemporal.css";

function normalizar(texto) {
  return texto?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
export function CameraGestoTemporal({ termo }) {
  const video = VIDEOS_SAUDE.find(item => normalizar(item.titulo) === normalizar(termo));
  const parametros = new URLSearchParams();
  if (video) parametros.set("sinal", video.titulo);

  function abrirReconhecimento() {
    window.open(`/reconhecimento?${parametros}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="camera-temporal" aria-labelledby="camera-temporal-titulo">
      <span className="camera-temporal__icone" aria-hidden="true"><Camera /></span>
      <div>
        <p>Reconhecimento por vídeo • versão beta</p>
        <h2 id="camera-temporal-titulo">Pratique o movimento completo</h2>
        <span>{video ? `Compare sua execução com o vídeo de “${video.titulo}”.` : "Abra o laboratório e escolha um dos sinais disponíveis."}</span>
      </div>
      <button type="button" onClick={abrirReconhecimento}><Play aria-hidden="true" /> Abrir câmera</button>
    </section>
  );
}
