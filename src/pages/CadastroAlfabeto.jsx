import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Download, Hand, Play, Square, Trash2, Upload } from "lucide-react";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { CONFIG_EIXOS, INTERVALO_MOVIMENTO_MS, INTERVALO_POSE_MS, MARGEM_MINIMA } from "../lib/alfabetoCadastroConfig.js";
import "./CadastroAlfabeto.css";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const LETRAS_COM_MOVIMENTO = new Set(["J", "Z"]);
const STORAGE_KEY = "lumilibras.dataset-landmarks.v1";
const TAMANHO_SEQUENCIA = 20;

function carregarDataset() {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(salvo) ? salvo : [];
  } catch {
    return [];
  }
}

function ajustarEixos(pontos) {
  // Ajuste os sinais/offsets no arquivo src/lib/alfabetoCadastroConfig.js.
  return pontos.map(ponto => Object.fromEntries(Object.entries(CONFIG_EIXOS).map(([eixo, ajuste]) => [
    eixo,
    Number((ponto[ajuste.origem] * ajuste.escala + ajuste.offset).toFixed(6)),
  ])));
}

function maoDentroDaArea(pontos) {
  return pontos.every(({ x, y }) => x >= MARGEM_MINIMA && x <= 1 - MARGEM_MINIMA && y >= MARGEM_MINIMA && y <= 1 - MARGEM_MINIMA);
}

function normalizarForma(pontos) {
  // Além dos eixos da imagem, salva pontos relativos ao pulso para reduzir
  // diferença de distância/tamanho da mão entre pessoas. A coordenada original
  // normalizada também fica preservada no exemplo bruto.
  const pulso = pontos[0];
  const distancias = pontos.map(ponto => ({ x: ponto.x - pulso.x, y: ponto.y - pulso.y, z: ponto.z - pulso.z }));
  const escala = Math.max(...distancias.map(ponto => Math.hypot(ponto.x, ponto.y, ponto.z)), 0.0001);
  return distancias.map(ponto => ({ x: Number((ponto.x / escala).toFixed(6)), y: Number((ponto.y / escala).toFixed(6)), z: Number((ponto.z / escala).toFixed(6)) }));
}

export function CadastroAlfabeto() {
  const [letra, setLetra] = useState("A");
  const [mao, setMao] = useState("direita");
  const [dataset, setDataset] = useState(carregarDataset);
  const [estado, setEstado] = useState("ocioso");
  const [mensagem, setMensagem] = useState("Escolha uma letra e inicie a câmera para gravar exemplos.");
  const [pontosVisiveis, setPontosVisiveis] = useState([]);
  const videoRef = useRef(null);
  const arquivoRef = useRef(null);
  const workerRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(0);
  const gravandoRef = useRef(false);
  const ultimosPontosRef = useRef([]);
  const inicioSequenciaRef = useRef(0);
  const ultimaAmostraRef = useRef(0);
  const contadorRef = useRef(0);
  const requestRef = useRef(0);
  const pendenteRef = useRef(false);
  const letraRef = useRef(letra);
  const maoRef = useRef(mao);
  const tipoAtual = LETRAS_COM_MOVIMENTO.has(letra) ? "movimento" : "pose";

  useEffect(() => { letraRef.current = letra; }, [letra]);
  useEffect(() => { maoRef.current = mao; }, [mao]);

  const resumo = useMemo(() => {
    const agrupado = Object.fromEntries(LETRAS.map(item => [item, 0]));
    dataset.forEach(item => { agrupado[item.letra] += 1; });
    return agrupado;
  }, [dataset]);

  const persistir = useCallback((novoDataset) => {
    setDataset(novoDataset);
    // Dataset fica neste navegador; exporte o JSON para guardar uma cópia.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novoDataset));
  }, []);

  useEffect(() => {
    // Adiciona a base E–R na primeira abertura, ou completa dados já existentes
    // sem repetir amostras que já estejam salvas neste navegador.
    let ativo = true;
    fetch("/alfabeto/dataset-base.json")
      .then(resposta => {
        if (!resposta.ok) throw new Error("Dataset base indisponível.");
        return resposta.json();
      })
      .then(base => {
        if (!ativo || !Array.isArray(base.exemplos)) return;
        const atuais = carregarDataset();
        const idsAtuais = new Set(atuais.map(item => item.id));
        const novos = base.exemplos.filter(item => !idsAtuais.has(item.id));
        if (!novos.length) return;
        try {
          persistir([...atuais, ...novos]);
          setMensagem(`${novos.length} amostras das letras E–R carregadas no cadastro.`);
        } catch {
          setMensagem("Não foi possível importar a base automaticamente. Use Importar JSON para selecionar o arquivo.");
        }
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, [persistir]);

  const pararGravacao = useCallback(() => {
    gravandoRef.current = false;
    setEstado(atual => atual === "ativo" ? "pronto" : atual);
  }, []);

  const encerrar = useCallback(() => {
    pararGravacao();
    cancelAnimationFrame(frameRef.current);
    workerRef.current?.terminate();
    workerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    pendenteRef.current = false;
  }, [pararGravacao]);

  useEffect(() => () => encerrar(), [encerrar]);

  function adicionarExemplo(pontos, timestamp, letraAmostra = letraRef.current) {
    const tipoAmostra = LETRAS_COM_MOVIMENTO.has(letraAmostra) ? "movimento" : "pose";
    const exemplo = {
      id: crypto.randomUUID(),
      letra: letraAmostra,
      mao: maoRef.current,
      tipo: tipoAmostra,
      criadoEm: new Date().toISOString(),
      // `landmarks` é o dado corrigível pelo ajuste de eixo.
      landmarks: ajustarEixos(pontos),
      // `forma` é uma representação centrada no pulso, útil para treinar.
      forma: normalizarForma(ajustarEixos(pontos)),
      // `sequencia` será preenchida para J e Z durante a gravação contínua.
      ...(tipoAmostra === "movimento" ? { sequencia: ultimosPontosRef.current.map(ajustarEixos), duracaoMs: timestamp - inicioSequenciaRef.current } : {}),
    };
    persistir([...carregarDataset(), exemplo]);
    contadorRef.current += 1;
    setMensagem(tipoAmostra === "movimento" ? `${letraAmostra} salvo com ${exemplo.sequencia.length} quadros.` : `Amostra ${contadorRef.current} de ${letraAmostra} salva.`);
  }

  async function iniciarCamera() {
    encerrar();
    setEstado("carregando");
    setMensagem("Abrindo câmera e preparando detector de mãos...");
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error("A câmera precisa de HTTPS ou localhost.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const worker = new Worker("/camera/alphabet-worker.js");
      workerRef.current = worker;
      await new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("Detector de mão demorou demais para iniciar.")), 30000);
        worker.onmessage = ({ data }) => {
          if (data.type === "ready") { clearTimeout(timeout); resolve(); }
          if (data.type === "fatal") { clearTimeout(timeout); reject(new Error(data.message)); }
          if (data.type !== "result") return;
          pendenteRef.current = false;
          const pontos = data.landmarks;
          if (!pontos?.length) {
            setPontosVisiveis([]);
            if (gravandoRef.current) setMensagem("Mão não detectada. Centralize a mão inteira.");
            return;
          }
          setPontosVisiveis(pontos);
          if (!gravandoRef.current) return;
          if (!maoDentroDaArea(pontos)) {
            setMensagem("Mão muito perto da borda. Centralize os dedos no quadro.");
            return;
          }
          const letraAtual = letraRef.current;
          const tipoAtualizado = LETRAS_COM_MOVIMENTO.has(letraAtual) ? "movimento" : "pose";
          if (tipoAtualizado === "pose") {
            if (data.timestamp - ultimaAmostraRef.current >= INTERVALO_POSE_MS) {
              ultimaAmostraRef.current = data.timestamp;
              adicionarExemplo(pontos, data.timestamp, letraAtual);
            }
          } else {
            if (ultimosPontosRef.current.length === 0) inicioSequenciaRef.current = data.timestamp;
            if (data.timestamp - ultimaAmostraRef.current >= INTERVALO_MOVIMENTO_MS) {
              ultimaAmostraRef.current = data.timestamp;
              ultimosPontosRef.current.push(pontos);
              if (ultimosPontosRef.current.length >= TAMANHO_SEQUENCIA) {
                adicionarExemplo(pontos, data.timestamp, letraAtual);
                ultimosPontosRef.current = [];
                setMensagem(`${letraAtual} salvo. Faça o movimento novamente para outra amostra.`);
              } else {
                setMensagem(`Gravando movimento ${letraAtual}: ${ultimosPontosRef.current.length}/${TAMANHO_SEQUENCIA} quadros.`);
              }
            }
          }
        };
        worker.onerror = () => reject(new Error("Não foi possível iniciar o detector de mãos."));
        worker.postMessage({ type: "init" });
      });
      setEstado("pronto");
      setMensagem("Câmera pronta. Clique em Gravar exemplos.");
      const capturar = async () => {
        if (!workerRef.current) return;
        if (!pendenteRef.current && videoRef.current?.readyState >= 2) {
          pendenteRef.current = true;
          try {
            const bitmap = await createImageBitmap(videoRef.current);
            workerRef.current?.postMessage({ type: "frame", requestId: ++requestRef.current, timestamp: performance.now(), frame: bitmap }, [bitmap]);
          } catch { pendenteRef.current = false; }
        }
        frameRef.current = requestAnimationFrame(capturar);
      };
      frameRef.current = requestAnimationFrame(capturar);
    } catch (error) {
      encerrar();
      setEstado("erro");
      setMensagem(error.name === "NotAllowedError" ? "Permita o acesso à câmera nas configurações do navegador." : error.message || "Erro ao abrir a câmera.");
    }
  }

  function alternarGravacao() {
    if (gravandoRef.current) {
      pararGravacao();
      ultimosPontosRef.current = [];
      setMensagem("Gravação pausada. Os exemplos salvos continuam no navegador.");
      return;
    }
    contadorRef.current = resumo[letra] || 0;
    ultimaAmostraRef.current = 0;
    ultimosPontosRef.current = [];
    gravandoRef.current = true;
    setEstado("ativo");
    setMensagem(tipoAtual === "movimento" ? `Faça o movimento da letra ${letra} dentro do quadro.` : `Mantenha a pose da letra ${letra} e varie um pouco a posição.`);
  }

  function baixarDataset() {
    const arquivo = new Blob([JSON.stringify({ formato: "lumilibras-landmarks-v1", eixos: CONFIG_EIXOS, total: dataset.length, exemplos: dataset }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(arquivo);
    link.download = "lumilibras-alfabeto-landmarks.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importarDataset(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    try {
      const conteudo = JSON.parse(await arquivo.text());
      if (!Array.isArray(conteudo.exemplos)) throw new Error("O JSON precisa ter uma lista chamada exemplos.");
      const letrasPredefinidas = new Set(["A", "B", "C", "D"]);
      const validos = conteudo.exemplos.filter(item => {
        if (!LETRAS.includes(item?.letra) || !Array.isArray(item.landmarks) || item.landmarks.length !== 21) return false;
        if (LETRAS_COM_MOVIMENTO.has(item.letra)) {
          return Array.isArray(item.sequencia) && item.sequencia.length >= 2 && item.sequencia.every(quadro => Array.isArray(quadro) && quadro.length === 21);
        }
        return item.landmarks.every(ponto => [ponto.x, ponto.y, ponto.z].every(valor => Number.isFinite(Number(valor))));
      });
      const atuais = carregarDataset();
      const idsAtuais = new Set(atuais.map(item => item.id));
      const novos = validos
        .filter(item => !letrasPredefinidas.has(item.letra) && !idsAtuais.has(item.id))
        .map(item => ({ ...item, id: item.id || crypto.randomUUID() }));
      if (!novos.length) {
        setMensagem("Não encontrei novas amostras válidas. A–D são preservadas pelo reconhecedor atual.");
        return;
      }
      persistir([...atuais, ...novos]);
      const ignoradas = conteudo.exemplos.length - novos.length;
      setMensagem(`${novos.length} novas amostras importadas; ${ignoradas} ignoradas (inválidas, repetidas ou A–D).`);
    } catch (erro) {
      setMensagem(erro.message || "Não consegui ler esse JSON. Confira o arquivo e tente de novo.");
    } finally {
      evento.target.value = "";
    }
  }

  function limparLetra() {
    persistir(dataset.filter(item => item.letra !== letra));
    setMensagem(`Exemplos da letra ${letra} removidos deste navegador.`);
  }

  const podeGravar = estado === "pronto" || estado === "ativo";

  function selecionarLetra(novaLetra) {
    pararGravacao();
    ultimosPontosRef.current = [];
    letraRef.current = novaLetra;
    setLetra(novaLetra);
  }

  return <main className="cadastro-alfabeto">
    <header className="cadastro-alfabeto__topo">
      <button type="button" onClick={() => window.location.assign("/")} aria-label="Voltar"><ArrowLeft /></button>
      <LogoLumiLibras tamanho="sm" />
      <div className="flex max-w-[62%] items-center justify-end gap-1">
        <input ref={arquivoRef} type="file" accept="application/json,.json" onChange={importarDataset} hidden />
        <button className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-[#ccdcdf] bg-white px-2 text-xs font-extrabold text-[#174b5c]" type="button" onClick={() => arquivoRef.current?.click()}><Upload /> Importar</button>
        <button className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-[#ccdcdf] bg-white px-2 text-xs font-extrabold text-[#174b5c] disabled:opacity-50" type="button" onClick={baixarDataset} disabled={!dataset.length}><Download /> Exportar</button>
      </div>
    </header>

    <section className="cadastro-alfabeto__intro">
      <p>Ferramenta local de coleta</p>
      <h1>Cadastro das letras</h1>
      <span>Capture os pontos da mão para montar seu próprio conjunto de exemplos.</span>
    </section>

    <section className="cadastro-alfabeto__layout">
      <div className="cadastro-alfabeto__principal">
        <div className="cadastro-alfabeto__controles">
          <label>Letra<select value={letra} onChange={evento => selecionarLetra(evento.target.value)}>{LETRAS.map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Mão<select value={mao} onChange={evento => setMao(evento.target.value)}><option value="direita">Direita</option><option value="esquerda">Esquerda</option></select></label>
          <span className={`cadastro-alfabeto__tipo ${tipoAtual}`}>{tipoAtual === "movimento" ? "Sequência de movimento" : "Pose estática"}</span>
        </div>

        <div className="cadastro-alfabeto__camera">
          <video ref={videoRef} muted playsInline aria-label="Câmera para cadastrar sinais" />
          {pontosVisiveis.length > 0 && <svg className="cadastro-alfabeto__pontos" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">{pontosVisiveis.map((ponto, indice) => <circle key={indice} cx={ponto.x} cy={ponto.y} r="0.009" />)}</svg>}
          {!podeGravar && <div className="cadastro-alfabeto__camera-vazia"><Camera /><span>{estado === "carregando" ? "Preparando câmera..." : "Inicie a câmera para começar"}</span></div>}
          <span className="cadastro-alfabeto__contador"><Hand /> {pontosVisiveis.length ? "21 pontos detectados" : "Aguardando mão"}</span>
        </div>

        <p className="cadastro-alfabeto__mensagem" aria-live="polite">{mensagem}</p>
        <div className="cadastro-alfabeto__acoes">
          <button type="button" onClick={iniciarCamera} disabled={estado === "carregando"}><Camera /> {estado === "erro" ? "Tentar novamente" : "Iniciar câmera"}</button>
          <button type="button" className={gravandoRef.current ? "gravando" : ""} onClick={alternarGravacao} disabled={!podeGravar}>{gravandoRef.current ? <><Square /> Parar gravação</> : <><Play /> Gravar exemplos</>}</button>
          <button type="button" className="secundario" onClick={limparLetra} disabled={!resumo[letra]}><Trash2 /> Limpar {letra}</button>
        </div>

        <div className="cadastro-alfabeto__instrucoes">
          <strong>Como coletar</strong>
          <p>{tipoAtual === "movimento" ? `Faça o movimento de ${letra} completo. Cada ${TAMANHO_SEQUENCIA} quadros detectados formam um exemplo.` : `Segure a pose de ${letra}; cada amostra é registrada a cada ${INTERVALO_POSE_MS} ms.`}</p>
          <p>Para ter variedade, mude levemente a posição da mão e repita. Troque Direita/Esquerda se quiser exemplos das duas mãos.</p>
          <p><b>Dados:</b> são salvos neste navegador. Vídeo e imagens não são guardados; exporte o JSON para fazer backup.</p>
        </div>
      </div>

      <aside className="cadastro-alfabeto__resumo">
        <h2>Progresso</h2>
        <strong className="cadastro-alfabeto__total">{dataset.length}</strong><span>amostras salvas</span>
        <div className="cadastro-alfabeto__grade">{LETRAS.map(item => <button type="button" key={item} className={item === letra ? "atual" : ""} onClick={() => selecionarLetra(item)}>{item}<small>{resumo[item]}</small></button>)}</div>
        <p>As amostras de J e Z guardam sequências temporais. As demais guardam poses individuais.</p>
      </aside>
    </section>
    <p className="cadastro-alfabeto__nota">Os exemplos formam um dataset para treinamento. O reconhecimento das letras ainda depende de treinar e conectar um classificador a estes pontos.</p>
  </main>;
}
