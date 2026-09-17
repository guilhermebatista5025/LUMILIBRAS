import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Check, CheckCircle2, Expand, HelpCircle, Lightbulb, RotateCcw, Target, X, Zap } from "lucide-react";
import { Mascote } from "../components/mascote/index.js";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { CameraGesto } from "../components/pratica/CameraGesto.jsx";
import { chaveFase, META_APROVACAO } from "../data/aprendizado.js";
import { VIDEOS_SAUDE } from "../data/cursos.js";
import "./AtividadeSaude.css";

function validarRascunho(fase, rascunho) {
  const maximo = fase.questoes.length;
  const passo = Number.isInteger(rascunho?.passo) && rascunho.passo >= 0 && rascunho.passo <= maximo ? rascunho.passo : 0;
  const respostas = Array.isArray(rascunho?.respostas) ? rascunho.respostas.slice(0, passo).filter(r => Number.isInteger(r) && r >= 0 && r < 4) : [];
  if (fase.tipo === "avaliacao" && respostas.length !== passo) return { passo: 0, respostas: [] };
  return { passo, respostas };
}

function Pares({ questoes, paresSalvos, ocupado, semCoracoes, aoRegistrar, aoConcluir, aoAmpliar }) {
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [palavraSelecionada, setPalavraSelecionada] = useState(null);
  const combinados = paresSalvos || [];
  const [retorno, setRetorno] = useState(null);
  const [dica, setDica] = useState(false);
  // Ordem diferente entre colunas sem alterar a identidade dos pares.
  const palavras = [...questoes.slice(1), questoes[0]];
  const finalizado = combinados.length === questoes.length;
  async function verificar() {
    if (ocupado || semCoracoes || imagemSelecionada === null || palavraSelecionada === null || finalizado) return;
    const correta = imagemSelecionada === palavraSelecionada;
    try {
      const dados = await aoRegistrar('pair', { imagem: imagemSelecionada, palavra: palavraSelecionada });
      if (dados.semCoracoes) { setRetorno('Seus corações acabaram. Aguarde a recuperação para tentar novamente.'); return; }
    }
    catch (error) { setRetorno(error.message); return; }
    setRetorno(correta ? "Par correto!" : "Esses sinais não formam um par. Observe novamente e tente outra combinação.");
    setImagemSelecionada(null);
    setPalavraSelecionada(null);
  }
  return <>
    <div className="atividade-lumi-balao"><Mascote pose="joia" tamanho="sm" decorativo /><h1>Combine os pares!</h1></div>
    <p className="atividade-instrucao">Selecione uma imagem, escolha o significado e toque em verificar.</p>
    <div className="atividade-pares">
      <div className="atividade-pares-coluna" aria-label="Sinais em Libras">{questoes.map((q, indice) => <button type="button" key={q.id} aria-label={`Sinal ${indice + 1}${combinados.includes(q.id) ? ", par concluído" : ""}`} aria-pressed={imagemSelecionada === q.id} disabled={ocupado || semCoracoes || combinados.includes(q.id)} className={`atividade-par ${imagemSelecionada === q.id ? "atividade-par--selecionado" : ""} ${combinados.includes(q.id) ? "atividade-par--feito" : ""}`} onClick={() => { setImagemSelecionada(q.id); setRetorno(null); }}><img src={q.imagem} alt={`Sequência visual do sinal ${indice + 1}`} />{combinados.includes(q.id) && <CheckCircle2 aria-hidden="true" />}</button>)}</div>
      <div className="atividade-pares-coluna" aria-label="Significados">{palavras.map(q => <button type="button" key={q.id} aria-pressed={palavraSelecionada === q.id} disabled={ocupado || semCoracoes || combinados.includes(q.id)} className={`atividade-par atividade-par--palavra ${palavraSelecionada === q.id ? "atividade-par--selecionado" : ""} ${combinados.includes(q.id) ? "atividade-par--feito" : ""}`} onClick={() => { setPalavraSelecionada(q.id); setRetorno(null); }}>{q.termo}{combinados.includes(q.id) && <CheckCircle2 aria-hidden="true" />}</button>)}</div>
    </div>
    <div className="atividade-pares-controles"><span>{combinados.length}/{questoes.length} pares</span><button type="button" disabled={imagemSelecionada === null} onClick={() => aoAmpliar(questoes.find(q => q.id === imagemSelecionada), false)}><Expand aria-hidden="true" /> Ampliar sinal selecionado</button></div>
    {dica && <p className="atividade-dica" role="status">Compare a configuração das mãos, o local e as setas de movimento. Você pode ampliar a imagem antes de escolher.</p>}
    <footer className={`atividade-rodape ${finalizado ? "atividade-rodape--sucesso" : ""}`}>
      <p role="status" aria-live="polite">{finalizado ? "Muito bem! Todos os pares estão corretos." : retorno}</p>
      <div className="atividade-rodape-acoes"><button type="button" className="atividade-secundario" onClick={() => setDica(valor => !valor)} aria-expanded={dica}><HelpCircle aria-hidden="true" />Dica</button><button type="button" className="atividade-botao" disabled={ocupado || (!finalizado && (semCoracoes || imagemSelecionada === null || palavraSelecionada === null))} onClick={() => finalizado ? aoConcluir() : verificar()}>{finalizado ? "Concluir fase" : "Verificar"}<Check aria-hidden="true" /></button></div>
    </footer>
  </>;
}

export function AtividadeSaude({ unidade, fase, registro, estatisticas, ocupado, avisoSalvamento, aoRegistrar, aoSair }) {
  const inicial = validarRascunho(fase, registro?.rascunho);
  const [passo, setPasso] = useState(inicial.passo);
  const [respostas, setRespostas] = useState(inicial.respostas);
  const [selecionada, setSelecionada] = useState(null);
  const [resultado, setResultado] = useState(registro?.resultado || null);
  const [ganhos, setGanhos] = useState({ xp: 0, diamantes: 0 });
  const [ampliada, setAmpliada] = useState(null);
  const [mostrarVideo, setMostrarVideo] = useState(false);
  const [erroMidia, setErroMidia] = useState(false);
  const [aviso, setAviso] = useState("");
  const [feedbackCoracao, setFeedbackCoracao] = useState("");
  const modalRef = useRef(null);
  const conteudoRef = useRef(null);
  const videoRef = useRef(null);
  const teste = fase.tipo === "avaliacao";
  const total = teste ? fase.questoes.length : fase.questoes.length + 1;
  const questao = fase.questoes[passo];
  const video = questao && VIDEOS_SAUDE.find(item => item.titulo.toLocaleLowerCase("pt-BR").replaceAll("-", " ") === questao.termo.toLocaleLowerCase("pt-BR").replaceAll("-", " "));
  const [revisao] = useState(!!registro?.concluida);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    conteudoRef.current?.focus({ preventScroll: true });
    setMostrarVideo(false);
    setErroMidia(false);
    setAviso("");
  }, [passo, resultado]);
  useEffect(() => { if (ampliada) modalRef.current?.showModal(); }, [ampliada]);

  function ampliar(q, revelar = true) { setAmpliada({ ...q, revelar }); }
  function fecharImagem() { modalRef.current?.close(); setAmpliada(null); }
  async function registrar(action, payload) {
    const dados = await aoRegistrar(action, payload);
    setFeedbackCoracao(dados.coracaoPerdido ? 'Resposta incorreta. Você perdeu 1 coração.' : '');
    if (dados.semCoracoes) { setAviso('Seus corações acabaram. Aguarde a recuperação para continuar.'); return dados; }
    const salvo = dados.aprendizado[chaveFase('saude', unidade.id, fase.id)];
    setPasso(salvo.rascunho.passo);
    setRespostas(salvo.rascunho.respostas);
    setGanhos(dados.recompensa || { xp: 0, diamantes: 0 });
    if (action !== 'pair') setResultado(salvo.resultado);
    return dados;
  }
  async function avancarIntroducao() {
    if (erroMidia || ocupado) return;
    try { await registrar('study', { sinal: questao.id }); }
    catch (error) { setAviso(error.message); }
  }
  async function concluirCamera() {
    if (ocupado) throw new Error('Aguarde o salvamento atual e tente novamente.');
    const dados = await registrar('study', { sinal: questao.id });
    if (dados.semCoracoes) throw new Error('Aguarde a recuperação dos corações para continuar.');
  }
  async function responder() {
    if (selecionada === null || erroMidia || ocupado) return;
    try {
      const dados = await registrar('answer', { indice: passo, resposta: selecionada });
      if (!dados.semCoracoes) setSelecionada(null);
    } catch (error) { setAviso(error.message); }
  }
  function concluirEstudo() { setResultado(registro.resultado); }
  async function recomecar() {
    if (ocupado) return;
    try { await registrar('retry', {}); setSelecionada(null); }
    catch (error) { setAviso(error.message); }
  }

  return <div className="atividade-tela min-h-dvh w-full bg-surface font-sans text-on-surface">
    <header className="atividade-topo">
      {resultado ? <LogoLumiLibras tamanho="sm" /> : <><button type="button" className="atividade-sair" onClick={aoSair} aria-label="Voltar à trilha e salvar progresso"><X aria-hidden="true" /></button><div className="atividade-progresso" role="progressbar" aria-label="Progresso da fase" aria-valuemin={0} aria-valuemax={total} aria-valuenow={passo}><span style={{ width: `${passo / total * 100}%` }} /></div><span className="atividade-contador">{Math.min(passo + 1, total)}/{total}</span></>}
      {resultado && <button type="button" className="atividade-sair" onClick={aoSair} aria-label="Voltar à trilha"><X aria-hidden="true" /></button>}
    </header>
    <main ref={conteudoRef} tabIndex={-1} className="atividade-conteudo">
      <p className="atividade-coracoes" role="status">♥ {estatisticas.coracoes}/{estatisticas.maxCoracoes} corações{estatisticas.proximoCoracaoEm && <> · +1 às {new Date(estatisticas.proximoCoracaoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</>}</p>
      {estatisticas.coracoes === 0 && !resultado && <p className="atividade-dica">Seus corações acabaram. Seu progresso está salvo; aguarde a recuperação ou volte para estudar os sinais.</p>}
      {feedbackCoracao && <p className="atividade-coracao-perdido" role="status">{feedbackCoracao}</p>}
      <p className="atividade-contexto">Unidade {unidade.id} • {unidade.titulo}</p>
      {avisoSalvamento && <p role="alert" className="atividade-dica">{avisoSalvamento}</p>}
      {resultado ? <section className="atividade-resultado" aria-labelledby="atividade-resultado-titulo">
        <div className={`atividade-celebracao ${resultado.aprovada ? "atividade-celebracao--sucesso" : ""}`}><Mascote pose={resultado.aprovada ? "otimo" : "curiosa"} tamanho="full" decorativo />{resultado.aprovada && <div className="atividade-confetes" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ "--confete": i }} />)}</div>}</div>
        <h1 id="atividade-resultado-titulo">{resultado.aprovada ? teste ? "Unidade concluída!" : "Fase concluída!" : "Vamos praticar mais?"}</h1>
        <p>{resultado.aprovada ? "Cada novo sinal aproxima você de mais pessoas." : resultado.percentual >= 60 ? "Você está perto! Revise os erros e tente novamente." : "Retome os sinais na trilha e refaça o desafio no seu ritmo."}</p>
        <div className="atividade-resultado-numeros"><div><Zap aria-hidden="true" /><strong>+{ganhos.xp} XP</strong><span>{revisao ? "Revisão" : "Pontos"}</span></div><div><Target aria-hidden="true" /><strong>{teste ? `${resultado.percentual}%` : `${resultado.acertos}/${resultado.total}`}</strong><span>{teste ? "Acertos" : "Pares corretos"}</span></div></div>
        <p className="atividade-dica">+{ganhos.diamantes} diamantes{revisao ? " · Revisões não concedem pontos novamente." : " · Recompensa registrada no banco."}</p>
        <div className="atividade-resultado-meta"><span>{teste ? `Meta: ${META_APROVACAO}% de acertos` : "Todos os sinais praticados"}</span><strong>{resultado.aprovada ? "Concluído!" : `${resultado.acertos}/${resultado.total} acertos`}</strong><div className="atividade-progresso"><span style={{ width: `${teste ? resultado.percentual : 100}%` }} /></div></div>
        {teste && <details className="atividade-revisao" open={!resultado.aprovada}><summary>Conferir respostas ({resultado.total - resultado.acertos} erros)</summary><ol>{fase.questoes.map((q, indice) => <li key={q.id}><span className={respostas[indice] === q.correta ? "atividade-texto-certo" : "atividade-texto-erro"}>{respostas[indice] === q.correta ? "Correta" : "Revisar"}</span><strong>{q.termo}</strong><p>Sua resposta: {q.alternativas[respostas[indice]]}. Gabarito: {"ABCD"[q.correta]}.</p><button type="button" onClick={() => ampliar(q)}>Rever sinal</button></li>)}</ol></details>}
        <footer className="atividade-rodape"><button type="button" className="atividade-botao" disabled={ocupado} onClick={resultado.aprovada ? aoSair : recomecar}>{resultado.aprovada ? "Continuar na trilha" : "Tentar novamente"}{resultado.aprovada ? <ArrowRight aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}</button>{!resultado.aprovada && <button type="button" className="atividade-link" onClick={aoSair}>Voltar para estudar os sinais</button>}</footer>
      </section> : !teste && passo === fase.questoes.length ? <Pares questoes={fase.pares} paresSalvos={registro?.rascunho?.pares} ocupado={ocupado} semCoracoes={estatisticas.coracoes === 0} aoRegistrar={registrar} aoConcluir={concluirEstudo} aoAmpliar={ampliar} /> : <>
        <section className="atividade-pergunta"><h1>{teste ? "Qual é o significado deste sinal?" : <>Aprenda um novo sinal:<br /><span>{questao.termo}</span></>}</h1><p>{teste ? "Observe a sequência e escolha uma resposta." : "Observe a sequência completa das mãos e do movimento."}</p></section>
        <div className="atividade-midia">
          {mostrarVideo && video ? <video ref={videoRef} src={`/videos/${encodeURIComponent(video.arquivo)}`} controls loop playsInline preload="metadata" aria-label={`Vídeo do sinal ${questao.termo}`} onError={() => { setMostrarVideo(false); setAviso("O vídeo não carregou. Use a sequência de imagens para estudar o sinal."); }} /> : <button type="button" className="atividade-imagem" onClick={() => ampliar(questao, !teste)} aria-label="Ampliar imagem do sinal"><img key={questao.id} src={questao.imagem} alt={teste ? `Sequência visual da questão ${questao.id}` : `Sequência do sinal de ${questao.termo}`} onError={() => setErroMidia(true)} onLoad={() => setErroMidia(false)} /><span><Expand aria-hidden="true" /> Ampliar</span></button>}
          {!teste && <p className="atividade-midia-legenda">{questao.termo}</p>}
        </div>
        {erroMidia && <p role="alert" className="atividade-dica">Não foi possível carregar a imagem. Recarregue a página para continuar do ponto salvo.</p>}
        {!teste && video && <div className="atividade-video-acoes"><button type="button" onClick={() => setMostrarVideo(valor => !valor)}>{mostrarVideo ? "Ver imagens" : "Assistir ao vídeo"}</button>{mostrarVideo && <><button type="button" onClick={() => { videoRef.current.currentTime = 0; videoRef.current.play().catch(() => {}); }}>Repetir</button><label>Velocidade<select defaultValue="1" onChange={evento => { videoRef.current.playbackRate = Number(evento.target.value); }}><option value="0.5">0,5×</option><option value="1">1×</option></select></label></>}</div>}
        {aviso && <p role="status" className="atividade-dica">{aviso}</p>}
        {teste ? <>
          <div className="atividade-alternativas" role="group" aria-label="Alternativas">{questao.alternativas.map((texto, indice) => <button type="button" key={indice} className={`atividade-alternativa ${selecionada === indice ? "atividade-alternativa--selecionada" : ""}`} disabled={ocupado} aria-pressed={selecionada === indice} onClick={() => setSelecionada(indice)}><span>{"ABCD"[indice]}</span><strong>{texto}</strong>{selecionada === indice && <CheckCircle2 aria-hidden="true" />}</button>)}</div>
          <p className="atividade-avaliacao-nota">O gabarito e seu resultado aparecem ao final da avaliação.</p>
          <footer className="atividade-rodape"><button type="button" className="atividade-botao" disabled={ocupado || estatisticas.coracoes === 0 || selecionada === null || erroMidia} onClick={responder}>{passo === total - 1 ? "Ver resultado" : "Confirmar resposta"}<ArrowRight aria-hidden="true" /></button></footer>
        </> : <>
          <div className="atividade-orientacao"><Mascote pose="curiosa" tamanho="sm" decorativo /><p>Observe a configuração das mãos, o ponto de articulação, a orientação e o movimento.</p></div>
          <div className="atividade-dica"><Lightbulb aria-hidden="true" /><div><strong>Dica da Lumi</strong><p>As setas ajudam a acompanhar o movimento. Considere toda a sequência, não apenas uma posição.</p></div></div>
          <CameraGesto key={questao.id} sinalId={questao.id} termo={questao.termo} imagem={questao.imagem} aoConcluir={concluirCamera} />
          <footer className="atividade-rodape"><button type="button" className="atividade-botao" disabled={ocupado || erroMidia} onClick={avancarIntroducao}>Pratiquei, continuar<ArrowRight aria-hidden="true" /></button></footer>
        </>}
      </>}
    </main>
    <dialog ref={modalRef} className="atividade-ampliacao" aria-label="Imagem ampliada do sinal" onClose={() => setAmpliada(null)} onClick={evento => { if (evento.target === evento.currentTarget) fecharImagem(); }}>{ampliada && <><button type="button" onClick={fecharImagem} autoFocus aria-label="Fechar imagem ampliada"><X aria-hidden="true" /></button><img src={ampliada.imagem} alt={ampliada.revelar ? `Sinal de ${ampliada.termo}` : "Sequência do sinal para identificação"} />{ampliada.revelar && <p>{ampliada.termo}</p>}</>}</dialog>
  </div>;
}
