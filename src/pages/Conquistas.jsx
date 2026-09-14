import { useEffect, useRef, useState } from "react";
import { Award, Bell, BookOpen, ChevronRight, Gem, Handshake, LockKeyhole, Medal, Menu, Rocket, Shield, Star, Target, Timer, Users, X, Zap } from "lucide-react";
import { Mascote } from "../components/mascote/index.js";
import { TrofeuCelebracao } from "../components/TrofeuCelebracao.jsx";
import medalhaOuro from "../assets/componentes/reaproveitamento-de-elementos/medalha-de-ouro.png";
import bibliotecario from "../assets/componentes/reaproveitamento-de-elementos/bibliotecario.png";
import estrelaGuia from "../assets/componentes/reaproveitamento-de-elementos/estrela-guia.png";
import socializador from "../assets/componentes/reaproveitamento-de-elementos/socializador.png";
import diamante from "../assets/componentes/reaproveitamento-de-elementos/diamante.png";
import "./Conquistas.css";

// Somente a identidade visual é local; critérios e desbloqueios vêm do banco.
const ESPECIAIS = [
 { id: "chama", nome: "Chama Viva", Icone: Medal, tema: "ouro" },
 { id: "bibliotecario", nome: "Bibliotecário", Icone: BookOpen, tema: "azul", escudo: true },
 { id: "estrela", nome: "Estrela Guia", Icone: Star, tema: "roxo", escudo: true },
 { id: "social", nome: "Socializador", Icone: Users, tema: "verde" },
 { id: "interprete", nome: "Intérprete", Icone: Handshake, tema: "turquesa" },
 { id: "veloz", nome: "Veloz", Icone: Rocket, tema: "laranja" },
 { id: "foco", nome: "Foco Total", Icone: Target, tema: "rosa" },
 { id: "segredo", nome: "Segredo de Lumi", Icone: LockKeyhole, tema: "cinza" },
];
const ELEMENTOS = { chama: medalhaOuro, bibliotecario, estrela: estrelaGuia, social: socializador };

function ElementoConquista({ src, className = "" }) {
  return <span className={`conquista-elemento ${className}`} aria-hidden="true"><img src={src} alt="" draggable="false" decoding="async" /></span>;
}

function BarraProgresso({ atual, total, rotulo }) {
  return <span className="conquista-barra" role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={total} aria-valuenow={atual}><span style={{ width: `${Math.min(100, atual / total * 100)}%` }} /></span>;
}

function Emblema({ conquista }) {
  const Icone = conquista.Icone;
  return <span className={`conquista-emblema ${conquista.escudo ? "conquista-emblema--escudo" : ""}`} aria-hidden="true">{ELEMENTOS[conquista.id] ? <ElementoConquista src={ELEMENTOS[conquista.id]} className="conquista-emblema-imagem" /> : <>{conquista.escudo ? <Shield className="conquista-escudo" /> : null}<Icone className="conquista-emblema-simbolo" /></>}</span>;
}

function CartaoConquista({ conquista, diario = false, aoAbrir }) {
  const Recompensa = conquista.gema ? Gem : Star;
  return (
    <button type="button" onClick={() => aoAbrir(conquista)} className={`conquista-card conquista-tema--${conquista.tema} ${diario ? "conquista-card--diario" : ""} ${conquista.bloqueado ? "conquista-card--bloqueado" : ""}`} aria-label={`${conquista.nome}${conquista.bloqueado ? ", bloqueado" : `, ${conquista.atual} de ${conquista.total}`}`}>
      <Emblema conquista={conquista} />
      <h3>{conquista.nome}</h3>
      {!diario ? <p>{conquista.descricao}</p> : null}
      {conquista.bloqueado ? <span className="conquista-bloqueado">Bloqueado</span> : <>
        <div className="conquista-card-progresso">
          <BarraProgresso atual={conquista.atual} total={conquista.total} rotulo={`Progresso de ${conquista.nome}`} />
          <span className="conquista-fracao">{conquista.atual} / {conquista.total}</span>
        </div>
        <span className="conquista-recompensa">{conquista.gema ? <ElementoConquista src={diamante} className="conquista-diamante" /> : <Recompensa aria-hidden="true" />}+{conquista.xp} XP · +{conquista.diamantes} ◆</span>
      </>}
    </button>
  );
}

export function Conquistas({ nome, game, aoPraticar, aoRanking }) {
  const [painel, setPainel] = useState(null);
  const dialogoRef = useRef(null);
  useEffect(() => {
    if (painel && !dialogoRef.current.open) dialogoRef.current.showModal();
  }, [painel]);

  function fecharPainel() { dialogoRef.current.close(); setPainel(null); }
  function irPraticar() { fecharPainel(); aoPraticar(); }
  function abrirInformacao(nomePainel, detalhe, tipo) { setPainel({ nome: nomePainel, detalhe, tipo }); }
  const conquistas = ESPECIAIS.map(visual => {
    const dado = game.conquistas.find(c => c.id === visual.id);
    return { ...visual, atual: 0, total: 1, ...dado,
      bloqueado: !dado?.desbloqueada, recompensa: dado?.xp || 0,
      descricao: !dado?.ativa ? "Critério de desbloqueio a definir." : dado.desbloqueada ? "Conquista desbloqueada!" : `Progresso: ${dado.atual}/${dado.total}`,
    };
  });
  const conquistaSelecionada = painel && !painel.tipo;

  return (
    <div className="conquistas-tela home-aba-conteudo">
      <header className="conquistas-cabecalho">
        <button type="button" className="conquistas-icone-botao" onClick={() => abrirInformacao("Sua jornada", "Explore suas medalhas, acompanhe seus desafios e continue aprendendo a cada dia.", "menu")} aria-label="Abrir menu de conquistas"><Menu aria-hidden="true" /></button>
        <h1>Minhas Conquistas</h1>
        <button type="button" className="conquistas-icone-botao" onClick={() => abrirInformacao("Notificações", "Nenhuma notificação por aqui no momento.", "notificacoes")} aria-label="Ver notificações"><Bell aria-hidden="true" /></button>
        <button type="button" className="conquistas-avatar" onClick={() => abrirInformacao(nome || "Seu perfil", `Nível ${game.estatisticas.nivel} · Uma conquista a cada novo sinal.`, "perfil")} aria-label="Ver seu perfil"><Mascote pose="boas_vindas" tamanho="full" decorativo /></button>
      </header>

      <section className="conquistas-secao" aria-labelledby="conquistas-diarios-titulo">
        <div className="conquistas-secao-cabecalho"><h2 id="conquistas-diarios-titulo"><Target aria-hidden="true" />Suas conquistas</h2><span>{conquistas.filter(c => c.desbloqueada).length}/{conquistas.length} desbloqueadas</span></div>
        <p>As conquistas serão liberadas conforme os critérios forem definidos e você os cumprir. Nenhuma medalha vem desbloqueada.</p>
      </section>

      <section className="conquistas-secao conquistas-especiais-secao" aria-labelledby="conquistas-especiais-titulo">
        <div className="conquistas-secao-cabecalho"><h2 id="conquistas-especiais-titulo"><Zap aria-hidden="true" />Desafios Especiais</h2><span>Sua coleção</span></div>
        <div className="conquistas-especiais">{conquistas.map(conquista => <CartaoConquista key={conquista.id} conquista={conquista} aoAbrir={setPainel} />)}</div>
      </section>

      <section className="conquistas-incentivo" aria-label="Continue aprendendo">
        <TrofeuCelebracao className="conquistas-trofeu" />
        <div><h2>Cada sinal te leva mais longe!</h2><p>Seu esforço de hoje é a fluência de amanhã. Continue praticando!</p></div>
        <button type="button" onClick={aoPraticar}>Praticar agora <ChevronRight aria-hidden="true" /></button>
      </section>

      <dialog ref={dialogoRef} className={`conquista-dialogo conquista-tema--${painel?.tema || "verde"}`} onClose={() => setPainel(null)} onClick={event => { if (event.target === event.currentTarget) fecharPainel(); }} aria-labelledby="conquista-dialogo-titulo">
        <div className="conquista-dialogo-conteudo">
          <button type="button" className="conquistas-icone-botao conquista-dialogo-fechar" onClick={fecharPainel} aria-label="Fechar"><X aria-hidden="true" /></button>
          {conquistaSelecionada ? <Emblema conquista={painel} /> : <Award className="conquista-dialogo-medalha" aria-hidden="true" />}
          <h2 id="conquista-dialogo-titulo">{painel?.nome}</h2>
          <p>{painel?.detalhe || painel?.descricao}</p>
          {conquistaSelecionada && !painel.bloqueado ? <div className="conquista-dialogo-progresso"><BarraProgresso atual={painel.atual} total={painel.total} rotulo="Progresso da conquista" /><span>{painel.atual} / {painel.total} · {painel.atual >= painel.total ? "Concluído" : "Em andamento"}</span><strong>Recompensa: +{painel.xp} XP · +{painel.diamantes} diamantes</strong></div> : null}
          {painel?.bloqueado ? <p className="conquista-dialogo-bloqueado"><LockKeyhole aria-hidden="true" />Conquista bloqueada</p> : null}
          {(conquistaSelecionada && !painel.bloqueado && painel.id !== "social") || ["menu", "medalha"].includes(painel?.tipo) ? <button type="button" className="conquista-dialogo-acao" onClick={irPraticar}>Continuar praticando <ChevronRight aria-hidden="true" /></button> : null}
          {painel?.tipo === "menu" ? <button type="button" className="conquista-dialogo-link" onClick={() => { fecharPainel(); aoRanking(); }}>Ver meu ranking</button> : null}
        </div>
      </dialog>
    </div>
  );
}
