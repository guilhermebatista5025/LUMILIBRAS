import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronRight, Dumbbell, LockKeyhole, Play, Star, Target, Trophy, X, Zap } from "lucide-react";
import { Mascote } from "../components/mascote/index.js";
import { faseConcluida, faseLiberada, objetivoUnidade, obterFases } from "../data/aprendizado.js";
import fundo from "../assets/componentes/fundo-oficial-da-home.webp";
import "./TrilhaUnidade.css";

export function TrilhaUnidade({ curso, unidade, progresso, metaDiaria = 10, aoVoltar, aoComecar, aoEditarMeta }) {
  const fases = obterFases(curso.id, unidade.id);
  const [selecionada, setSelecionada] = useState(null);
  const dialogoRef = useRef(null);
  const tituloRef = useRef(null);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); tituloRef.current?.focus({ preventScroll: true }); }, [unidade.id]);
  useEffect(() => { if (selecionada) dialogoRef.current?.showModal(); }, [selecionada]);
  const concluida = fase => faseConcluida(progresso, curso.id, unidade.id, fase.id);
  const proxima = fases.find(fase => !concluida(fase));
  function fechar() { dialogoRef.current?.close(); setSelecionada(null); }

  return <div className="unidade-tela">
    <div className="unidade-cabecalho">
      <button className="unidade-voltar" type="button" onClick={aoVoltar}><ArrowLeft aria-hidden="true" /> Unidades</button>
      <button className="unidade-meta" type="button" onClick={aoEditarMeta}><span><Target aria-hidden="true" /></span><span>Meta diária:<strong>{metaDiaria} min</strong></span><ChevronRight aria-hidden="true" /></button>
    </div>
    <div className="unidade-contexto"><p>{curso.titulo} • Unidade {unidade.id}</p><h1 ref={tituloRef} tabIndex={-1}>{unidade.titulo}</h1><span>{fases.filter(concluida).length}/{fases.length} fases concluídas</span></div>
    <div className="unidade-caminho">
      <img className="unidade-paisagem" src={fundo} alt="" aria-hidden="true" />
      <ol aria-label={`Fases de ${unidade.titulo}`}>
        {fases.map((fase, indice) => {
          const feita = concluida(fase);
          const liberada = faseLiberada(progresso, curso.id, unidade.id, fase.id);
          const atual = proxima?.id === fase.id && liberada;
          const direita = indice % 2 !== 0;
          const Icone = feita ? Check : !liberada ? LockKeyhole : fase.tipo === "avaliacao" ? Trophy : BookOpen;
          return <li key={fase.id} className={`unidade-fase ${direita ? "unidade-fase--direita" : ""}`}>
            {indice < fases.length - 1 && <svg className="unidade-conector" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true"><path d={direita ? "M62 0 C62 58 38 92 38 150" : "M38 0 C38 58 62 92 62 150"} fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="5 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>}
            <button type="button" data-fase={fase.id} className={`unidade-no ${feita ? "unidade-no--concluido" : atual ? "unidade-no--atual" : "unidade-no--bloqueado"}`} disabled={!liberada} onClick={() => setSelecionada(fase)} aria-label={`Fase ${indice + 1}: ${fase.titulo}. ${feita ? "Concluída, revisar" : atual ? "Começar" : "Bloqueada"}`}><Icone aria-hidden="true" /></button>
            <div className="unidade-fase-texto">{atual && <span className="unidade-proxima">Próxima aula</span>}<h2><span>{indice + 1}.</span> {fase.titulo}</h2><p>{feita ? "Concluída" : atual ? "Comece agora!" : "Conclua a fase anterior"}</p></div>
          </li>;
        })}
      </ol>
      {!proxima && <div className="unidade-final"><Trophy aria-hidden="true" /><strong>Unidade concluída!</strong><button type="button" onClick={aoVoltar}>Voltar às unidades <ChevronRight aria-hidden="true" /></button></div>}
    </div>
    <dialog className="licao-detalhes" ref={dialogoRef} aria-labelledby="licao-detalhes-titulo" onClose={() => setSelecionada(null)} onClick={evento => { if (evento.target === evento.currentTarget) fechar(); }}>
      {selecionada && <>
        <div className="licao-alca" aria-hidden="true" />
        <button type="button" className="licao-fechar" onClick={fechar} aria-label="Fechar detalhes" autoFocus><X aria-hidden="true" /></button>
        <span className="licao-emblema">{selecionada.tipo === "avaliacao" ? <Trophy aria-hidden="true" /> : <BookOpen aria-hidden="true" />}</span>
        <h2 id="licao-detalhes-titulo">{selecionada.titulo}</h2>
        <p>{selecionada.descricao || unidade.descricao}</p>
        <div className="licao-detalhes-estatisticas"><div><Star aria-hidden="true" /><span>Fase</span><strong>{fases.findIndex(fase => fase.id === selecionada.id) + 1}/{fases.length}</strong></div><div><Dumbbell aria-hidden="true" /><span>Atividades</span><strong>{selecionada.atividades || "Em breve"}</strong></div></div>
        {selecionada.xp && <span className="licao-recompensa"><Zap aria-hidden="true" />{concluida(selecionada) ? "Revisão • recompensa já recebida" : `Recompensa: ${selecionada.xp} XP + 5 diamantes`}</span>}
        <div className="licao-detalhes-lumi"><Mascote pose="joia" tamanho="sm" decorativo /><p>{selecionada.tipo === "avaliacao" ? "Alcance 80% de acertos para concluir a unidade. O gabarito aparece no final." : objetivoUnidade(unidade.id) && curso.id === "saude" ? "Observe os sinais e depois combine as imagens com seus significados." : "As atividades desta categoria estão em preparação."}</p></div>
        <button type="button" className="atividade-botao atividade-botao--azul" disabled={selecionada.tipo === "preparacao"} onClick={() => { const fase = selecionada; fechar(); aoComecar(fase); }}>{selecionada.tipo === "preparacao" ? "Atividades em preparação" : concluida(selecionada) ? "Revisar" : "Começar"}<Play aria-hidden="true" /></button>
      </>}
    </dialog>
  </div>;
}
