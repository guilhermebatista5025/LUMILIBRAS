import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { ArrowLeft, Camera, CheckCircle2, CircleHelp, ShieldCheck } from "lucide-react";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { LETRAS_MODELO } from "../data/missoesAlfabeto.js";
import { reconhecerPorLandmarks } from "../lib/landmarkRecognition.js";
import { melhorPredicao, QUADROS_ESTAVEIS, atualizarLeitura } from "../lib/alphabetMission.js";
import "./ValidarSinais.css";

const URL_MODELO = "/alfabeto/modelo/model.json";
const STORAGE_KEY = "lumilibras.dataset-landmarks.v1";
const LETRAS_PRETREINADAS = ["A", "B", "C", "D"];
const TODAS_LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function exemplosLocais() {
  try {
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

export function ValidarSinais() {
  const [letra, setLetra] = useState("A");
  const [exemplos, setExemplos] = useState(exemplosLocais);
  const [estado, setEstado] = useState("ocioso");
  const [mensagem, setMensagem] = useState("Escolha uma letra e inicie a câmera para validar o sinal.");
  const [detectada, setDetectada] = useState(null);
  const [confianca, setConfianca] = useState(0);
  const [estabilidade, setEstabilidade] = useState(0);
  const [pontos, setPontos] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const modeloRef = useRef(null);
  const frameRef = useRef(0);
  const pendenteRef = useRef(false);
  const requestRef = useRef(0);
  const leituraRef = useRef({ letra: null, quadros: 0 });
  const letraRef = useRef(letra);
  const estadoRef = useRef(estado);

  useEffect(() => { letraRef.current = letra; }, [letra]);
  useEffect(() => { estadoRef.current = estado; }, [estado]);

  useEffect(() => {
    let ativo = true;
    fetch("/alfabeto/dataset-base.json")
      .then(resposta => resposta.ok ? resposta.json() : Promise.reject(new Error("Base indisponível")))
      .then(base => {
        if (!ativo || !Array.isArray(base.exemplos)) return;
        const locais = exemplosLocais();
        const ids = new Set(locais.map(item => item.id));
        const combinados = [...locais, ...base.exemplos.filter(item => !ids.has(item.id))];
        setExemplos(combinados);
        if (!locais.length) setMensagem("Base de amostras carregada. Escolha uma letra disponível e inicie a câmera.");
      })
      .catch(() => {
        if (ativo) setMensagem("Não consegui carregar a base de comparação. Confira a conexão e tente atualizar a página.");
      });
    return () => { ativo = false; };
  }, []);

  const letrasComAmostras = new Set(exemplos.map(item => item.letra));
  const letrasDisponiveis = new Set([
    ...LETRAS_PRETREINADAS,
    ...[...letrasComAmostras].filter(item => item !== "J" && item !== "Z"),
  ]);
  const exemplosDaLetra = exemplos.filter(item => item.letra === letra && Array.isArray(item.forma) && item.forma.length === 21);
  const usaModeloImagem = LETRAS_PRETREINADAS.includes(letra) && exemplosDaLetra.length < 3;
  const quantidadeLetra = usaModeloImagem ? "modelo inicial A–D" : `${exemplosDaLetra.length} exemplos locais`;

  function encerrarCamera() {
    cancelAnimationFrame(frameRef.current);
    workerRef.current?.terminate();
    workerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    pendenteRef.current = false;
  }

  useEffect(() => () => {
    encerrarCamera();
    modeloRef.current?.dispose();
  }, []);

  async function reconhecer(frame) {
    const letraAtual = letraRef.current;
    const exemplosDaLetraAtual = exemplos.filter(item => item.letra === letraAtual && Array.isArray(item.forma) && item.forma.length === 21);
    if (LETRAS_PRETREINADAS.includes(letraAtual) && exemplosDaLetraAtual.length < 3) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!frame.box || !video || !canvas || !modeloRef.current || video.readyState < 2) {
        return { letra: null, confianca: 0, valida: false };
      }
      const x = Math.round(frame.box.x * video.videoWidth);
      const y = Math.round(frame.box.y * video.videoHeight);
      const largura = Math.max(1, Math.round(frame.box.largura * video.videoWidth));
      const altura = Math.max(1, Math.round(frame.box.altura * video.videoHeight));
      const contexto = canvas.getContext("2d", { willReadFrequently: true });
      contexto.clearRect(0, 0, 224, 224);
      contexto.drawImage(video, x, y, largura, altura, 0, 0, 224, 224);
      const entrada = tf.tidy(() => tf.browser.fromPixels(canvas).reverse(-1).toFloat().div(127).sub(1).expandDims(0));
      const saida = modeloRef.current.predict(entrada);
      const probabilidades = await saida.data();
      entrada.dispose();
      saida.dispose();
      const predicao = melhorPredicao(probabilidades, LETRAS_MODELO);
      return { ...predicao, valida: Boolean(predicao.letra && predicao.confianca >= 0.72) };
    }
    return reconhecerPorLandmarks(frame.landmarks, exemplos);
  }

  async function iniciar() {
    if (estadoRef.current === "carregando" || estadoRef.current === "ativo") return;
    encerrarCamera();
    setEstado("carregando");
    estadoRef.current = "carregando";
    setMensagem("Abrindo a câmera e preparando o detector de mãos...");
    setDetectada(null);
    setConfianca(0);
    setEstabilidade(0);
    leituraRef.current = { letra: null, quadros: 0 };

    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error("A câmera precisa de HTTPS ou localhost.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const worker = new Worker("/camera/alphabet-worker.js");
      workerRef.current = worker;
      const pronto = new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("O detector de mãos demorou demais para iniciar.")), 30000);
        worker.onmessage = async ({ data }) => {
          if (data.type === "ready") { clearTimeout(timeout); resolve(); return; }
          if (data.type === "fatal") { clearTimeout(timeout); reject(new Error(data.message)); return; }
          if (data.type !== "result") return;
          setPontos(data.landmarks || []);
          try {
            const resultado = await reconhecer(data);
            const prevista = resultado.valida ? (resultado.letra || resultado.candidata) : null;
            setDetectada(prevista || resultado.candidata || null);
            setConfianca(Math.round((resultado.confianca || 0) * 100));
            const leitura = atualizarLeitura(leituraRef.current, prevista, letraRef.current);
            leituraRef.current = leitura;
            setEstabilidade(leitura.quadros);
            if (leitura.confirmou) {
              setEstado("validado");
              estadoRef.current = "validado";
              setMensagem(`Sinal ${letraRef.current} reconhecido. Você fez corretamente!`);
              encerrarCamera();
            } else if (!data.landmarks) {
              setMensagem("Não encontrei a mão. Deixe a mão inteira visível no quadro.");
            } else if (resultado.candidata && resultado.candidata !== letraRef.current) {
              setMensagem(`Parece mais com ${resultado.candidata}. Ajuste a mão para formar ${letraRef.current}.`);
            } else if (prevista === letraRef.current) {
              setMensagem("A pose parece correta. Mantenha por mais um instante...");
            } else if (resultado.distancia > 0.2) {
              setMensagem("A pose ainda está distante dos exemplos. Centralize a mão e ajuste os dedos.");
            } else {
              setMensagem("Estou comparando a pose. Mantenha a mão visível e ajuste os dedos.");
            }
          } catch (error) {
            setMensagem(error.message || "Erro ao comparar a pose da mão.");
          } finally {
            pendenteRef.current = false;
          }
        };
        worker.onerror = () => reject(new Error("Não foi possível executar o detector de mãos."));
        worker.postMessage({ type: "init" });
      });

      const modeloPromise = LETRAS_PRETREINADAS.includes(letra)
        ? (modeloRef.current ? Promise.resolve(modeloRef.current) : tf.loadLayersModel(URL_MODELO))
        : Promise.resolve(null);
      const [modelo] = await Promise.all([modeloPromise, pronto]);
      if (modelo) modeloRef.current = modelo;
      setEstado("ativo");
      estadoRef.current = "ativo";
      const capturar = async () => {
        const video = videoRef.current;
        const atual = workerRef.current;
        if (!atual || !video) return;
        if (!pendenteRef.current && video.readyState >= 2) {
          pendenteRef.current = true;
          try {
            const bitmap = await createImageBitmap(video);
            atual.postMessage({ type: "frame", requestId: ++requestRef.current, timestamp: performance.now(), frame: bitmap }, [bitmap]);
          } catch {
            pendenteRef.current = false;
          }
        }
        frameRef.current = requestAnimationFrame(capturar);
      };
      frameRef.current = requestAnimationFrame(capturar);
    } catch (error) {
      encerrarCamera();
      setEstado("erro");
      estadoRef.current = "erro";
      setMensagem(error.name === "NotAllowedError" ? "Permita o acesso à câmera nas configurações do navegador." : error.message || "Não foi possível iniciar a validação.");
    }
  }

  function parar() {
    encerrarCamera();
    setEstado("ocioso");
    estadoRef.current = "ocioso";
    setPontos([]);
    setEstabilidade(0);
    leituraRef.current = { letra: null, quadros: 0 };
    setMensagem("Validação pausada. Nenhuma amostra foi cadastrada.");
  }

  function trocarLetra(evento) {
    parar();
    setLetra(evento.target.value);
    letraRef.current = evento.target.value;
    setDetectada(null);
    setConfianca(0);
  }

  const ativa = estado === "ativo";
  const validou = estado === "validado";
  const indisponivel = !letrasDisponiveis.has(letra) || letra === "J" || letra === "Z";

  return <main className="validar-sinais">
    <header className="validar-sinais__topo">
      <button type="button" onClick={() => window.location.assign("/")} aria-label="Voltar"><ArrowLeft /></button>
      <LogoLumiLibras tamanho="sm" />
      <span><ShieldCheck /> Sem cadastrar</span>
    </header>

    <section className="validar-sinais__intro">
      <p>Prática do alfabeto manual</p>
      <h1>Confira seu sinal</h1>
      <span>A câmera compara sua mão com o modelo ou com as amostras disponíveis.</span>
    </section>

    <section className="validar-sinais__cartao">
      <div className="validar-sinais__seletor">
        <label htmlFor="letra-validacao">Letra que você está fazendo</label>
        <select id="letra-validacao" value={letra} onChange={trocarLetra} disabled={ativa || estado === "carregando"}>
          {TODAS_LETRAS.map(item => <option key={item} value={item} disabled={!letrasDisponiveis.has(item) || item === "J" || item === "Z"}>{item}{!letrasDisponiveis.has(item) || item === "J" || item === "Z" ? " (sem dados)" : ""}</option>)}
        </select>
        <small>{LETRAS_PRETREINADAS.includes(letra) ? "Modelo A–D original" : `${quantidadeLetra} exemplos locais`}</small>
      </div>

      <div className="validar-sinais__conteudo">
        <div className="validar-sinais__camera">
          <video ref={videoRef} muted playsInline aria-label="Prévia da câmera" />
          <div className="validar-sinais__guia" aria-hidden="true" />
          {pontos.length > 0 && <svg className="validar-sinais__pontos" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">{pontos.map((ponto, indice) => <circle key={indice} cx={ponto.x} cy={ponto.y} r="0.009" />)}</svg>}
          {!ativa && <div className="validar-sinais__vazia"><Camera /><span>{estado === "carregando" ? "Preparando detector..." : "Inicie a câmera para conferir"}</span></div>}
          {ativa && <div className="validar-sinais__detectada"><small>Leitura</small><strong>{detectada || "—"}</strong><span>{confianca}%</span></div>}
          {validou && <div className="validar-sinais__sucesso"><CheckCircle2 /> Correto!</div>}
        </div>
        <canvas ref={canvasRef} width="224" height="224" hidden />

        <aside className="validar-sinais__painel">
          <span>Faça esta letra</span>
          <strong>{letra}</strong>
          <p>{indisponivel ? "Ainda não há exemplos para validar esta letra." : mensagem}</p>
          <div className="validar-sinais__progresso" role="progressbar" aria-label="Confirmação estável" aria-valuemin={0} aria-valuemax={QUADROS_ESTAVEIS} aria-valuenow={estabilidade}><span style={{ width: `${estabilidade / QUADROS_ESTAVEIS * 100}%` }} /></div>
          {!indisponivel && <button type="button" onClick={ativa ? parar : iniciar} disabled={estado === "carregando"}>{ativa ? "Parar câmera" : estado === "carregando" ? "Iniciando..." : "Iniciar validação"}</button>}
          {indisponivel && <p className="validar-sinais__aviso"><CircleHelp /> Esta tela não grava novos sinais. Importe amostras pela tela de cadastro para habilitar outras letras.</p>}
        </aside>
      </div>
    </section>
    <p className="validar-sinais__nota">A câmera e a comparação funcionam neste aparelho. O vídeo não é enviado e a validação não salva amostras.</p>
  </main>;
}
