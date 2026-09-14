import { useEffect, useRef, useState } from "react";
import { Camera, Check, CircleStop, Save, ShieldCheck, X } from "lucide-react";
import { analisarMao, normalizarMao } from "../../lib/handGeometry.js";
import "./CameraGesto.css";

const STORAGE_PREFIX = "lumilibras:gesto:v1:";
const DISTANCIA_MAXIMA = 0.32;
const META_CONCLUSAO = 90;
const ESTADOS = new Set(["Estendido", "Flexionado", "Intermediário"]);

function chave(sinalId) { return `${STORAGE_PREFIX}${sinalId}`; }

function lerModelo(sinalId) {
  try {
    const modelo = JSON.parse(localStorage.getItem(chave(sinalId)) || "null");
    return modelo && Array.isArray(modelo.maos) ? modelo : null;
  } catch { return null; }
}

function resumir(mao) {
  const dados = analisarMao(mao.landmarks, mao.worldLandmarks, 1, 1);
  return { estados: dados?.dedos.map(dedo => dedo.estado) || [], pontos: normalizarMao(mao.landmarks) || [] };
}

function comparar(modelo, atual) {
  if (!modelo || modelo.maos.length !== atual.length) return { ok: false, percentual: 0, motivo: `Mostre ${modelo?.maos.length || 1} ${modelo?.maos.length === 1 ? "mão" : "mãos"}.` };
  const notas = atual.map((mao, indice) => {
    const esperado = modelo.maos[indice];
    const resumo = resumir(mao);
    const acertos = resumo.estados.reduce((total, estado, dedo) => total + (estado === esperado.estados[dedo] && ESTADOS.has(estado) ? 1 : 0), 0);
    const estados = acertos / Math.max(1, esperado.estados.length);
    const pontos = resumo.pontos.reduce((total, ponto, pontoId) => {
      const base = esperado.pontos[pontoId];
      return total + (base ? Math.hypot(ponto.x - base.x, ponto.y - base.y, ponto.z - base.z) : 0);
    }, 0) / Math.max(1, resumo.pontos.length);
    return Math.max(0, estados * 0.7 + Math.max(0, 1 - pontos / DISTANCIA_MAXIMA) * 0.3);
  });
  const percentual = Math.round(notas.reduce((total, nota) => total + nota, 0) / notas.length * 100);
  return { ok: percentual >= META_CONCLUSAO, percentual, motivo: percentual >= META_CONCLUSAO ? "Atividade concluída! Seu gesto está correto." : "A configuração ainda está diferente. Ajuste os dedos e tente novamente." };
}

export function CameraGesto({ sinalId, termo, aoConcluir }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const prontaRef = useRef(false);
  const loopRef = useRef(null);
  const [aberta, setAberta] = useState(false);
  const [pronta, setPronta] = useState(false);
  const [maos, setMaos] = useState([]);
  const [modelo, setModelo] = useState(() => lerModelo(sinalId));
  const [retorno, setRetorno] = useState("");
  const [erro, setErro] = useState("");
  const [resumoAtual, setResumoAtual] = useState(null);
  const [aprovado, setAprovado] = useState(false);

  useEffect(() => () => parar(), []);
  useEffect(() => { setModelo(lerModelo(sinalId)); setRetorno(""); }, [sinalId]);

  function desenhar(landmarks) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const contexto = canvas.getContext("2d");
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    const conexoes = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
    for (const pontos of landmarks) {
      const tela = ponto => [(1 - ponto.x) * canvas.width, ponto.y * canvas.height];
      contexto.strokeStyle = "#58d6bd"; contexto.lineWidth = 3;
      for (const [a, b] of conexoes) { contexto.beginPath(); contexto.moveTo(...tela(pontos[a])); contexto.lineTo(...tela(pontos[b])); contexto.stroke(); }
      contexto.fillStyle = "#f9d86a";
      for (const ponto of pontos) { contexto.beginPath(); contexto.arc(...tela(ponto), 4, 0, Math.PI * 2); contexto.fill(); }
    }
  }

  function parar() {
    cancelAnimationFrame(loopRef.current);
    workerRef.current?.terminate(); workerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setAberta(false); setPronta(false); setMaos([]);
    prontaRef.current = false;
  }

  function enviarFrame() {
    const video = videoRef.current;
    if (video && workerRef.current && prontaRef.current && !frameRef.current && video.readyState >= 2) {
      frameRef.current = true;
      createImageBitmap(video).then(frame => workerRef.current?.postMessage({ type: "frame", frame, timestamp: performance.now() }, [frame])).catch(() => { frameRef.current = false; });
    }
    loopRef.current = requestAnimationFrame(enviarFrame);
  }

  async function iniciar() {
    setErro(""); setRetorno(""); setAberta(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream; videoRef.current.srcObject = stream; await videoRef.current.play();
      const worker = new Worker("/vision/hand-worker.js"); workerRef.current = worker;
      worker.onmessage = ({ data }) => {
        if (data.type === "ready") { prontaRef.current = true; setPronta(true); enviarFrame(); }
        if (data.type === "result") { frameRef.current = false; const detectadas = data.landmarks.map((landmarks, indice) => ({ landmarks, worldLandmarks: data.worldLandmarks?.[indice] })); setMaos(detectadas); setResumoAtual(detectadas[0] ? resumir(detectadas[0]) : null); desenhar(data.landmarks); }
        if (data.type === "error") setErro(data.message);
      };
      worker.onerror = () => setErro("Não foi possível carregar o detector neste dispositivo.");
      worker.postMessage({ type: "init" });
    } catch (error) {
      setErro(error.name === "NotAllowedError" ? "Libere a câmera nas permissões do navegador." : "Não foi possível abrir a câmera.");
      parar();
    }
  }

  function salvarModelo() {
    if (!maos.length) return setRetorno("Mostre o gesto antes de cadastrar a posição correta.");
    const novoModelo = { termo, maos: maos.map(resumir), criadoEm: new Date().toISOString() };
    localStorage.setItem(chave(sinalId), JSON.stringify(novoModelo)); setModelo(novoModelo); setRetorno("Posição correta cadastrada para este sinal.");
  }

  function validar() {
    if (!modelo) return setRetorno("Cadastre primeiro a posição correta deste sinal.");
    if (!maos.length) return setRetorno("Mostre o gesto para a câmera.");
    const resultado = comparar(modelo, maos); setAprovado(resultado.ok); setRetorno(`${resultado.motivo} ${resultado.percentual}%`);
  }

  const dedosEsperados = modelo?.maos?.[0]?.estados || [];
  const dedosAtuais = resumoAtual?.estados || [];
  return <section className={`camera-gesto ${aberta ? "camera-gesto--aberta" : ""}`} aria-labelledby={`camera-gesto-${sinalId}`}>
    <div className="camera-gesto-cabecalho"><div><p className="camera-gesto-etiqueta">Prática guiada</p><h2 id={`camera-gesto-${sinalId}`}>Pratique “{termo}”</h2></div><Camera aria-hidden="true" /></div>
    {!aberta ? <><p className="camera-gesto-texto">Abra a câmera para receber orientação sobre a posição de cada dedo e conferir seu gesto.</p><button type="button" className="camera-gesto-acao" onClick={iniciar}><Camera aria-hidden="true" /> Ir praticar</button></> : <div className="camera-gesto-fullscreen">
      <div className="camera-gesto-cabecalho"><div><p className="camera-gesto-etiqueta">Sensor ativo</p><h2>Faça “{termo}”</h2></div><button type="button" className="camera-gesto-fechar" onClick={parar} aria-label="Fechar prática"><X aria-hidden="true" /></button></div>
      <div className="camera-gesto-palco"><video ref={videoRef} muted playsInline /><canvas ref={canvasRef} aria-label="Pontos detectados nas mãos" /></div>
      <p className="camera-gesto-status" role="status">{erro || (pronta ? `${maos.length} ${maos.length === 1 ? "mão" : "mãos"} detectada(s).` : "Carregando detector…")}</p>
      <div className="camera-gesto-acoes"><button type="button" onClick={salvarModelo} disabled={!pronta}><Save aria-hidden="true" /> Cadastrar posição</button><button type="button" onClick={validar} disabled={!pronta || !modelo}><ShieldCheck aria-hidden="true" /> Validar gesto</button><button type="button" onClick={parar} aria-label="Desligar câmera"><CircleStop aria-hidden="true" /></button></div>
      {modelo && <div className="camera-gesto-sensor" aria-label="Sensor de posição dos dedos"><strong>Sensor dos dedos</strong><div className="camera-gesto-dedos">{["Polegar", "Indicador", "Médio", "Anelar", "Mínimo"].map((dedo, indice) => { const esperado = dedosEsperados[indice * 1] || "—"; const atual = dedosAtuais[indice * 1] || "Aguardando"; const certo = esperado === atual; return <div className={`camera-gesto-dedo ${certo ? "camera-gesto-dedo--certo" : ""}`} key={dedo}><span className="camera-gesto-led" aria-hidden="true" /><span><b>{dedo}</b><small>Esperado: {esperado} · Agora: {atual}</small></span></div>; })}</div></div>}
      {retorno && <p className={`camera-gesto-retorno ${aprovado ? "camera-gesto-retorno--sucesso" : ""}`} role="status" aria-live="polite">{retorno}</p>}
      {aprovado && <button type="button" className="camera-gesto-concluir" onClick={aoConcluir}><Check aria-hidden="true" /> Concluir prática</button>}
    </div>}
    {modelo && !aberta && <p className="camera-gesto-modelo"><Check aria-hidden="true" /> Modelo deste sinal já cadastrado.</p>}
  </section>;
}
