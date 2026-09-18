import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Play, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { VIDEOS_SAUDE } from "../data/cursos.js";
import { compararSequencias, coberturaDasMaos } from "../lib/temporalGesture.js";
import "./DemoReconhecimentoVideo.css";

const TOTAL_QUADROS = 28;

function esperar(video, evento) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      video.removeEventListener(evento, concluir);
      reject(new Error(`Tempo esgotado ao carregar o vídeo (${evento}).`));
    }, 10000);
    function concluir() {
      window.clearTimeout(timeout);
      resolve();
    }
    video.addEventListener(evento, concluir, { once: true });
  });
}

async function posicionar(video, tempo) {
  if (Math.abs(video.currentTime - tempo) < 0.015) return;
  const pronto = esperar(video, "seeked");
  video.currentTime = tempo;
  await pronto;
}

function textoEstado(estado, alvo) {
  if (estado === "carregando") return "Preparando o detector local…";
  if (estado === "referencia") return `Aprendendo o movimento de “${alvo}”…`;
  if (estado === "pronto") return "Referência pronta. Agora faça o sinal pela câmera.";
  if (estado === "contagem") return "Posicione mãos e braços dentro da câmera.";
  if (estado === "capturando") return "Analisando o movimento completo…";
  return "Escolha um sinal e faça uma tentativa.";
}

export function DemoReconhecimentoVideo() {
  const [selecionado, setSelecionado] = useState(() => {
    const sinal = new URLSearchParams(window.location.search).get("sinal");
    return VIDEOS_SAUDE.find(video => video.titulo === sinal) || VIDEOS_SAUDE[1];
  });
  const [estado, setEstado] = useState("carregando");
  const [progresso, setProgresso] = useState(0);
  const [contagem, setContagem] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [cobertura, setCobertura] = useState(0);
  const referenciaVideoRef = useRef(null);
  const cameraRef = useRef(null);
  const workerRef = useRef(null);
  const streamRef = useRef(null);
  const pendentesRef = useRef(new Map());
  const referenciaRef = useRef([]);
  const requisicaoRef = useRef(0);
  const geracaoRef = useRef(0);

  const detectar = useCallback(async elemento => {
    const worker = workerRef.current;
    if (!worker) throw new Error("Detector indisponível.");
    const frame = await createImageBitmap(elemento);
    const requestId = ++requisicaoRef.current;
    return new Promise((resolve, reject) => {
      pendentesRef.current.set(requestId, { resolve, reject });
      worker.postMessage({ type: "detect", requestId, frame }, [frame]);
    });
  }, []);

  useEffect(() => {
    const worker = new Worker("/camera/video-sequence-worker.js");
    workerRef.current = worker;
    worker.onmessage = ({ data }) => {
      if (data.type === "ready") {
        setEstado("ocioso");
        return;
      }
      if (data.type === "fatal") {
        setErro(`Não foi possível iniciar a análise: ${data.message}`);
        setEstado("erro");
        return;
      }
      const pendente = pendentesRef.current.get(data.requestId);
      if (!pendente) return;
      pendentesRef.current.delete(data.requestId);
      if (data.type === "request-error") pendente.reject(new Error(data.message));
      else pendente.resolve({ landmarks: data.landmarks || [], handedness: data.handedness || [] });
    };
    worker.postMessage({ type: "init" });
    return () => {
      geracaoRef.current += 1;
      for (const { reject } of pendentesRef.current.values()) reject(new Error("Análise interrompida."));
      pendentesRef.current.clear();
      worker.terminate();
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const prepararReferencia = useCallback(async () => {
    const video = referenciaVideoRef.current;
    if (!video || !workerRef.current) return;
    const geracao = ++geracaoRef.current;
    setEstado("referencia");
    setErro("");
    setResultado(null);
    setProgresso(0);
    try {
      if (video.readyState < 2) await esperar(video, "loadeddata");
      video.pause();
      const inicio = Math.min(video.duration * 0.08, 0.2);
      const fim = Math.max(inicio, video.duration * 0.92);
      const quadros = [];
      for (let indice = 0; indice < TOTAL_QUADROS; indice += 1) {
        if (geracao !== geracaoRef.current) return;
        const tempo = inicio + ((fim - inicio) * indice) / (TOTAL_QUADROS - 1);
        await posicionar(video, tempo);
        quadros.push(await detectar(video));
        setProgresso(Math.round(((indice + 1) / TOTAL_QUADROS) * 100));
      }
      referenciaRef.current = quadros;
      const coberturaAtual = coberturaDasMaos(quadros);
      setCobertura(Math.round(coberturaAtual * 100));
      if (coberturaAtual < 0.45) throw new Error("As mãos não ficaram visíveis o suficiente no vídeo de referência.");
      await posicionar(video, 0);
      setEstado("pronto");
    } catch (error) {
      if (geracao !== geracaoRef.current) return;
      setErro(error.message || "Não foi possível analisar o vídeo de referência.");
      setEstado("erro");
    }
  }, [detectar]);

  useEffect(() => {
    if (estado !== "ocioso") return;
    prepararReferencia();
  }, [estado, prepararReferencia, selecionado]);

  function trocarSinal(evento) {
    const proximo = VIDEOS_SAUDE.find(video => video.arquivo === evento.target.value);
    geracaoRef.current += 1;
    referenciaRef.current = [];
    setSelecionado(proximo);
    setResultado(null);
    setEstado("ocioso");
  }

  async function iniciarCamera() {
    if (!streamRef.current) {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      cameraRef.current.srcObject = streamRef.current;
      await cameraRef.current.play();
    }
  }

  async function tentar() {
    if (!referenciaRef.current.length || estado === "capturando") return;
    setErro("");
    setResultado(null);
    try {
      await iniciarCamera();
      setEstado("contagem");
      for (let numero = 3; numero >= 1; numero -= 1) {
        setContagem(numero);
        await new Promise(resolve => window.setTimeout(resolve, 700));
      }
      setContagem(null);
      setEstado("capturando");
      setProgresso(0);
      const tentativa = [];
      for (let indice = 0; indice < TOTAL_QUADROS; indice += 1) {
        tentativa.push(await detectar(cameraRef.current));
        setProgresso(Math.round(((indice + 1) / TOTAL_QUADROS) * 100));
        await new Promise(resolve => window.setTimeout(resolve, 75));
      }
      setResultado(compararSequencias(referenciaRef.current, tentativa));
      setEstado("pronto");
    } catch (error) {
      setErro(error.name === "NotAllowedError" ? "Autorize a câmera para executar a demonstração." : error.message);
      setEstado("pronto");
    }
  }

  const ocupado = ["carregando", "referencia", "contagem", "capturando"].includes(estado);

  return (
    <main className="demo-video">
      <header className="demo-video__cabecalho">
        <LogoLumiLibras tamanho="sm" />
        <span><Sparkles aria-hidden="true" /> Protótipo de reconhecimento temporal</span>
      </header>

      <section className="demo-video__intro">
        <div>
          <p className="demo-video__sobretitulo">Demonstração técnica • processamento local</p>
          <h1>O movimento inteiro também faz parte do sinal.</h1>
          <p>O protótipo aprende uma sequência do vídeo e compara com a tentativa feita pela câmera — sem enviar imagens para um servidor.</p>
        </div>
        <div className="demo-video__privacidade"><ShieldCheck aria-hidden="true" /><strong>Câmera privada</strong><span>Os quadros ficam neste dispositivo.</span></div>
      </section>

      <section className="demo-video__seletor">
        <label htmlFor="demo-sinal">Sinal da atividade</label>
        <select id="demo-sinal" value={selecionado.arquivo} onChange={trocarSinal} disabled={ocupado}>
          {VIDEOS_SAUDE.map(video => <option value={video.arquivo} key={video.arquivo}>{video.titulo}</option>)}
        </select>
        <span>{cobertura ? `${cobertura}% dos quadros de referência com mãos detectadas` : "A referência será preparada automaticamente"}</span>
      </section>

      <section className="demo-video__palcos">
        <article className="demo-video__painel">
          <div className="demo-video__painel-topo"><span>1</span><div><small>Observe</small><h2>Vídeo de referência</h2></div></div>
          <div className="demo-video__midia">
            <video ref={referenciaVideoRef} key={selecionado.arquivo} src={`/videos/${encodeURIComponent(selecionado.arquivo)}`} controls loop playsInline preload="auto" />
            {estado === "referencia" && <div className="demo-video__processando"><RefreshCw aria-hidden="true" /><strong>{progresso}%</strong><span>Mapeando a sequência</span></div>}
          </div>
          <p>Assista e repare na trajetória, configuração e orientação das mãos.</p>
        </article>

        <article className="demo-video__painel demo-video__painel--camera">
          <div className="demo-video__painel-topo"><span>2</span><div><small>Pratique</small><h2>Sua tentativa</h2></div></div>
          <div className="demo-video__midia">
            <video ref={cameraRef} muted playsInline aria-label="Imagem da câmera ao vivo" />
            {!streamRef.current && <div className="demo-video__camera-vazia"><Camera aria-hidden="true" /><span>A câmera abre ao iniciar</span></div>}
            {contagem && <div className="demo-video__contagem" aria-live="assertive">{contagem}</div>}
            {estado === "capturando" && <div className="demo-video__gravando"><i /> analisando <strong>{progresso}%</strong></div>}
          </div>
          <button type="button" className="demo-video__acao" onClick={tentar} disabled={estado !== "pronto"}>
            {resultado ? <RefreshCw aria-hidden="true" /> : <Play aria-hidden="true" />}
            {resultado ? "Tentar novamente" : "Fazer o sinal"}
          </button>
        </article>
      </section>

      <section className={`demo-video__resultado ${resultado ? "demo-video__resultado--visivel" : ""}`} aria-live="polite">
        {resultado ? <>
          <div className="demo-video__nota"><strong>{resultado.percentual}%</strong><span>semelhança temporal</span></div>
          <div><h2>{resultado.percentual >= 60 ? <><CheckCircle2 aria-hidden="true" /> Movimento reconhecido</> : <><AlertTriangle aria-hidden="true" /> Vamos tentar outra vez</>}</h2><p>{resultado.motivo || (resultado.percentual >= 60 ? `A sequência ficou parecida com “${selecionado.titulo}”.` : "Observe novamente a direção e o tempo do movimento.")}</p></div>
        </> : <><div className="demo-video__resultado-icone"><Sparkles aria-hidden="true" /></div><div><h2>{textoEstado(estado, selecionado.titulo)}</h2><p>Esta é uma prova de conceito. O modelo treinado com várias pessoas será a próxima evolução.</p></div></>}
      </section>

      {erro && <p className="demo-video__erro" role="alert"><AlertTriangle aria-hidden="true" />{erro}<button type="button" onClick={() => { setEstado("ocioso"); setErro(""); }}>Tentar preparar novamente</button></p>}
      <footer className="demo-video__rodape">LUMILIBRAS • Reconhecimento de sinais isolados em vídeo • versão demonstrativa</footer>
    </main>
  );
}
