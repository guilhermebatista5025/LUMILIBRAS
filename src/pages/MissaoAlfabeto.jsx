import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { ArrowLeft, Camera, Check, Play, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { Mascote } from "../components/mascote/index.js";
import { LETRAS_MODELO, MISSOES_ALFABETO } from "../data/missoesAlfabeto.js";
import { atualizarLeitura, melhorPredicao, QUADROS_ESTAVEIS } from "../lib/alphabetMission.js";
import "./MissaoAlfabeto.css";

const URL_MODELO = "/alfabeto/modelo/model.json";

export function MissaoAlfabeto() {
  const [missaoId, setMissaoId] = useState(MISSOES_ALFABETO[0].id);
  const [estado, setEstado] = useState("ocioso");
  const [indice, setIndice] = useState(0);
  const [letraLida, setLetraLida] = useState(null);
  const [confianca, setConfianca] = useState(0);
  const [estabilidade, setEstabilidade] = useState(0);
  const [erro, setErro] = useState("");
  const videoRef = useRef(null);
  const recorteRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const modeloRef = useRef(null);
  const loopRef = useRef(0);
  const pendenteRef = useRef(false);
  const ultimaCapturaRef = useRef(0);
  const requestRef = useRef(0);
  const indiceRef = useRef(0);
  const leituraRef = useRef({ letra: null, quadros: 0 });
  const missao = MISSOES_ALFABETO.find(item => item.id === missaoId) || MISSOES_ALFABETO[0];
  const letraEsperada = missao.texto[indice];

  useEffect(() => { indiceRef.current = indice; }, [indice]);

  function encerrarCamera() {
    cancelAnimationFrame(loopRef.current);
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
    modeloRef.current = null;
  }, []);

  async function classificar(box) {
    const video = videoRef.current;
    const canvas = recorteRef.current;
    const modelo = modeloRef.current;
    if (!box || !video || !canvas || !modelo || video.readyState < 2) return { letra: null, confianca: 0 };
    const origemX = Math.round(box.x * video.videoWidth);
    const origemY = Math.round(box.y * video.videoHeight);
    const largura = Math.max(1, Math.round(box.largura * video.videoWidth));
    const altura = Math.max(1, Math.round(box.altura * video.videoHeight));
    const contexto = canvas.getContext("2d", { willReadFrequently: true });
    contexto.clearRect(0, 0, 224, 224);
    contexto.drawImage(video, origemX, origemY, largura, altura, 0, 0, 224, 224);

    // O modelo de referência recebeu quadros BGR do OpenCV, normalizados em [-1, 1].
    const entrada = tf.tidy(() => tf.browser.fromPixels(canvas).reverse(-1).toFloat().div(127).sub(1).expandDims(0));
    const saida = modelo.predict(entrada);
    const probabilidades = await saida.data();
    entrada.dispose();
    saida.dispose();
    return melhorPredicao(probabilidades, LETRAS_MODELO);
  }

  function agendarCaptura() {
    const capturar = async tempo => {
      const video = videoRef.current;
      const worker = workerRef.current;
      if (!worker || !video) return;
      if (!pendenteRef.current && video.readyState >= 2 && tempo - ultimaCapturaRef.current >= 150) {
        ultimaCapturaRef.current = tempo;
        pendenteRef.current = true;
        try {
          const frame = await createImageBitmap(video);
          const requestId = ++requestRef.current;
          worker.postMessage({ type: "frame", requestId, frame, timestamp: performance.now() }, [frame]);
        } catch {
          pendenteRef.current = false;
        }
      }
      loopRef.current = requestAnimationFrame(capturar);
    };
    loopRef.current = requestAnimationFrame(capturar);
  }

  async function iniciar() {
    if (estado === "carregando" || estado === "ativo") return;
    encerrarCamera();
    setEstado("carregando");
    setErro("");
    setIndice(0);
    indiceRef.current = 0;
    setLetraLida(null);
    setConfianca(0);
    setEstabilidade(0);
    leituraRef.current = { letra: null, quadros: 0 };
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error("A câmera exige HTTPS ou localhost em um navegador compatível.");
      const worker = new Worker("/camera/alphabet-worker.js");
      workerRef.current = worker;
      const pronto = new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("O detector demorou demais para iniciar.")), 30000);
        worker.onmessage = async ({ data }) => {
          if (data.type === "ready") {
            window.clearTimeout(timeout);
            resolve();
            return;
          }
          if (data.type === "fatal") {
            window.clearTimeout(timeout);
            reject(new Error(data.message));
            return;
          }
          if (data.type !== "result") return;
          try {
            const predicao = await classificar(data.box);
            setLetraLida(predicao.letra);
            setConfianca(Math.round(predicao.confianca * 100));
            const esperada = missao.texto[indiceRef.current];
            const leitura = atualizarLeitura(leituraRef.current, predicao.letra, esperada);
            leituraRef.current = leitura;
            setEstabilidade(leitura.quadros);
            if (leitura.confirmou) {
              leituraRef.current = { letra: null, quadros: 0 };
              const proximo = indiceRef.current + 1;
              if (proximo >= missao.texto.length) {
                setIndice(missao.texto.length);
                indiceRef.current = missao.texto.length;
                setEstado("concluido");
                encerrarCamera();
              } else {
                setIndice(proximo);
                indiceRef.current = proximo;
                setEstabilidade(0);
              }
            }
          } finally {
            pendenteRef.current = false;
          }
        };
        worker.onerror = () => reject(new Error("Não foi possível executar o detector de mãos."));
      });
      worker.postMessage({ type: "init" });

      const streamPromise = navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
      const modeloPromise = modeloRef.current ? Promise.resolve(modeloRef.current) : tf.loadLayersModel(URL_MODELO);
      const [stream, modelo] = await Promise.all([streamPromise, modeloPromise, pronto]).then(([streamAtual, modeloAtual]) => [streamAtual, modeloAtual]);
      streamRef.current = stream;
      modeloRef.current = modelo;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setEstado("ativo");
      agendarCaptura();
    } catch (error) {
      encerrarCamera();
      setEstado("erro");
      setErro(error.name === "NotAllowedError" ? "Autorize o acesso à câmera e tente novamente." : error.message || "Não foi possível iniciar a missão.");
    }
  }

  function trocarMissao(evento) {
    encerrarCamera();
    setMissaoId(evento.target.value);
    setEstado("ocioso");
    setIndice(0);
    setLetraLida(null);
    setEstabilidade(0);
    setErro("");
  }

  return (
    <main className="missao-alfabeto">
      <header className="missao-alfabeto__topo">
        <button type="button" onClick={() => window.location.assign("/")} aria-label="Voltar"><ArrowLeft /></button>
        <LogoLumiLibras tamanho="sm" />
        <span><ShieldCheck /> Processamento local</span>
      </header>

      <section className="missao-alfabeto__intro">
        <p>Alfabeto manual • modelo inicial A–D</p>
        <h1>Complete a missão letra por letra</h1>
        <span>Mostre a letra pedida e mantenha a mão firme até a confirmação.</span>
      </section>

      <section className="missao-alfabeto__cartao">
        <div className="missao-alfabeto__seletor">
          <label htmlFor="missao">Missão</label>
          <select id="missao" value={missao.id} onChange={trocarMissao} disabled={estado === "ativo" || estado === "carregando"}>
            {MISSOES_ALFABETO.map(item => <option key={item.id} value={item.id}>{item.titulo}</option>)}
          </select>
          <p>{missao.descricao}</p>
        </div>

        <div className="missao-alfabeto__palavra" aria-label={`Progresso: ${indice} de ${missao.texto.length} letras`}>
          {[...missao.texto].map((letra, posicao) => <span key={`${letra}-${posicao}`} className={posicao < indice ? "concluida" : posicao === indice ? "atual" : ""}>{posicao < indice ? <Check /> : letra}</span>)}
        </div>

        {estado === "concluido" ? (
          <section className="missao-alfabeto__conclusao" aria-live="polite">
            <div className="missao-alfabeto__confetes" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ "--i": i }} />)}</div>
            <Mascote pose="otimo" tamanho="full" decorativo />
            <p><Sparkles /> Missão concluída</p>
            <h2>Parabéns! Você completou “{missao.texto}”.</h2>
            <button type="button" onClick={iniciar}><RotateCcw /> Praticar novamente</button>
          </section>
        ) : (
          <div className="missao-alfabeto__pratica">
            <div className="missao-alfabeto__camera">
              <video ref={videoRef} muted playsInline aria-label="Imagem da sua câmera" />
              <div className="missao-alfabeto__guia" aria-hidden="true" />
              {estado !== "ativo" && <div className="missao-alfabeto__camera-vazia"><Camera /><span>{estado === "carregando" ? "Carregando detector e modelo…" : "A câmera abre ao iniciar"}</span></div>}
              {estado === "ativo" && <div className="missao-alfabeto__leitura"><small>Detectado</small><strong>{letraLida || "—"}</strong><span>{confianca}%</span></div>}
            </div>
            <canvas ref={recorteRef} width="224" height="224" hidden />

            <aside>
              <span>Faça agora</span>
              <strong>{letraEsperada || "✓"}</strong>
              <p>{letraLida === letraEsperada ? "Muito bem, mantenha a posição." : letraLida ? `A câmera leu ${letraLida}. Ajuste para ${letraEsperada}.` : "Centralize uma mão inteira no quadro."}</p>
              <div className="missao-alfabeto__estabilidade" role="progressbar" aria-label="Estabilidade da letra" aria-valuemin={0} aria-valuemax={QUADROS_ESTAVEIS} aria-valuenow={estabilidade}><span style={{ width: `${estabilidade / QUADROS_ESTAVEIS * 100}%` }} /></div>
              {erro && <p className="missao-alfabeto__erro" role="alert">{erro}</p>}
              <button type="button" onClick={iniciar} disabled={estado === "carregando" || estado === "ativo"}><Play /> {estado === "erro" ? "Tentar novamente" : "Iniciar missão"}</button>
            </aside>
          </div>
        )}
      </section>

      <p className="missao-alfabeto__nota">Este primeiro modelo reconhece somente A, B, C e D. A estrutura já está pronta para receber o modelo A–Z, incluindo tratamento temporal para J e Z.</p>
    </main>
  );
}

