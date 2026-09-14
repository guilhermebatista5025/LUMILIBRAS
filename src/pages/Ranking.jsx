import { useEffect, useRef, useState } from "react";
import { Bell, ChevronRight, Clock3, Crown, Flame, Menu, Rocket, Sparkles, Trophy, X } from "lucide-react";
import { Mascote } from "../components/mascote/index.js";
import { TrofeuCelebracao } from "../components/TrofeuCelebracao.jsx";
import araraSorrindo from "../assets/componentes/reaproveitamento-de-elementos/arara-sorrindo.png";
import medalhaBronze from "../assets/componentes/reaproveitamento-de-elementos/medalha-bronze.png";
import medalhaXp from "../assets/componentes/reaproveitamento-de-elementos/medalha-xp.png";
import diamante from "../assets/componentes/reaproveitamento-de-elementos/diamante.png";
import botaoAdicionar from "../assets/componentes/reaproveitamento-de-elementos/botao-de-adicionar.png";
import "./Ranking.css";

// Dados de demonstração da referência visual; substituir pela classificação da API.
const PARTICIPANTES = [
  { id: "alex", nome: "Alex Santos", titulo: "Mestre dos Sinais", xp: 1240, dias: 12, cor: "amarelo" },
  { id: "mariana", nome: "Mariana Lima", titulo: "Explorador(a)", xp: 1185, dias: 9, cor: "verde" },
  { id: "bruno", nome: "Bruno Costa", titulo: "Poliglota", xp: 1020, dias: 7, cor: "azul" },
  { id: "clara", nome: "Dona Clara", titulo: "Focado(a)", xp: 980, dias: 6, cor: "roxo" },
  { id: "voce", nome: "Você", titulo: "Caminho do Herói", xp: 955, dias: 5, cor: "azul", voce: true },
  { id: "rafael", nome: "Rafael M.", titulo: "Dedicado(a)", xp: 940, dias: 4, cor: "cinza" },
  { id: "fernanda", nome: "Fernanda Lima", titulo: "Comunicador(a)", xp: 890, dias: 3, cor: "amarelo" },
  { id: "lucas", nome: "Lucas Almeida", titulo: "Aprendiz Avançado", xp: 840, dias: 2, cor: "verde" },
  { id: "juliana", nome: "Juliana Rocha", titulo: "Estudioso(a)", xp: 815, dias: 2, cor: "rosa" },
  { id: "pedro", nome: "Pedro Henrique", titulo: "Em Evolução", xp: 780, dias: 1, cor: "roxo" },
];
const numero = new Intl.NumberFormat("pt-BR");

function ElementoRanking({ src, className }) {
  return <span className={`ranking-elemento ${className}`} aria-hidden="true"><img src={src} alt="" draggable="false" decoding="async" /></span>;
}

function AvatarRanking({ participante }) {
  return (
    <span className={`ranking-avatar ranking-avatar--${participante.cor}`} aria-hidden="true">
      {participante.voce ? <Mascote pose="boas_vindas" tamanho="full" decorativo /> : participante.nome.split(/\s+/).slice(0, 2).map(parte => parte[0]).join("")}
    </span>
  );
}

export function Ranking({ nome, aoPraticar }) {
  const [painel, setPainel] = useState(null);
  const dialogoRef = useRef(null);
  const voce = PARTICIPANTES.find(participante => participante.voce);
  const metaTop3 = PARTICIPANTES[2].xp;
  const faltamXp = metaTop3 - voce.xp;

  useEffect(() => {
    if (painel && !dialogoRef.current.open) dialogoRef.current.showModal();
  }, [painel]);

  function fecharPainel() {
    dialogoRef.current.close();
    setPainel(null);
  }

  function praticar() {
    fecharPainel();
    aoPraticar();
  }

  const titulos = { menu: "Sua liga", notificacoes: "Notificações", perfil: "Seu perfil", gemas: "Suas gemas", xp: "Rumo ao TOP 3" };

  return (
    <div className="ranking-tela home-aba-conteudo">
      <header className="ranking-cabecalho">
        <button type="button" className="ranking-icone-botao" onClick={() => setPainel("menu")} aria-label="Abrir menu da liga"><Menu aria-hidden="true" /></button>
        <h1>Ranking</h1>
        <button type="button" className="ranking-icone-botao ranking-notificacoes" onClick={() => setPainel("notificacoes")} aria-label="Ver notificações"><Bell aria-hidden="true" /></button>
        <button type="button" className="ranking-perfil-botao" onClick={() => setPainel("perfil")} aria-label="Ver seu perfil"><AvatarRanking participante={voce} /></button>
      </header>

      <section className="ranking-liga" aria-labelledby="ranking-liga-titulo">
        <TrofeuCelebracao className="ranking-trofeu" />
        <div className="ranking-liga-texto">
          <p className="ranking-liga-nome"><ElementoRanking src={medalhaBronze} className="ranking-medalha-bronze" /> Liga Bronze</p>
          <h2 id="ranking-liga-titulo">Você faz parte do <strong>TOP 10!</strong></h2>
          <p className="ranking-liga-motivacao">Continue praticando e suba ainda mais! <Rocket aria-hidden="true" /></p>
        </div>
        <div className="ranking-mascote" aria-hidden="true"><img src={araraSorrindo} alt="" draggable="false" decoding="async" /></div>
      </section>

      <section className="ranking-resumo" aria-label="Seu progresso na liga">
        <button type="button" className="ranking-xp" onClick={() => setPainel("xp")} aria-label={`${voce.xp} XP. Faltam ${faltamXp} XP para alcançar a pontuação do terceiro lugar.`}>
          <ElementoRanking src={medalhaXp} className="ranking-xp-medalha" />
          <span className="ranking-xp-valor"><small>Seu XP</small><strong>{numero.format(voce.xp)}</strong></span>
          <span className="ranking-xp-meta">FALTAM <strong>{faltamXp} XP</strong><br />para o TOP 3</span>
          <ChevronRight className="ranking-xp-seta" aria-hidden="true" />
          <span className="ranking-xp-barra" role="progressbar" aria-label="XP até a pontuação do terceiro lugar" aria-valuemin={0} aria-valuemax={metaTop3} aria-valuenow={voce.xp}><span style={{ width: `${Math.min(100, voce.xp / metaTop3 * 100)}%` }} /></span>
        </button>
        <button type="button" className="ranking-gemas" onClick={() => setPainel("gemas")} aria-label="Ver suas 250 gemas"><ElementoRanking src={diamante} className="ranking-diamante" /><strong>250</strong><ElementoRanking src={botaoAdicionar} className="ranking-adicionar" /></button>
      </section>

      <section className="ranking-classificacao" aria-labelledby="ranking-top-titulo">
        <div className="ranking-lista-cabecalho">
          <h2 id="ranking-top-titulo"><Crown aria-hidden="true" /> TOP 10</h2>
          <span><Clock3 aria-hidden="true" /> Atualiza em 12h</span>
        </div>
        <ol className="ranking-lista" aria-label="Classificação da Liga Bronze">
          {PARTICIPANTES.map((participante, index) => (
            <li key={participante.id} className={`ranking-linha ${participante.voce ? "ranking-linha--voce" : ""}`} aria-label={`${index + 1}º lugar: ${participante.nome}, ${participante.xp} XP, ${participante.dias} dias de sequência`}>
              <span className={`ranking-posicao ranking-posicao--${index + 1}`}><span>{index + 1}</span>{index < 3 ? <Sparkles aria-hidden="true" /> : null}</span>
              <AvatarRanking participante={participante} />
              <span className="ranking-pessoa"><strong>{participante.nome}</strong><small>{participante.titulo}</small></span>
              <span className="ranking-sequencia"><Flame aria-hidden="true" /><span>{participante.dias}</span></span>
              <span className="ranking-pontos"><strong>{numero.format(participante.xp)}</strong> <span>XP</span></span>
              {participante.voce ? <Sparkles className="ranking-destaque-brilho" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
      </section>

      <dialog ref={dialogoRef} className="ranking-dialogo" onClose={() => setPainel(null)} onClick={event => { if (event.target === event.currentTarget) fecharPainel(); }} aria-labelledby="ranking-dialogo-titulo">
        <div className="ranking-dialogo-conteudo">
          <button type="button" className="ranking-icone-botao ranking-dialogo-fechar" onClick={fecharPainel} aria-label="Fechar"><X aria-hidden="true" /></button>
          <span className="ranking-dialogo-emblema"><Trophy aria-hidden="true" /></span>
          <h2 id="ranking-dialogo-titulo">{titulos[painel]}</h2>
          {painel === "menu" ? <><p>Você está na Liga Bronze. Acompanhe sua posição e pratique para continuar evoluindo.</p><button type="button" className="ranking-acao" onClick={praticar}>Ir para Praticar <ChevronRight aria-hidden="true" /></button></> : null}
          {painel === "notificacoes" ? <p>Nenhuma notificação por aqui no momento.</p> : null}
          {painel === "perfil" ? <><p className="ranking-dialogo-nome">{nome || "Você"}</p><p>Liga Bronze · 5º lugar<br />Caminho do Herói</p></> : null}
          {painel === "gemas" ? <><p className="ranking-dialogo-numero"><ElementoRanking src={diamante} className="ranking-diamante" />250</p><p>Seu saldo de gemas. Novas recompensas estarão disponíveis em breve.</p></> : null}
          {painel === "xp" ? <><p>Você tem <strong>{numero.format(voce.xp)} XP</strong>. Conquiste mais <strong>{faltamXp} XP</strong> para alcançar a pontuação do terceiro lugar.</p><button type="button" className="ranking-acao" onClick={praticar}>Continuar praticando <ChevronRight aria-hidden="true" /></button></> : null}
        </div>
      </dialog>
    </div>
  );
}
