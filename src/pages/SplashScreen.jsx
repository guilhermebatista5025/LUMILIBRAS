import { useEffect, useRef } from "react";
import "./SplashScreen.css";

const VIDEO_ABERTURA = "/videos/abertura-lumilibras.webm";

export function SplashScreen({ aoConcluir, duracao = 15000 }) {
  const videoRef = useRef(null);
  const concluirRef = useRef(aoConcluir);
  const concluidaRef = useRef(false);

  useEffect(() => { concluirRef.current = aoConcluir; }, [aoConcluir]);

  function concluir() {
    if (concluidaRef.current) return;
    concluidaRef.current = true;
    concluirRef.current?.();
  }

  useEffect(() => {
    // Evita deixar a abertura presa se o navegador não conseguir reproduzir o vídeo.
    const temporizador = window.setTimeout(concluir, duracao);
    return () => window.clearTimeout(temporizador);
  }, [duracao]);

  return (
    <main className="splash-video" aria-label="Abertura da LumiLibras">
      <video
        ref={videoRef}
        className="splash-video__midia"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onEnded={concluir}
        onError={concluir}
      >
        <source src={VIDEO_ABERTURA} type="video/webm" />
      </video>
      <button type="button" className="splash-video__pular" onClick={concluir}>
        Pular abertura
      </button>
    </main>
  );
}
