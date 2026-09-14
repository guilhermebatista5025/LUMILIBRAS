import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Flame,
  Gem,
  Gift,
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
import { Ranking } from "./Ranking.jsx";
import { Conquistas } from "./Conquistas.jsx";
import { Perfil } from "./Perfil.jsx";
import { Categorias } from "./Categorias.jsx";
import interprete1 from "../assets/componentes/cards-de-Libras-praticas/interprete-1.png";
import interprete2 from "../assets/componentes/cards-de-Libras-praticas/interprete-2.png";
import interprete3 from "../assets/componentes/cards-de-Libras-praticas/interprete-3.png";
import interprete4 from "../assets/componentes/cards-de-Libras-praticas/interprete-4.png";
import foguinho from "../assets/componentes/reaproveitamento-de-elementos/foguinho.png";
import diamante from "../assets/componentes/reaproveitamento-de-elementos/diamante.png";
import foguinhoOficial from "../assets/componentes/reaproveitamento-de-elementos/foguinho.png";
import bibliotecarioOficial from "../assets/componentes/reaproveitamento-de-elementos/bibliotecario.png";
import veloxOficial from "../assets/componentes/reaproveitamento-de-elementos/velox.png";

const NAVEGACAO = [
  { id: "aprender", icone: "school", rotulo: "Aprender" },
  { id: "praticar", icone: "fitness_center", rotulo: "Praticar" },
  { id: "ranking", icone: "leaderboard", rotulo: "Ranking" },
  { id: "conquistas", icone: "emoji_events", rotulo: "Conquistas" },
  { id: "perfil", icone: "account_circle", rotulo: "Perfil" },
];

const UNIDADES = [
  { id: 1, status: "concluída", rotulo: "Unidade 1" },
  { id: 2, status: "atual", rotulo: "Unidade 2" },
  { id: 3, status: "disponível", rotulo: "Unidade 3" },
  { id: 4, status: "bloqueada", rotulo: "Unidade 4" },
];

const DESAFIOS_DIARIOS = [
  {
    id: "xp-libras",
    etiqueta: "Desafio relâmpago",
    titulo: "Ganhe 50 XP em Libras",
    minutos: 10,
    atual: 20,
    total: 50,
    recompensa: "+50 XP",
    Icone: Zap,
    interprete: interprete1,
    tema: "laranja",
  },
  {
    id: "duas-licoes",
    titulo: "Complete 2 lições",
    minutos: 20,
    atual: 1,
    total: 2,
    recompensa: "+10",
    Icone: BookOpen,
    interprete: interprete2,
    tema: "azul",
  },
  {
    id: "pratica-dez",
    titulo: "Pratique por 10 min",
    minutos: 10,
    atual: 5,
    total: 10,
    recompensa: "+100 XP",
    Icone: Timer,
    interprete: interprete3,
    tema: "verde",
  },
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

function Indicadores() {
  const indicadores = [
    { valor: 15, rotulo: "dias de sequência", Icone: Flame, classe: "fill-[#ff9b21] text-[#f57900]" },
    { valor: 250, rotulo: "gemas", Icone: Gem, classe: "fill-[#55b9ff] text-[#0875c9]" },
    { valor: 5, rotulo: "vidas", Icone: Heart, classe: "fill-[#ff6b77] text-[#d9293d]" },
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

function MetaDiaria({ aoContinuar }) {
  return (
    <section className="relative isolate mt-5 min-h-[205px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#075fca] to-[#004fac] px-5 py-5 text-white shadow-[0_9px_0_#003875,0_18px_35px_rgb(0_79_172_/_20%)]" aria-labelledby="meta-diaria-titulo">
      <div className="relative z-10 max-w-[62%]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-white" aria-hidden="true">
            <Target className="size-5" strokeWidth={2.5} />
          </span>
          <div>
            <h2 id="meta-diaria-titulo" className="font-display text-lg font-extrabold leading-5">Meta diária</h2>
            <p className="mt-1 text-sm font-bold">5 / 15 min</p>
          </div>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/28" role="progressbar" aria-label="Progresso da meta diária" aria-valuemin="0" aria-valuemax="15" aria-valuenow="5">
          <div className="h-full w-1/3 rounded-full bg-[#c3f01f]" />
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-white/95">Continue praticando para manter sua sequência!</p>
        <button type="button" onClick={aoContinuar} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 font-display text-sm font-extrabold uppercase tracking-[0.06em] text-[#075ab9] shadow-[0_4px_0_#c5d3ea] transition active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]">
          Continuar <ArrowRight className="size-4" strokeWidth={3} aria-hidden="true" />
        </button>
      </div>

      <div aria-hidden="true" className="absolute -right-7 -top-10 size-40 rounded-full bg-white/8" />
      <div className="absolute -bottom-2 -right-3 z-0 w-[43%]" aria-hidden="true">
        <Mascote pose="joia" tamanho="full" decorativo prioridade className="w-full drop-shadow-[0_8px_7px_rgb(0_22_65_/_28%)]" />
      </div>
    </section>
  );
}

function ProgressoCurso({ aoAbrirUnidades }) {
  return (
    <section className="mt-11" aria-labelledby="curso-atual-titulo">
      <p className="text-xs font-extrabold uppercase tracking-[0.04em] text-[#075ab9]">Curso em andamento</p>
      <h2 id="curso-atual-titulo" className="font-display mt-2 text-[1.35rem] font-extrabold leading-8 tracking-[-0.025em] text-[#111c2c]">Libras no contexto da saúde</h2>
      <p className="mt-1 text-xs font-medium text-[#5c6674]">13 unidades • 139 sinais da cartilha</p>

      <ol className="relative mt-5 grid grid-cols-4" aria-label="Progresso das unidades">
        <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-7 h-1 bg-[#d6dbe6]" />
        {UNIDADES.map((unidade) => {
          const concluida = unidade.status === "concluída";
          const atual = unidade.status === "atual";
          return (
            <li key={unidade.id} className="relative z-10 flex flex-col items-center">
              <span className={`grid size-14 place-items-center rounded-full border-[5px] bg-white ${concluida ? "border-[#8bc900] text-[#557a00]" : atual ? "border-[#075ab9] text-[#075ab9] shadow-[0_0_0_7px_#dceaff]" : "border-[#c7cddb] text-[#7b8492]"}`}>
                {concluida ? <Check className="size-6" strokeWidth={3} aria-hidden="true" /> : atual ? <Star className="size-6" strokeWidth={2.5} aria-hidden="true" /> : unidade.status === "bloqueada" ? <LockKeyhole className="size-5" strokeWidth={2.4} aria-hidden="true" /> : <Hand className="size-6" strokeWidth={2.2} aria-hidden="true" />}
              </span>
              <span className="sr-only">{unidade.rotulo}: {unidade.status}</span>
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
          {desafio.tema === "azul" ? <Gem className="pratica-recompensa-gema" aria-hidden="true" /> : null}
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
            <span><Star className="fill-current" aria-hidden="true" />Bônus 2x XP</span>
          </div>
        </div>
        <div className="pratica-relampago-retrato" aria-hidden="true">
          <img src={interprete4} alt="" className="pratica-interprete" decoding="async" />
        </div>
      </button>
    </section>
  );
}

function SequenciaSemanal() {
  return (
    <section className="pratica-sequencia mt-3 flex items-center gap-2 rounded-[18px] border border-[#e1ebdb] bg-[#f5f9f1] p-3" aria-label="Sequência semanal">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#70b73b] text-white" aria-hidden="true"><Flame className="size-5 fill-current" /></span>
      <div className="min-w-0 flex-1">
        <h2 className="text-xs font-extrabold text-[#263521]">Mantenha sua sequência!</h2>
        <p className="mt-0.5 text-[10px] leading-4 text-[#62715c]">Pratique todos os dias e conquiste recompensas incríveis.</p>
      </div>
      <div className="pratica-sequencia-dias flex items-center gap-1" aria-label="Três de quatro dias concluídos">
        {[0, 1, 2].map((dia) => <span key={dia} className="grid size-6 place-items-center rounded-full bg-[#91cf56] text-white"><Check className="size-3.5" strokeWidth={3} aria-hidden="true" /></span>)}
        <span className="grid size-7 place-items-center rounded-full border-2 border-[#d6e5d1] bg-white text-xs font-extrabold text-[#41523c]">4</span>
        <Gift className="ml-1 size-6 text-[#539522]" strokeWidth={2.1} aria-hidden="true" />
      </div>
    </section>
  );
}

function TelaPraticar({ aoAbrirDesafio }) {
  return (
    <div className="home-aba-conteudo pratica-tela">
      <section className="pratica-titulo flex items-center justify-between gap-2" aria-labelledby="desafios-diarios-titulo">
        <h1 id="desafios-diarios-titulo" className="flex items-center gap-2 font-display font-bold tracking-[-0.025em] text-[#101d4b]">
          <Trophy className="size-5 shrink-0 text-[#f0a31b]" strokeWidth={2.3} aria-hidden="true" />
          Desafios diários
        </h1>
        <span className="pratica-concluidos flex shrink-0 items-center gap-1.5 font-bold text-[#0875d1]">
          <span className="pratica-calendario"><CalendarDays strokeWidth={2.2} aria-hidden="true" /></span>
          0/3 concluídos
        </span>
      </section>

      <div className="pratica-lista">
        {DESAFIOS_DIARIOS.map((desafio) => <CartaoDesafio key={desafio.id} desafio={desafio} aoAbrir={aoAbrirDesafio} />)}
      </div>

      <DesafioRelampago aoComecar={() => aoAbrirDesafio("Pratique Libras")} />
      <SequenciaSemanal />
    </div>
  );
}

export function Home({ nome, aoAbrirCurso, aoEditarOnboarding }) {
  const [abaAtiva, setAbaAtiva] = useState("aprender");
  const [categoriasAbertas, setCategoriasAbertas] = useState(false);
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
  }, [abaAtiva]);

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
  }, []);

  function trocarAba(aba) {
    setAbaAtiva(aba);
    setCategoriasAbertas(false);
    if (!["aprender", "praticar", "ranking", "conquistas", "perfil"].includes(aba)) {
      const rotulo = NAVEGACAO.find((item) => item.id === aba)?.rotulo;
      setMensagem(`${rotulo}: em breve você terá novidades aqui.`);
    } else {
      setMensagem("");
    }
  }

  function abrirDesafio(titulo) {
    setMensagem(`${titulo}: prepare-se! Os exercícios estarão disponíveis em breve.`);
  }

  return (
    <div className={`relative isolate mx-auto min-h-dvh w-full max-w-[430px] overflow-x-clip font-sans text-[#111c2c] selection:bg-primary-fixed ${categoriasAbertas ? "home-categorias" : abaAtiva === "conquistas" ? "home-conquistas" : abaAtiva === "ranking" ? "home-ranking" : abaAtiva === "praticar" ? "home-praticar bg-[#f9f9ff]" : abaAtiva === "perfil" ? "home-perfil bg-[#f5faff]" : "bg-[#f4fbff]"}`}>
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[290px] overflow-hidden bg-gradient-to-b from-transparent via-[#edfbf2]/55 to-[#d4f2df] ${["praticar", "ranking", "conquistas"].includes(abaAtiva) ? "hidden" : ""}`} aria-hidden="true">
        <span className="absolute -bottom-28 -left-24 size-64 rounded-full bg-[#a9e5a9]/55" />
        <span className="absolute -bottom-32 left-24 size-60 rounded-full bg-[#c8efc2]/75" />
        <span className="absolute -bottom-24 -right-24 size-64 rounded-full bg-[#b6eac1]/65" />
        <span className="absolute bottom-16 left-2 size-10 rounded-full bg-[#d9f5de]/80 blur-sm" />
        <span className="absolute bottom-12 right-7 size-14 rounded-full bg-[#e1f8e5]/85 blur-sm" />
      </div>

      {!["ranking", "conquistas", "perfil", "praticar"].includes(abaAtiva) ? <header className="relative z-30 border-b border-[#d7e4e8] bg-white/92 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <LogoLumiLibras tamanho="sm" className="shrink-0 text-[1.28rem]" />
          <Indicadores />
        </div>
      </header> : null}

      <main className="relative z-10 px-4 pb-32 pt-5">
        {categoriasAbertas ? (
          <Categorias aoVoltar={() => setCategoriasAbertas(false)} aoAbrirCurso={aoAbrirCurso} />
        ) : abaAtiva === "conquistas" ? (
          <Conquistas nome={nome} aoPraticar={() => trocarAba("praticar")} aoRanking={() => trocarAba("ranking")} />
        ) : abaAtiva === "ranking" ? (
          <Ranking nome={nome} aoPraticar={() => trocarAba("praticar")} />
        ) : abaAtiva === "perfil" ? (
          <Perfil nome={nome} aoRanking={() => trocarAba("ranking")} aoEditarOnboarding={aoEditarOnboarding} />
        ) : abaAtiva === "praticar" ? (
          <TelaPraticar aoAbrirDesafio={abrirDesafio} />
        ) : (
          <div className="home-aba-conteudo">
            <section className="relative flex items-center gap-4" aria-labelledby="saudacao-home">
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[#dce8ff] ring-1 ring-[#c8d8f4]">
                <Mascote pose="boas_vindas" tamanho="full" decorativo prioridade className="size-[74px] translate-y-1" />
              </div>
              <div>
                <p className="text-base font-medium text-[#5b6573]">Bom dia,</p>
                <h1 id="saudacao-home" className="font-display text-[1.7rem] font-extrabold leading-8 tracking-[-0.035em] text-[#111c2c]">{primeiroNome}!</h1>
              </div>
              <span aria-hidden="true" className="absolute -right-14 -top-9 -z-10 size-40 rounded-full bg-[#e6f3f3]" />
            </section>

            <MetaDiaria aoContinuar={() => { setMensagem(""); setCategoriasAbertas(true); window.scrollTo({ top: 0, behavior: "instant" }); }} />
            <ProgressoCurso aoAbrirUnidades={aoAbrirCurso} />
          </div>
        )}
      </main>

      {mensagem ? (
        <div role="status" className="fixed bottom-28 left-1/2 z-40 flex w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 items-start gap-3 rounded-xl border border-[#c2cfe2] bg-white p-3 text-sm shadow-xl">
          <p className="flex-1">{mensagem}</p>
          <button type="button" onClick={() => setMensagem("")} className="min-h-8 rounded-lg px-2 font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim" aria-label="Fechar aviso">×</button>
        </div>
      ) : null}

      <nav className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-24px)] max-w-[406px] -translate-x-1/2 rounded-[22px] border border-[#d5dfed] bg-white/95 p-1.5 shadow-[0_8px_28px_rgb(0_79_172_/_18%)] backdrop-blur-xl" aria-label="Navegação principal">
        <div ref={navegacaoRef} className="relative grid grid-cols-5 gap-1">
          <span ref={indicadorRef} className="home-nav-indicador pointer-events-none absolute inset-y-0 left-0 z-0 rounded-2xl bg-[#075ab9] shadow-[0_3px_0_#003875]" aria-hidden="true" />
          {NAVEGACAO.map((item) => {
            const ativa = abaAtiva === item.id;
            return (
              <button ref={(elemento) => { botoesNavegacaoRef.current[item.id] = elemento; }} key={item.id} type="button" onClick={() => trocarAba(item.id)} aria-current={ativa ? "page" : undefined} className={`relative z-10 flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 text-[clamp(9px,2.6vw,11px)] leading-4 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim ${ativa ? "font-bold text-white" : "font-semibold text-[#285486] hover:bg-[#eef4ff]"}`}>
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
