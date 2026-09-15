import { useEffect, useRef, useState } from 'react';
import { Camera, Check, RotateCcw, X } from 'lucide-react';
import { Mascote } from '../mascote/index.js';
import { CONEXOES, DEDOS } from '../../lib/handGeometry.js';
import { avancarSequencia, compararPosicao, maoValida, META_CAMERA, resumirMao } from '../../lib/gesturePractice.js';
import { colunasReferencia } from '../../data/cameraReferencias.js';
import './CameraGesto.css';

const instrucoes = { Estendido: 'Estique', Flexionado: 'Dobre', Intermediário: 'Dobre um pouco' };
const maosDoResultado = data => data.landmarks.map((landmarks, i) => ({ landmarks, worldLandmarks: data.worldLandmarks?.[i] }));

// O canvas usa a mesma proporção do vídeo. Os rótulos acompanham a mão espelhada.
function desenhar(canvas, video, maos, esperadas, comparacao) {
  if (!canvas || !video) return;
  const { width: largura, height: altura } = canvas.getBoundingClientRect();
  const densidade = window.devicePixelRatio || 1;
  canvas.width = Math.round(largura * densidade);
  canvas.height = Math.round(altura * densidade);
  const ctx = canvas.getContext('2d');
  ctx.scale(densidade, densidade);
  const fonte = Math.max(10, Math.min(14, largura / 32));
  ctx.font = `600 ${fonte}px system-ui`;
  ctx.lineWidth = Math.max(2, largura / 240);
  const escala = Math.max(largura / video.videoWidth, altura / video.videoHeight);
  const quadroLargura = video.videoWidth * escala, quadroAltura = video.videoHeight * escala;
  const tela = ponto => [(1 - ponto.x) * quadroLargura + (largura - quadroLargura) / 2,
    ponto.y * quadroAltura + (altura - quadroAltura) / 2];
  for (const [indice, mao] of maos.entries()) {
    const referencia = comparacao.indices.indexOf(indice);
    const esperado = esperadas?.[referencia < 0 ? indice : referencia];
    const atual = resumirMao(mao, video.videoWidth, video.videoHeight);
    ctx.strokeStyle = '#58d6bd';
    for (const [a, b] of CONEXOES) {
      ctx.beginPath(); ctx.moveTo(...tela(mao.landmarks[a])); ctx.lineTo(...tela(mao.landmarks[b])); ctx.stroke();
    }
    for (const [i, dedo] of DEDOS.entries()) {
      const certo = esperado?.estados[i] === atual.estados[i];
      const cor = certo ? '#78efb0' : '#ffdf81';
      const [x, y] = tela(mao.landmarks[dedo.pontos[3]]);
      ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      if (!esperado) continue;
      const texto = certo ? `✓ ${dedo.nome}` : `${dedo.nome}: ${instrucoes[esperado.estados[i]]}`;
      const tamanho = ctx.measureText(texto).width + 14;
      // Distribui os rótulos ao lado da mão para evitar sobreposição entre dedos.
      const pulso = tela(mao.landmarks[0]);
      const lado = pulso[0] < largura / 2 ? 1 : -1;
      const labelX = Math.max(6, Math.min(largura - tamanho - 6, pulso[0] + lado * largura * .12 - (lado < 0 ? tamanho : 0)));
      const topo = Math.max(76, Math.min(altura - 155 - fonte * 7.5, pulso[1] - fonte * 7));
      const labelY = topo + i * fonte * 1.65;
      ctx.strokeStyle = cor; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(labelX + (lado < 0 ? tamanho : 0), labelY + fonte / 2); ctx.stroke();
      ctx.fillStyle = 'rgba(8, 30, 39, .88)'; ctx.fillRect(labelX, labelY - 4, tamanho, fonte + 10);
      ctx.fillStyle = cor; ctx.fillText(texto, labelX + 7, labelY + fonte);
    }
  }
}

async function prepararFotografias(imagem, colunas) {
  const foto = new Image();
  foto.src = imagem;
  await foto.decode();
  const frames = [];
  try {
    for (let i = 0; i < colunas; i++) {
      const inicio = Math.round(i * foto.naturalWidth / colunas);
      const fim = Math.round((i + 1) * foto.naturalWidth / colunas);
      frames.push(await createImageBitmap(foto, inicio, 0, fim - inicio, foto.naturalHeight));
    }
    return frames;
  } catch (error) { frames.forEach(frame => frame.close()); throw error; }
}

export function CameraGesto({ sinalId, termo, imagem, aoConcluir }) {
  const videoRef = useRef(null), canvasRef = useRef(null), painelRef = useRef(null);
  const iniciarRef = useRef(null), tituloRef = useRef(null), concluirRef = useRef(aoConcluir);
  const salvarRef = useRef(null);
  const [aberta, setAberta] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState('preparando');
  const [erro, setErro] = useState('');
  const [erroSalvamento, setErroSalvamento] = useState('');
  const [etapa, setEtapa] = useState(0);
  const [percentual, setPercentual] = useState(0);
  const [quantidade, setQuantidade] = useState(0);
  const [esperadas, setEsperadas] = useState(0);
  const [orientacao, setOrientacao] = useState('');
  const [proporcao, setProporcao] = useState(4 / 3);
  const colunas = colunasReferencia(sinalId);

  useEffect(() => { concluirRef.current = aoConcluir; }, [aoConcluir]);

  useEffect(() => {
    if (!aberta) return;
    let cancelada = false, stream, worker, loop, timer, timeout;
    let processando = false, modelos = [], passo = 0, finalizada = false, salvando = false;
    const liberar = () => {
      cancelAnimationFrame(loop); clearTimeout(timeout);
      worker?.terminate(); worker = null;
      stream?.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
    const falhar = mensagem => {
      if (cancelada) return;
      liberar(); setErro(mensagem); setEstado('erro');
    };
    const salvar = async () => {
      if (cancelada || salvando) return;
      salvando = true; setErroSalvamento('');
      try { await concluirRef.current(); }
      catch (error) {
        if (!cancelada) setErroSalvamento(error.message || 'Não foi possível salvar seu progresso. Tente novamente.');
      } finally { salvando = false; }
    };
    salvarRef.current = salvar;
    const enviarFrame = () => {
      const video = videoRef.current;
      if (cancelada || finalizada || !worker) return;
      if (!processando && video?.readyState >= 2) {
        processando = true;
        const atual = worker;
        createImageBitmap(video).then(frame => {
          if (cancelada || worker !== atual) { frame.close(); return; }
          atual.postMessage({ type: 'frame', frame, timestamp: performance.now() }, [frame]);
        }).catch(() => falhar('A captura foi interrompida. Tente abrir a câmera novamente.'));
      }
      loop = requestAnimationFrame(enviarFrame);
    };
    setEstado('preparando'); setErro(''); setErroSalvamento(''); setEtapa(0); setPercentual(0); setQuantidade(0);
    painelRef.current?.focus();
    async function iniciar() {
      try {
        if (!imagem || !colunas) throw new Error('referencia');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
        if (cancelada) { stream.getTracks().forEach(track => track.stop()); return; }
        const video = videoRef.current;
        video.srcObject = stream; await video.play();
        if (cancelada) return;
        setProporcao(video.videoWidth / video.videoHeight || 4 / 3);
        stream.getVideoTracks()[0].onended = () => falhar('A câmera foi desconectada. Reconecte e tente novamente.');
        worker = new Worker('/vision/hand-worker.js');
        timeout = setTimeout(() => falhar('A preparação demorou demais. Tente abrir a câmera novamente.'), 45000);
        worker.onerror = () => falhar('Não foi possível carregar o detector neste dispositivo.');
        worker.onmessage = async ({ data }) => {
          if (cancelada || finalizada) return;
          if (data.type === 'ready') {
            try {
              const frames = await prepararFotografias(imagem, colunas);
              if (cancelada || !worker) { frames.forEach(frame => frame.close()); return; }
              worker.postMessage({ type: 'reference', frames }, frames);
            } catch { falhar('A imagem da lição não carregou. Tente novamente.'); }
          }
          if (data.type === 'reference') {
            modelos = data.frames.map(frame => maosDoResultado(frame).map(mao => resumirMao(mao, frame.width, frame.height)));
            if (modelos.length !== colunas || modelos.some(maos => !maos.length || !maos.every(maoValida))) {
              falhar('Não foi possível ler todas as posições desta imagem. Continue estudando pela sequência da lição; a aprovação automática está indisponível para este sinal.');
              return;
            }
            clearTimeout(timeout); setEsperadas(modelos[0].length); setEstado('ativo'); enviarFrame();
          }
          if (data.type === 'result') {
            processando = false;
            const maos = maosDoResultado(data);
            const atuais = maos.map(mao => resumirMao(mao, video.videoWidth, video.videoHeight));
            const resultado = compararPosicao(modelos[passo], atuais);
            setQuantidade(maos.length); setPercentual(resultado.percentual);
            const ajustes = resultado.indices.flatMap((atual, i) => DEDOS.map((dedo, d) =>
              atuais[atual].estados[d] === modelos[passo][i].estados[d] ? null : `${dedo.nome}: ${instrucoes[modelos[passo][i].estados[d]].toLowerCase()}`)).filter(Boolean);
            setOrientacao(ajustes.length ? ajustes.join('. ') : 'Ajuste a direção da palma e acompanhe a posição de referência.');
            desenhar(canvasRef.current, video, maos, modelos[passo], resultado);
            const proximo = avancarSequencia(passo, modelos.length, resultado);
            if (proximo.etapa !== passo) {
              passo = proximo.etapa;
              if (proximo.concluida) {
                finalizada = true; liberar(); setEstado('concluido');
                timer = setTimeout(salvar, 2200);
              } else {
                setEtapa(passo); setPercentual(0); setEsperadas(modelos[passo].length);
              }
            }
          }
          if (data.type === 'error') falhar(data.message);
        };
        worker.postMessage({ type: 'init' });
      } catch (error) {
        falhar(error.name === 'NotAllowedError' ? 'Libere a câmera nas permissões do navegador e tente novamente.' :
          error.message === 'referencia' ? 'A referência desta lição ainda não está disponível.' : 'Não foi possível abrir a câmera. Confira se ela está conectada e disponível.');
      }
    }
    iniciar();
    return () => { cancelada = true; clearTimeout(timer); liberar(); salvarRef.current = null; };
  }, [aberta, tentativa, sinalId, imagem, colunas]);

  useEffect(() => { if (estado === 'concluido') tituloRef.current?.focus(); }, [estado]);
  useEffect(() => {
    if (!aberta) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; iniciarRef.current?.focus(); };
  }, [aberta]);

  function teclado(evento) {
    if (evento.key === 'Escape' && estado !== 'concluido') setAberta(false);
    if (evento.key !== 'Tab') return;
    const botoes = [...painelRef.current.querySelectorAll('button:not(:disabled)')];
    const primeiro = botoes[0], ultimo = botoes.at(-1);
    if (!primeiro) { evento.preventDefault(); return; }
    if (!botoes.includes(document.activeElement) || (evento.shiftKey && document.activeElement === primeiro)) {
      evento.preventDefault(); (evento.shiftKey ? ultimo : primeiro).focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
  }

  const mensagem = estado === 'preparando' ? 'Preparando as orientações da lição…' :
    !quantidade ? 'Mostre as mãos dentro da câmera.' : quantidade !== esperadas ? `Mostre ${esperadas} ${esperadas === 1 ? 'mão' : 'mãos'}, como na referência.` : orientacao;
  return <section className={`camera-gesto ${aberta ? 'camera-gesto--aberta' : ''}`} role={aberta ? 'dialog' : undefined}
    aria-modal={aberta || undefined} aria-labelledby={`camera-gesto-${sinalId}`} ref={painelRef} tabIndex={-1} onKeyDown={teclado}>
    {!aberta ? <>
      <div className="camera-gesto-cabecalho"><div><p className="camera-gesto-etiqueta">Prática guiada</p><h2 id={`camera-gesto-${sinalId}`}>Pratique “{termo}”</h2></div><Camera aria-hidden="true" /></div>
      <p className="camera-gesto-texto">Siga as orientações na câmera. Cada posição avança automaticamente ao atingir {META_CAMERA}% de semelhança.</p>
      <button ref={iniciarRef} type="button" className="camera-gesto-acao" onClick={() => setAberta(true)}><Camera aria-hidden="true" /> Ir praticar</button>
    </> : <div className="camera-gesto-fullscreen">
      <header className="camera-gesto-cabecalho"><div><p className="camera-gesto-etiqueta">Prática guiada · {termo}</p><h2 id={`camera-gesto-${sinalId}`}>{estado === 'concluido' ? 'Muito bem!' : 'Acompanhe a posição das mãos'}</h2></div>
        {estado !== 'concluido' && <button type="button" className="camera-gesto-fechar" onClick={() => setAberta(false)} aria-label="Fechar prática"><X aria-hidden="true" /></button>}
      </header>
      {estado === 'concluido' ? <div className="camera-gesto-celebracao">
        <div className="camera-gesto-confetes" aria-hidden="true">{Array.from({ length: 36 }, (_, i) => <i key={i} style={{ '--i': i, '--x': `${(i * 29 + 7) % 100}%`, '--giro': `${i % 2 ? 400 : -380}deg` }} />)}</div>
        <Mascote pose="otimo" tamanho="full" className="camera-gesto-mascote" decorativo />
        <span className="camera-gesto-selo"><Check aria-hidden="true" /> {percentual}% de semelhança</span>
        <h3 ref={tituloRef} tabIndex={-1}>Prática concluída!</h3>
        <p>Você completou as posições de “{termo}”.</p>
        <p role="status">{erroSalvamento || 'Salvando seu progresso e avançando…'}</p>
        {erroSalvamento && <button type="button" className="camera-gesto-acao" onClick={() => salvarRef.current?.()}><RotateCcw aria-hidden="true" /> Tentar salvar novamente</button>}
      </div> : <>
        <div className="camera-gesto-palco" style={{ '--proporcao': proporcao }}>
          <video ref={videoRef} muted playsInline aria-label="Sua câmera espelhada" /><canvas ref={canvasRef} aria-hidden="true" />
          <div className="camera-gesto-hud-topo"><span className="camera-gesto-ao-vivo"><i /> {estado === 'ativo' ? 'Câmera ativa' : 'Preparando'}</span><span>Posição {etapa + 1}/{colunas || 1}</span></div>
          {imagem && colunas && <div className="camera-gesto-referencia" aria-label={`Referência: posição ${etapa + 1}`}>
            <div style={{ backgroundImage: `url("${imagem}")`, backgroundSize: `${colunas * 100}% 100%`, backgroundPosition: `${colunas === 1 ? 0 : etapa / (colunas - 1) * 100}% 0` }} /><span>Faça assim</span>
          </div>}
          <div className="camera-gesto-hud-base">
            <p className="camera-gesto-instrucao" role="status" aria-live="polite">{erro || mensagem}</p>
            {estado === 'ativo' && <><div className="camera-gesto-medida"><span>Semelhança da posição</span><strong>{percentual}% <small>/ {META_CAMERA}%</small></strong></div><div className="camera-gesto-progresso" role="progressbar" aria-label="Semelhança da posição" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentual}><span style={{ width: `${percentual}%` }} /></div></>}
            {estado === 'erro' && <button type="button" className="camera-gesto-acao" onClick={() => setTentativa(valor => valor + 1)}><RotateCcw aria-hidden="true" /> Tentar novamente</button>}
          </div>
        </div>
        <p className="camera-gesto-nota">Acompanhe as indicações junto aos dedos. A câmera confere as posições; pratique também o movimento completo da lição.</p>
      </>}
    </div>}
  </section>;
}
