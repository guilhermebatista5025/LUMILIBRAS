import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Flame,
  Gem,
  Hand,
  Heart,
  LockKeyhole,
  Star,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { AppIcon as Icone } from "../components/icons/index.js";
import { Mascote } from "../components/mascote/index.js";
import { AvatarPerfil } from '../components/AvatarPerfil.jsx';
import { Ranking } from "./Ranking.jsx";
import { Conquistas } from "./Conquistas.jsx";
import { Perfil } from "./Perfil.jsx";
import { Categorias } from "./Categorias.jsx";
import { TrilhaCurso } from "./TrilhaCurso.jsx";
import { CURSOS } from "../data/cursos.js";
import { chaveFase, faseLiberada, obterFases, resumoUnidades, unidadeLiberada } from "../data/aprendizado.js";
import { useGame } from "../services/useGame.js";
import { TrilhaUnidade } from "./TrilhaUnidade.jsx";
import { AtividadeSaude } from "./AtividadeSaude.jsx";
import { Loja } from "./Loja.jsx";
import { storeApi } from "../services/storeApi.js";
import interprete1 from "../assets/componentes/cards-de-Libras-praticas/interprete-1.webp";
import interprete2 from "../assets/componentes/cards-de-Libras-praticas/interprete-2.webp";
import interprete4 from "../assets/componentes/cards-de-Libras-praticas/interprete-4.webp";
import foguinho from "../assets/componentes/reaproveitamento-de-elementos/foguinho.webp";
import diamante from "../assets/componentes/reaproveitamento-de-elementos/diamante.webp";
import foguinhoOficial from "../assets/componentes/reaproveitamento-de-elementos/foguinho.webp";
import bibliotecarioOficial from "../assets/componentes/reaproveitamento-de-elementos/bibliotecario.webp";
import veloxOficial from "../assets/componentes/reaproveitamento-de-elementos/velox.webp";

const NAVEGACAO = [
  { id: "aprender", icone: "school", rotulo: "Aprender" },
  { id: "praticar", icone: "fitness_center", rotulo: "Praticar" },
  { id: "loja", icone: "shopping_bag", rotulo: "Loja" },
  { id: "ranking", icone: "leaderboard", rotulo: "Ranking" },
  { id: "conquistas", icone: "emoji_events", rotulo: "Conquistas" },
  { id: "perfil", icone: "account_circle", rotulo: "Perfil" },
];



const TEMA_DESAFIO = {
  laranja: {
    icone: "bg-[#fff1e7] text-[#f56d0b]",
    etiqueta: "text-[#e96100]",
    recompensa: "text-[#ef6500]",
  },
  azul: {
    icone: "bg-[#eaf3ff] text-[#0875d1]",
    etiqueta: "text-[#075ab9]",
    recompensa: "text-[#0875d1]",
  },
  verde: {
    icone: "bg-[#edf8e9] text-[#539522]",
    etiqueta: "text-[#477f20]",
    recompensa: "text-[#4e9322]",
  },
};

function Indicadores({ estatisticas, pronto }) {
  const indicadores = [
    { valor: pronto ? estatisticas.sequencia : "—", rotulo: "dias de sequência", Icone: Flame, classe: "fill-[#ff9b21] text-[#f57900]" },
    { valor: pronto ? estatisticas.diamantes : "—", rotulo: "diamantes", Icone: Gem, classe: "fill-[#55b9ff] text-[#0875c9]" },
    { valor: pronto ? estatisticas.coracoes : "—", rotulo: "corações", Icone: Heart, classe: "fill-[#ff6b77] text-[#d9293d]" },
  ];

  return (
    <div className="flex items-center gap-1.5 tabular-nums sm:gap-2" aria-label="Indicadores do usuário">
      {indicadores.map(({ valor, rotulo, Icone: IconeIndicador, classe }) => (
        <div key={rotulo} className="flex h-9 items-center gap-1 rounded-full border border-[#d8e3e8] bg-white px-2 shadow-[0_2px_7px_rgb(11_45_92_/_6%)]" aria-label={`${valor} ${rotulo}`}>
          {IconeIndicador === Flame || IconeIndicador === Gem ? <img src={IconeIndicador === Flame ? foguinho : diamante} alt="" className="size-[18px] object-contain" aria-hidden="true" /> : <IconeIndicador className={`size-[18px] ${classe}`} strokeWidth={2.4} aria-hidden="true" />}
          <span className="text-xs font-extrabold text-[#17243a] sm:text-sm">{valor}</span>
        </div>
      ))}
    </div>
  );
}

function MetaDiaria({ aoContinuar, metaDiaria, estatisticas }) {
  return (
    <section className="relative isolate mt-5 min-h-[205px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#075fca] to-[#004fac] px-5 py-5 text-white shadow-[0_9px_0_#003875,0_18px_35px_rgb(0_79_172_/_20%)]" aria-labelledby="meta-diaria-titulo">
      <div className="relative z-10 max-w-[62%]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-white" aria-hidden="true">
            <Target className="size-5" strokeWidth={2.5} />
          </span>
          <div>
            <h2 id="meta-diaria-titulo" className="font-display text-lg font-extrabold leading-5">Meta diária</h2>
            <p className="mt-1 text-sm font-bold">Sua meta: {metaDiaria || 10} min</p>
          </div>
        </div>

        <p className="mt-4 text-sm font-bold">{estatisticas.fasesHoje} fases concluídas hoje · {estatisticas.xpHoje} XP</p>
        <p className="mt-3 text-xs font-semibold leading-5 text-white/95">Continue praticando para manter sua sequência!</p>
        <button type="button" onClick={aoContinuar} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 font-display text-sm font-extrabold uppercase tracking-[0.06em] text-[#075ab9] shadow-[0_4px_0_#c5d3ea] transition active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]">
          Continuar <ArrowRight className="size-4" strokeWidth={3} aria-hidden="true" />
        </button>
      </div>

      <div aria-hidden="true" className="absolute -right-7 -top-10 size-40 rounded-full bg-white/8" />
      <div className="absolute -bottom-2 -right-3 z-0 w-[43%] max-w-[185px]" aria-hidden="true">
        <Mascote pose="joia" tamanho="full" decorativo prioridade className="w-full drop-shadow-[0_8px_7px_rgb(0_22_65_/_28%)]" />
      </div>
    </section>
  );
}

function ProgressoCurso({ aoAbrirUnidades, concluidas }) {
  const primeiraPendente = CURSOS.saude.unidades.find(unidade => !concluidas.includes(unidade.id));
  return (
    <section className="mt-11" aria-labelledby="curso-atual-titulo">
      <p className="text-xs font-extrabold uppercase tracking-[0.04em] text-[#075ab9]">Curso em andamento</p>
      <h2 id="curso-atual-titulo" className="font-display mt-2 text-[1.35rem] font-extrabold leading-8 tracking-[-0.025em] text-[#111c2c]">Libras no contexto da saúde</h2>
      <p className="mt-1 text-xs font-medium text-[#5c6674]">13 unidades • 139 sinais da cartilha</p>

      <ol className="relative mt-5 grid grid-cols-4" aria-label="Progresso das unidades">
        <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-7 h-1 bg-[#d6dbe6]" />
        {CURSOS.saude.unidades.slice(0, 4).map((unidade) => {
          const concluida = concluidas.includes(unidade.id);
          const atual = primeiraPendente?.id === unidade.id;
          return (
            <li key={unidade.id} className="relative z-10 flex flex-col items-center">
              <span className={`grid size-14 place-items-center rounded-full border-[5px] bg-white ${concluida ? "border-[#8bc900] text-[#557a00]" : atual ? "border-[#075ab9] text-[#075ab9] shadow-[0_0_0_7px_#dceaff]" : "border-[#c7cddb] text-[#7b8492]"}`}>
                {concluida ? <Check className="size-6" strokeWidth={3} aria-hidden="true" /> : atual ? <Star className="size-6" strokeWidth={2.5} aria-hidden="true" /> : <LockKeyhole className="size-5" strokeWidth={2.4} aria-hidden="true" />}
              </span>
              <span className="sr-only">Unidade {unidade.id}: {concluida ? "concluída" : atual ? "atual" : "bloqueada"}</span>
            </li>
          );
        })}
      </ol>

      <button type="button" onClick={aoAbrirUnidades} className="mt-6 flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-[#dce8ff] px-4 font-display text-sm font-extrabold uppercase tracking-[0.055em] text-[#075ab9] shadow-[0_5px_0_#b5c7e9] transition active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]">
        Ver todas as unidades <ArrowRight className="size-5" strokeWidth={2.6} aria-hidden="true" />
      </button>
    </section>
  );
}

function CartaoDesafio({ desafio, aoAbrir }) {
  const tema = TEMA_DESAFIO[desafio.tema];
  const percentual = Math.round((desafio.atual / desafio.total) * 100);
  const IconeDesafio = desafio.Icone;

  return (
    <button
      type="button"
      onClick={() => aoAbrir(desafio.titulo)}
      className={`pratica-card pratica-card--${desafio.tema} group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]`}
    >
        <span className={`pratica-card-icone ${tema.icone}`} aria-hidden="true">
          {IconeDesafio === Zap || IconeDesafio === BookOpen || IconeDesafio === Timer ? <img src={IconeDesafio === Zap ? foguinhoOficial : IconeDesafio === BookOpen ? bibliotecarioOficial : veloxOficial} alt="" className="size-9 object-contain" aria-hidden="true" /> : <IconeDesafio strokeWidth={2.15} fill={desafio.tema === "laranja" ? "currentColor" : "none"} />}
        </span>

        <div className="pratica-card-conteudo">
          {desafio.etiqueta ? <p className={`pratica-card-etiqueta ${tema.etiqueta}`}>{desafio.etiqueta}</p> : null}
          <h3 className="pratica-card-titulo font-display">{desafio.titulo}</h3>
          <p className="pratica-card-tempo">
            <Clock3 className="size-3.5 text-[#8a9bb8]" strokeWidth={2} aria-hidden="true" />
            {desafio.minutos} min
          </p>
          <div className="pratica-card-progresso">
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#e2e9f4]" role="progressbar" aria-label={`Progresso de ${desafio.titulo}`} aria-valuemin="0" aria-valuemax={desafio.total} aria-valuenow={desafio.atual}>
              <span className="block h-full rounded-full bg-gradient-to-r from-[#72bd21] to-[#45a916] transition-[width] duration-700" style={{ width: `${percentual}%` }} />
            </span>
            <span className="shrink-0 font-medium tabular-nums text-[#617087]">{desafio.atual} / {desafio.total}</span>
          </div>
        </div>
      <div className="pratica-card-retrato">
        <img src={desafio.interprete} alt="" className="pratica-interprete" decoding="async" />
        <span className={`pratica-card-recompensa ${tema.recompensa}`}>
                    {desafio.tema === "verde" ? <span className="pratica-recompensa-estrela"><Star className="fill-white" aria-hidden="true" /></span> : null}
          <span>{desafio.recompensa}</span>
        </span>
      </div>
    </button>
  );
}

function DesafioRelampago({ aoComecar }) {
  return (
    <section className="pratica-relampago-secao" aria-labelledby="desafio-relampago-titulo">
      <h2 id="desafio-relampago-titulo" className="flex items-center gap-2 font-display text-lg font-bold text-[#101d4b]">
        <Zap className="size-5 fill-[#6841c7] text-[#6841c7]" aria-hidden="true" />
        Desafios relâmpago
      </h2>

      <button type="button" onClick={aoComecar} className="pratica-relampago focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#cbbcf4]" aria-label="Começar: Pratique Libras">
        <span className="pratica-card-icone pratica-relampago-icone" aria-hidden="true">
          <Hand strokeWidth={1.8} />
        </span>
        <div className="pratica-relampago-conteudo">
          <h3 className="pratica-card-titulo font-display">Pratique Libras</h3>
          <p className="pratica-relampago-descricao">Exercícios rápidos para fixar sinais e evoluir todos os dias.</p>
          <div className="pratica-relampago-bonus">
            <span><Timer aria-hidden="true" />10 min</span>
            <span><Star className="fill-current" aria-hidden="true" />Estude no seu ritmo</span>
          </div>
        </div>
        <div className="pratica-relampago-retrato" aria-hidden="true">
          <img src={interprete4} alt="" className="pratica-interprete" decoding="async" />
        </div>
      </button>
    </section>
  );
}

function SequenciaSemanal({ estatisticas }) {
  return (
    <section className="pratica-sequencia mt-3 flex items-center gap-2 rounded-[18px] border border-[#e1ebdb] bg-[#f5f9f1] p-3" aria-label="Sequência semanal">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#70b73b] text-white" aria-hidden="true"><Flame className="size-5 fill-current" /></span>
      <div className="min-w-0 flex-1">
        <h2 className="text-xs font-extrabold text-[#263521]">Mantenha sua sequência!</h2>
        <p className="mt-0.5 text-[10px] leading-4 text-[#62715c]">{estatisticas.diasLogados} dias de acesso registrados.</p>
      </div>
      <div className="pratica-sequencia-dias flex items-center gap-1" aria-label={`${estatisticas.sequencia} dias seguidos de acesso`}>
        <span className="text-sm font-extrabold">{estatisticas.sequencia} dias</span>
      </div>
    </section>
  );
}

function TelaPraticar({ aoAbrirDesafio, estatisticas }) {
  const desafios = [
    { id: "xp", titulo: "Seu XP de hoje", atual: Math.min(50, estatisticas.xpHoje), total: 50, minutos: 10, recompensa: "Estudar", Icone: Zap, interprete: interprete1, tema: "laranja" },
    { id: "fases", titulo: "Pratique 2 fases", atual: Math.min(2, estatisticas.fasesHoje), total: 2, minutos: 20, recompensa: "Praticar", Icone: BookOpen, interprete: interprete2, tema: "azul" },
  ];
  return (
    <div className="home-aba-conteudo pratica-tela">
      <section className="pratica-titulo flex items-center justify-between gap-2" aria-labelledby="desafios-diarios-titulo">
        <h1 id="desafios-diarios-titulo" className="flex items-center gap-2 font-display font-bold tracking-[-0.025em] text-[#101d4b]">
          <Trophy className="size-5 shrink-0 text-[#f0a31b]" strokeWidth={2.3} aria-hidden="true" />
          Prática diária
        </h1>
        <span className="pratica-concluidos flex shrink-0 items-center gap-1.5 font-bold text-[#0875d1]">
          <span className="pratica-calendario"><CalendarDays strokeWidth={2.2} aria-hidden="true" /></span>
          {estatisticas.fasesHoje} fases hoje
        </span>
      </section>

      <div className="pratica-lista">
        {desafios.map((desafio) => <CartaoDesafio key={desafio.id} desafio={desafio} aoAbrir={aoAbrirDesafio} />)}
      </div>

      <p className="mt-3 text-xs text-[#617087]">Acompanhe suas metas de prática. As recompensas são concedidas uma vez por fase, sem bônus adicional por estas metas.</p>
      <DesafioRelampago aoComecar={() => aoAbrirDesafio("Pratique Libras")} />
      <SequenciaSemanal estatisticas={estatisticas} />
    </div>
  );
}

export function Home({ nome, fotoUrl, aoFotoSalva, metaDiaria, aoEditarOnboarding }) {
  const [abaAtiva, setAbaAtiva] = useState("aprender");
  const [categoriasAbertas, setCategoriasAbertas] = useState(false);
  const [cursoAberto, setCursoAberto] = useState(null);
  const [unidadeAberta, setUnidadeAberta] = useState(null);
  const [faseAberta, setFaseAberta] = useState(null);
  const { game, erro: erroGame, carregando: carregandoGame, ocupado: ocupadoGame, enviar: enviarGame, recarregar: recarregarGame } = useGame();
  const aprendizado = game.aprendizado;
  const progresso = resumoUnidades(aprendizado);
  const [mensagem, setMensagem] = useState("");
  const navegacaoRef = useRef(null);
  const indicadorRef = useRef(null);
  const botoesNavegacaoRef = useRef({});
  const posicaoIndicadorRef = useRef(null);
  const velocidadeIndicadorRef = useRef(0);
  const quadroIndicadorRef = useRef(0);
  const abaAtivaRef = useRef(abaAtiva);
  const primeiroNome = nome?.trim().split(/\s+/)[0] || "Usuário";
  abaAtivaRef.current = abaAtiva;

  useEffect(() => {
    let ativo = true;
    document.documentElement.dataset.lumiSkin = 'classica';
    storeApi.state().then(dados => {
      if (ativo) document.documentElement.dataset.lumiSkin = dados.skinAtiva;
    }).catch(() => {});
    return () => { ativo = false; delete document.documentElement.dataset.lumiSkin; };
  }, []);

  useLayoutEffect(() => {
    const indicador = indicadorRef.current;
    const botaoAtivo = botoesNavegacaoRef.current[abaAtiva];
    if (!indicador || !botaoAtivo) return undefined;

    const alvo = botaoAtivo.offsetLeft;
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    indicador.style.width = `${botaoAtivo.offsetWidth}px`;
    cancelAnimationFrame(quadroIndicadorRef.current);

    if (posicaoIndicadorRef.current === null || reduzirMovimento) {
      posicaoIndicadorRef.current = alvo;
      velocidadeIndicadorRef.current = 0;
      indicador.style.transform = `translate3d(${alvo}px, 0, 0)`;
      return undefined;
    }

    // Adaptado do efeito 14, “Botão elástico”, da vitrine Não Codei:
    // a posição persegue o destino usando rigidez e amortecimento reais.
    function animarIndicador() {
      const forca = (alvo - posicaoIndicadorRef.current) * 0.18;
      velocidadeIndicadorRef.current = (velocidadeIndicadorRef.current + forca) * 0.72;
      posicaoIndicadorRef.current += velocidadeIndicadorRef.current;

      const estiramento = 1 + Math.min(Math.abs(velocidadeIndicadorRef.current) * 0.006, 0.1);
      indicador.style.transform = `translate3d(${posicaoIndicadorRef.current}px, 0, 0) scaleX(${estiramento})`;

      const chegou = Math.abs(alvo - posicaoIndicadorRef.current) < 0.08
        && Math.abs(velocidadeIndicadorRef.current) < 0.08;
      if (chegou) {
        posicaoIndicadorRef.current = alvo;
        velocidadeIndicadorRef.current = 0;
        indicador.style.transform = `translate3d(${alvo}px, 0, 0)`;
        return;
      }
      quadroIndicadorRef.current = requestAnimationFrame(animarIndicador);
    }

    quadroIndicadorRef.current = requestAnimationFrame(animarIndicador);
    return () => cancelAnimationFrame(quadroIndicadorRef.current);
  }, [abaAtiva, faseAberta]);

  useEffect(() => {
    const navegacao = navegacaoRef.current;
    if (!navegacao || typeof ResizeObserver === "undefined") return undefined;

    const observador = new ResizeObserver(() => {
      const indicador = indicadorRef.current;
      const botaoAtivo = botoesNavegacaoRef.current[abaAtivaRef.current];
      if (!indicador || !botaoAtivo) return;
      cancelAnimationFrame(quadroIndicadorRef.current);
      posicaoIndicadorRef.current = botaoAtivo.offsetLeft;
      velocidadeIndicadorRef.current = 0;
      indicador.style.width = `${botaoAtivo.offsetWidth}px`;
      indicador.style.transform = `translate3d(${botaoAtivo.offsetLeft}px, 0, 0)`;
    });

    observador.observe(navegacao);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(quadroIndicadorRef.current);
    };
  }, [faseAberta]);

  function trocarAba(aba) {
    setAbaAtiva(aba);
    setCursoAberto(null);
    setUnidadeAberta(null);
    setFaseAberta(null);
    setCategoriasAbertas(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!["aprender", "praticar", "loja", "ranking", "conquistas", "perfil"].includes(aba)) {
      const rotulo = NAVEGACAO.find((item) => item.id === aba)?.rotulo;
      setMensagem(`${rotulo}: em breve você terá novidades aqui.`);
    } else {
      setMensagem("");
    }
  }

  function abrirDesafio() { abrirCurso("saude"); }

  function abrirCurso(id = "saude") {
    if (!CURSOS[id]) return;
    setAbaAtiva("aprender");
    setCursoAberto(id);
    setUnidadeAberta(null);
    setFaseAberta(null);
    setCategoriasAbertas(false);
    setMensagem("");
  }

  function abrirUnidade(id) {
    if (!unidadeLiberada(aprendizado, cursoAberto, id)) return;
    setUnidadeAberta(id);
  }

  async function abrirFase(fase) {
    if (fase.tipo === "preparacao" || !faseLiberada(aprendizado, cursoAberto, unidadeAberta, fase.id)) return;
    setMensagem("");
    if (game.versao < 0 || ocupadoGame) { setMensagem("Aguarde a conexão com o banco para iniciar."); return; }
    try {
      await enviarGame('start', chaveFase(cursoAberto, unidadeAberta, fase.id));
      setFaseAberta(fase.id);
    } catch (error) {
      setMensagem(error.message);
    }
  }

  if (faseAberta && cursoAberto && unidadeAberta) {
    const unidade = CURSOS[cursoAberto].unidades.find(item => item.id === unidadeAberta);
    const fase = obterFases(cursoAberto, unidadeAberta).find(item => item.id === faseAberta);
    return <AtividadeSaude key={`${cursoAberto}:${unidadeAberta}:${faseAberta}`} unidade={unidade} fase={fase} registro={aprendizado[chaveFase(cursoAberto, unidadeAberta, faseAberta)]} estatisticas={game.estatisticas} ocupado={ocupadoGame} avisoSalvamento={erroGame} aoRegistrar={(action,payload) => enviarGame(action,chaveFase(cursoAberto,unidadeAberta,faseAberta),payload)} aoSair={() => setFaseAberta(null)} />;
  }

  return (
    <div className={`home-tela relative isolate min-h-dvh w-full overflow-x-clip font-sans text-[#111c2c] selection:bg-primary-fixed ${unidadeAberta ? "home-unidade" : cursoAberto ? "home-trilha" : categoriasAbertas ? "home-categorias" : abaAtiva === "conquistas" ? "home-conquistas" : abaAtiva === "ranking" ? "home-ranking" : abaAtiva === "loja" ? "home-loja" : abaAtiva === "praticar" ? "home-praticar bg-[#f9f9ff]" : abaAtiva === "perfil" ? "home-perfil bg-[#f5faff]" : "bg-[#f4fbff]"}`}>
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[290px] overflow-hidden bg-gradient-to-b from-transparent via-[#edfbf2]/55 to-[#d4f2df] ${["praticar", "ranking", "conquistas", "loja"].includes(abaAtiva) ? "hidden" : ""}`} aria-hidden="true">
        <span className="absolute -bottom-28 -left-24 size-64 rounded-full bg-[#a9e5a9]/55" />
        <span className="absolute -bottom-32 left-24 size-60 rounded-full bg-[#c8efc2]/75" />
        <span className="absolute -bottom-24 -right-24 size-64 rounded-full bg-[#b6eac1]/65" />
        <span className="absolute bottom-16 left-2 size-10 rounded-full bg-[#d9f5de]/80 blur-sm" />
        <span className="absolute bottom-12 right-7 size-14 rounded-full bg-[#e1f8e5]/85 blur-sm" />
      </div>

      {!["ranking", "conquistas", "perfil", "praticar"].includes(abaAtiva) ? <header className="relative z-30 border-b border-[#d7e4e8] bg-white/92 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <LogoLumiLibras tamanho="sm" className="shrink-0 text-[1.28rem]" />
          <Indicadores estatisticas={game.estatisticas} pronto={game.versao >= 0} />
        </div>
      </header> : null}

      <main className="relative z-10 px-4 pb-32 pt-5">
        {(carregandoGame || erroGame) && <div role="status" className="mx-3 my-3 rounded-xl border border-outline-variant bg-white p-3 text-xs text-on-surface-variant">{carregandoGame ? "Carregando seu progresso…" : erroGame}{!carregandoGame && <button type="button" onClick={recarregarGame} className="ml-2 font-bold text-primary">Tentar novamente</button>}</div>}
        {unidadeAberta ? (
          <TrilhaUnidade curso={CURSOS[cursoAberto]} unidade={CURSOS[cursoAberto].unidades.find(item => item.id === unidadeAberta)} progresso={aprendizado} metaDiaria={metaDiaria} aoEditarMeta={aoEditarOnboarding} aoVoltar={() => setUnidadeAberta(null)} aoComecar={abrirFase} />
        ) : cursoAberto ? (
          <TrilhaCurso key={cursoAberto} curso={CURSOS[cursoAberto]} concluidas={progresso[cursoAberto] || []} aprendizado={aprendizado} aoAbrirUnidade={abrirUnidade} aoVoltar={() => { setCursoAberto(null); setCategoriasAbertas(true); window.scrollTo({ top: 0, behavior: "instant" }); }} />
        ) : categoriasAbertas ? (
          <Categorias aoVoltar={() => setCategoriasAbertas(false)} aoAbrirCurso={abrirCurso} />
        ) : abaAtiva === "conquistas" ? (
          <Conquistas nome={nome} game={game} aoPraticar={() => abrirCurso("saude")} aoRanking={() => trocarAba("ranking")} />
        ) : abaAtiva === "ranking" ? (
          <Ranking nome={nome} fotoUrl={fotoUrl} game={game} aoPraticar={() => { setAbaAtiva("aprender"); abrirCurso("saude"); }} />
        ) : abaAtiva === "loja" ? (
          <Loja game={game} aoAtualizarJogo={recarregarGame} />
        ) : abaAtiva === "perfil" ? (
          <Perfil nome={nome} fotoUrl={fotoUrl} aoFotoSalva={aoFotoSalva} game={game} aoConquistas={() => trocarAba("conquistas")} aoRanking={() => trocarAba("ranking")} aoEditarOnboarding={aoEditarOnboarding} />
        ) : abaAtiva === "praticar" ? (
          <TelaPraticar estatisticas={game.estatisticas} aoAbrirDesafio={abrirDesafio} />
        ) : (
          <div className="home-aba-conteudo">
            <section className="relative flex items-center gap-4" aria-labelledby="saudacao-home">
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[#dce8ff] ring-1 ring-[#c8d8f4]">
                <AvatarPerfil fotoUrl={fotoUrl} className="size-[74px]" />
              </div>
              <div>
                <p className="text-base font-medium text-[#5b6573]">Bom dia,</p>
                <h1 id="saudacao-home" className="font-display text-[1.7rem] font-extrabold leading-8 tracking-[-0.035em] text-[#111c2c]">{primeiroNome}!</h1>
              </div>
              <span aria-hidden="true" className="absolute -right-14 -top-9 -z-10 size-40 rounded-full bg-[#e6f3f3]" />
            </section>

            <MetaDiaria metaDiaria={metaDiaria} estatisticas={game.estatisticas} aoContinuar={() => { setMensagem(""); setCategoriasAbertas(true); window.scrollTo({ top: 0, behavior: "instant" }); }} />
            <ProgressoCurso aoAbrirUnidades={() => abrirCurso("saude")} concluidas={progresso.saude || []} />
          </div>
        )}
      </main>

      {mensagem ? (
        <div role="status" className="fixed bottom-28 left-1/2 z-40 flex w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 items-start gap-3 rounded-xl border border-[#c2cfe2] bg-white p-3 text-sm shadow-xl">
          <p className="flex-1">{mensagem}</p>
          <button type="button" onClick={() => setMensagem("")} className="min-h-8 rounded-lg px-2 font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim" aria-label="Fechar aviso">×</button>
        </div>
      ) : null}

      <nav className="home-navegacao fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-24px)] -translate-x-1/2 rounded-[22px] border border-[#d5dfed] bg-white/95 p-1.5 shadow-[0_8px_28px_rgb(0_79_172_/_18%)] backdrop-blur-xl" aria-label="Navegação principal">
        <div ref={navegacaoRef} className="relative grid grid-cols-6 gap-1">
          <span ref={indicadorRef} className="home-nav-indicador pointer-events-none absolute inset-y-0 left-0 z-0 rounded-2xl bg-[#075ab9] shadow-[0_3px_0_#003875]" aria-hidden="true" />
          {NAVEGACAO.map((item) => {
            const ativa = abaAtiva === item.id;
            return (
              <button ref={(elemento) => { botoesNavegacaoRef.current[item.id] = elemento; }} key={item.id} type="button" onClick={() => trocarAba(item.id)} aria-current={ativa ? "page" : undefined} className={`relative z-10 flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 text-[clamp(8px,2.3vw,10px)] leading-4 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim ${ativa ? "font-bold text-white" : "font-semibold text-[#285486] hover:bg-[#eef4ff]"}`}>
                <Icone nome={item.icone} className="text-[1.35rem]" strokeWidth={ativa ? 2.6 : 2.2} />
                <span>{item.rotulo}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
