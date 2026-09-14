import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AppIcon as Icone } from "../components/icons/index.js";
import { Mascote } from "../components/mascote/index.js";

const TOTAL_ETAPAS = 5;

const NIVEIS = [
  {
    valor: "nunca_estudei",
    icone: "waving_hand",
    titulo: "Nunca estudei",
    descricao: "Vou começar do zero absoluto.",
  },
  {
    valor: "alguns_sinais",
    icone: "sign_language",
    titulo: "Conheço alguns sinais",
    descricao: "Sei o alfabeto, cumprimentos e sinais básicos.",
  },
  {
    valor: "basico",
    icone: "forum",
    titulo: "Básico",
    descricao: "Já consigo participar de conversas simples.",
  },
  {
    valor: "intermediario",
    icone: "school",
    titulo: "Intermediário",
    descricao: "Compreendo e me comunico com mais fluidez.",
  },
];

const OBJETIVOS = [
  { valor: "familia", icone: "family_restroom", titulo: "Família" },
  { valor: "trabalho", icone: "work", titulo: "Trabalho" },
  { valor: "escola", icone: "school", titulo: "Escola" },
  { valor: "inclusao", icone: "diversity_3", titulo: "Inclusão" },
  { valor: "curiosidade", icone: "lightbulb", titulo: "Curiosidade" },
  { valor: "desenvolvimento_pessoal", icone: "self_improvement", titulo: "Desenvolvimento pessoal" },
];

const METAS = [
  { valor: 5, titulo: "5 minutos", descricao: "Um começo leve" },
  { valor: 10, titulo: "10 minutos", descricao: "Ótimo para criar o hábito", destaque: "Recomendado" },
  { valor: 15, titulo: "15 minutos", descricao: "Progresso consistente" },
  { valor: 20, titulo: "20 minutos", descricao: "Aprendizado intensivo" },
];

function TrilhaHorizontal({ etapa, aoSelecionarEtapa }) {
  const recorteRef = useRef(null);
  const viajanteRef = useRef(null);
  const marcosRef = useRef([]);
  const progressoAtualRef = useRef(0);
  const pontos = [
    { x: 12, y: 12 },
    { x: 31, y: 12 },
    { x: 50, y: 12 },
    { x: 69, y: 12 },
    { x: 88, y: 12 },
  ];

  useLayoutEffect(() => {
    const recorte = recorteRef.current;
    const viajante = viajanteRef.current;
    if (!recorte || !viajante) return undefined;

    const destino = etapa / (TOTAL_ETAPAS - 1);
    let quadro = 0;

    // Adaptado das animações 07 (linha do tempo) e 10 (inércia)
    // da vitrine open source Não Codei.
    function interpolar(inicio, fim, fator) {
      return inicio + ((fim - inicio) * fator);
    }

    function animar() {
      const atual = interpolar(progressoAtualRef.current, destino, 0.12);
      progressoAtualRef.current = Math.abs(destino - atual) < 0.001 ? destino : atual;
      const percentual = progressoAtualRef.current * 100;
      const progressoDaLinha = Math.min(progressoAtualRef.current + (1 / (TOTAL_ETAPAS - 1)), 1);
      const posicaoHorizontal = 12 + (progressoAtualRef.current * 76);

      recorte.setAttribute("width", String(12 + (progressoDaLinha * 76)));
      viajante.style.left = `${posicaoHorizontal}%`;
      viajante.style.top = "50%";
      marcosRef.current.forEach((marco, indice) => {
        marco?.classList.toggle("aceso", percentual + 0.5 >= (indice / (TOTAL_ETAPAS - 1)) * 100);
      });

      if (progressoAtualRef.current !== destino) {
        quadro = requestAnimationFrame(animar);
      } else {
        viajante.style.left = `${pontos[etapa].x}%`;
        viajante.style.top = "50%";
      }
    }

    quadro = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(quadro);
  }, [etapa]);

  return (
    <aside className="pointer-events-none relative z-20 mx-auto h-24 w-[calc(100%-42px)] max-w-2xl" aria-label="Progresso das etapas do onboarding">
      <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="trilha-onboarding-gradiente" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#004fac" />
            <stop offset="58%" stopColor="#1267d6" />
            <stop offset="100%" stopColor="#87aa00" />
          </linearGradient>
          <clipPath id="recorte-trilha-onboarding" clipPathUnits="userSpaceOnUse">
            <rect ref={recorteRef} x="0" y="0" width="31" height="24" />
          </clipPath>
        </defs>
        <path className="onboarding-trilha-fluxo" d="M12 12 C18 3 25 3 31 12 S44 21 50 12 S63 3 69 12 S82 21 88 12" fill="none" stroke="#cbd9ef" strokeWidth="2.3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path className="onboarding-trilha-progresso" d="M12 12 C18 3 25 3 31 12 S44 21 50 12 S63 3 69 12 S82 21 88 12" fill="none" stroke="url(#trilha-onboarding-gradiente)" strokeWidth="3.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" clipPath="url(#recorte-trilha-onboarding)" />
      </svg>

      {pontos.map((ponto, indice) => (
        <button
          ref={(elemento) => { marcosRef.current[indice] = elemento; }}
          key={indice}
          type="button"
          disabled={indice >= etapa}
          onClick={() => aoSelecionarEtapa(indice)}
          className={`onboarding-trilha-marco absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] ${indice < etapa ? "pointer-events-auto cursor-pointer" : "pointer-events-none"} ${indice === etapa ? "atual" : ""}`}
          style={{ left: `${ponto.x}%`, top: `${(ponto.y / 24) * 100}%` }}
          aria-label={indice < etapa ? `Voltar para a etapa ${indice + 1}` : `Etapa ${indice + 1}`}
        >
          {indice < etapa ? <Icone nome="check" className="text-sm" strokeWidth={3.5} /> : <span className="text-xs font-extrabold sm:text-sm">{indice + 1}</span>}
        </button>
      ))}

      <span ref={viajanteRef} className="onboarding-trilha-viajante absolute z-20 size-0" style={{ left: `${pontos[0].x}%`, top: `${(pontos[0].y / 24) * 100}%` }}>
        <span className="onboarding-trilha-ativo absolute grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#1680eb] to-[#004fac] font-display text-lg font-extrabold text-white">
          {etapa + 1}
        </span>
        <span className="absolute left-1/2 top-8 w-28 -translate-x-1/2 text-center text-[11px] font-extrabold leading-4 text-[#075ab9] sm:text-xs">
          ↖ Você está aqui
        </span>
      </span>
    </aside>
  );
}

function ControlesOnboarding({ etapa, aoPular }) {
  return (
    <div className="relative z-30 flex min-h-16 items-center justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] sm:px-20">
      <div className="flex items-center gap-2">
        {etapa === 0 ? (
          <span className="rounded-full bg-[#eaf1ff] px-4 py-2.5 text-sm font-semibold text-[#536987]" role="status" aria-label={`Etapa ${etapa + 1} de ${TOTAL_ETAPAS}`}>
            Etapa <strong className="font-extrabold text-[#075ab9]">{etapa + 1} de {TOTAL_ETAPAS}</strong>
          </span>
        ) : null}
      </div>

      {etapa === 0 ? (
        <button type="button" onClick={aoPular} className="rounded-full border-2 border-[#c7d8f4] bg-white/90 px-4 py-2.5 text-sm font-extrabold text-[#075ab9] shadow-[0_3px_8px_rgb(0_79_172_/_10%)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#e8efff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]">
          Pular
        </button>
      ) : <span aria-hidden="true" />}
    </div>
  );
}

function EtapaIntroducao() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center text-center" aria-labelledby="onboarding-introducao-titulo">
      <div className="relative mb-4">
        <div className="absolute inset-5 -z-10 rounded-full bg-[#adc6ff]/45 blur-2xl" aria-hidden="true" />
        <Mascote
          pose="boas_vindas"
          tamanho="full"
          prioridade
          animado
          alt="Lumi, mascote da LumiLibras, acenando"
          className="max-h-64 max-w-64 drop-shadow-xl sm:max-h-72 sm:max-w-72"
        />
      </div>
      <p className="mb-2 font-bold uppercase tracking-[0.16em] text-[#87aa00]">Seu aprendizado começa aqui</p>
      <h1 id="onboarding-introducao-titulo" className="font-display text-3xl font-extrabold leading-tight tracking-[-0.035em] text-[#111c2c] sm:text-5xl">
        Aprenda Libras de forma leve
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-[#424753] sm:text-lg">
        Vamos personalizar sua experiência para criar uma jornada que combine com você.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3" aria-label="Características do aprendizado">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#d8e2ff] px-4 py-2 text-sm font-bold text-[#003875]">
          <Icone nome="touch_app" className="text-xl" /> Interativo
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#efffc0] px-4 py-2 text-sm font-bold text-[#3c4d00]">
          <Icone nome="celebration" className="text-xl" /> Divertido
        </span>
      </div>
    </section>
  );
}

function EtapaNivel({ valor, aoSelecionar }) {
  return (
    <section className="mx-auto w-full max-w-2xl" aria-labelledby="onboarding-nivel-titulo">
      <div className="mb-5 flex items-center gap-4 sm:justify-center">
        <Mascote pose="curiosa" tamanho="sm" animado alt="Lumi pensando sobre seu nível em Libras" />
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#87aa00]">Conte um pouco sobre você</p>
          <h1 id="onboarding-nivel-titulo" className="font-display mt-1 text-2xl font-extrabold tracking-[-0.025em] sm:text-4xl">
            Qual é o seu nível em Libras?
          </h1>
        </div>
      </div>

      <div className="grid gap-3" role="radiogroup" aria-label="Nível atual em Libras">
        {NIVEIS.map((nivel) => {
          const selecionado = valor === nivel.valor;
          return (
            <button
              key={nivel.valor}
              type="button"
              role="radio"
              aria-checked={selecionado}
              onClick={() => aoSelecionar(nivel.valor)}
              className={`group flex min-h-20 w-full items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] ${selecionado ? "border-[#004fac] bg-[#eef3ff] shadow-[0_4px_0_#004fac]" : "border-[#dce2f2] hover:-translate-y-0.5 hover:border-[#7c9bd1] hover:shadow-md"}`}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl transition ${selecionado ? "bg-[#004fac] text-white" : "bg-[#e8efff] text-[#004fac]"}`}>
                <Icone nome={nivel.icone} className="text-2xl" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-extrabold text-[#111c2c] sm:text-lg">{nivel.titulo}</span>
                <span className="mt-0.5 block text-sm leading-5 text-[#555b68]">{nivel.descricao}</span>
              </span>
              <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${selecionado ? "border-[#004fac] bg-[#004fac] text-white" : "border-[#9da3b1]"}`}>
                {selecionado ? <Icone nome="check" className="text-base" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EtapaObjetivos({ valores, aoAlternar }) {
  return (
    <section className="mx-auto w-full max-w-2xl" aria-labelledby="onboarding-objetivo-titulo">
      <div className="mb-2 flex justify-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-[#fff1d5] text-[#cf6100] shadow-sm" aria-hidden="true">
          <Icone nome="local_fire_department" className="text-4xl" />
        </span>
      </div>
      <h1 id="onboarding-objetivo-titulo" className="font-display text-center text-2xl font-extrabold tracking-[-0.025em] sm:text-4xl">
        Por que você quer aprender Libras?
      </h1>
      <p className="mb-6 mt-2 text-center text-sm leading-6 text-[#555b68] sm:text-base">
        Você pode escolher mais de uma opção.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Objetivos de aprendizado">
        {OBJETIVOS.map((objetivo) => {
          const selecionado = valores.includes(objetivo.valor);
          return (
            <button
              key={objetivo.valor}
              type="button"
              aria-pressed={selecionado}
              onClick={() => aoAlternar(objetivo.valor)}
              className={`relative flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border-2 p-3 text-center shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] ${selecionado ? "border-[#87aa00] bg-[#f4ffd8] shadow-[0_4px_0_#668100]" : "border-[#dce2f2] bg-white hover:-translate-y-0.5 hover:border-[#7c9bd1] hover:shadow-md"}`}
            >
              {selecionado ? (
                <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-[#668100] text-white">
                  <Icone nome="check" className="text-base" />
                </span>
              ) : null}
              <Icone nome={objetivo.icone} className={`text-3xl ${selecionado ? "text-[#668100]" : "text-[#004fac]"}`} />
              <span className="font-display text-sm font-extrabold leading-5 text-[#111c2c] sm:text-base">{objetivo.titulo}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EtapaMeta({ valor, aoSelecionar }) {
  return (
    <section className="mx-auto w-full max-w-2xl" aria-labelledby="onboarding-meta-titulo">
      <div className="mb-3 flex justify-center">
        <Mascote pose="joia" tamanho="sm" animado alt="Lumi incentivando a escolha de uma meta diária" />
      </div>
      <h1 id="onboarding-meta-titulo" className="font-display text-center text-2xl font-extrabold tracking-[-0.025em] sm:text-4xl">
        Defina sua meta diária
      </h1>
      <p className="mb-6 mt-2 text-center leading-6 text-[#555b68]">
        Quanto tempo você quer praticar por dia?
      </p>

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Meta diária de estudo">
        {METAS.map((meta) => {
          const selecionado = valor === meta.valor;
          return (
            <button
              key={meta.valor}
              type="button"
              role="radio"
              aria-checked={selecionado}
              onClick={() => aoSelecionar(meta.valor)}
              className={`relative flex min-h-28 items-center gap-4 rounded-2xl border-2 p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] ${selecionado ? "border-[#004fac] bg-[#eef3ff] shadow-[0_4px_0_#004fac]" : "border-[#dce2f2] bg-white hover:-translate-y-0.5 hover:border-[#7c9bd1] hover:shadow-md"}`}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-full font-display text-xl font-extrabold ${selecionado ? "bg-[#004fac] text-white" : "bg-[#e8efff] text-[#004fac]"}`}>
                {meta.valor}
              </span>
              <span>
                <span className="flex flex-wrap items-center gap-2 font-display text-lg font-extrabold">
                  {meta.titulo}
                  {meta.destaque ? <span className="rounded-full bg-[#efffc0] px-2 py-1 text-[0.65rem] uppercase tracking-wider text-[#3c4d00]">{meta.destaque}</span> : null}
                </span>
                <span className="mt-1 block text-sm text-[#555b68]">{meta.descricao}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LinhaResumo({ icone, rotulo, valor }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#e2e6f0] py-3 last:border-b-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8efff] text-[#004fac]">
        <Icone nome={icone} className="text-xl" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[#727785]">{rotulo}</span>
        <span className="mt-0.5 block font-display font-extrabold text-[#111c2c]">{valor}</span>
      </span>
    </div>
  );
}

function EtapaConcluida({ dados }) {
  const nivel = NIVEIS.find((item) => item.valor === dados.nivel)?.titulo ?? "Não informado";
  const objetivos = OBJETIVOS.filter((item) => dados.objetivos.includes(item.valor)).map((item) => item.titulo);

  return (
    <section className="relative mx-auto flex w-full max-w-xl flex-col items-center text-center" aria-labelledby="onboarding-concluido-titulo">
      <div className="onboarding-confetes" aria-hidden="true">
        {Array.from({ length: 12 }, (_, indice) => <i key={indice} />)}
      </div>
      <div className="relative mb-2">
        <div className="absolute inset-4 -z-10 rounded-full bg-[#c8ef66]/55 blur-2xl" aria-hidden="true" />
        <Mascote pose="otimo" tamanho="full" animado alt="Lumi celebrando a configuração do perfil" className="max-h-60 max-w-60 drop-shadow-xl" />
      </div>
      <p className="font-bold uppercase tracking-[0.16em] text-[#668100]">Perfil configurado</p>
      <h1 id="onboarding-concluido-titulo" className="font-display mt-1 text-4xl font-extrabold tracking-[-0.04em] text-[#004fac] sm:text-5xl">
        Tudo pronto!
      </h1>
      <p className="mt-3 max-w-md leading-7 text-[#555b68]">
        Sua jornada foi personalizada. Você poderá alterar essas escolhas quando quiser.
      </p>

      <div className="mt-6 w-full rounded-3xl border border-[#dce2f2] bg-white px-5 py-2 text-left shadow-[0_12px_35px_rgba(0,79,172,0.10)]">
        <LinhaResumo icone="signal_cellular_alt" rotulo="Nível" valor={nivel} />
        <LinhaResumo icone="track_changes" rotulo="Objetivo" valor={objetivos.length ? objetivos.join(", ") : "Explorar Libras"} />
        <LinhaResumo icone="schedule" rotulo="Meta diária" valor={`${dados.metaDiaria} minutos por dia`} />
      </div>
    </section>
  );
}

export function Onboarding({ perfil, aoConcluir }) {
  const [etapa, setEtapa] = useState(0);
  const [direcao, setDirecao] = useState("avancar");
  const [finalizando, setFinalizando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState(() => ({
    nivel: perfil?.nivelLibras || "",
    objetivos: perfil?.objetivos || [],
    metaDiaria: perfil?.metaDiaria || 10,
  }));

  const podeAvancar = useMemo(() => etapa !== 1 || Boolean(dados.nivel), [dados.nivel, etapa]);

  function irPara(proximaEtapa, novaDirecao) {
    const etapaDeDestino = Math.max(0, Math.min(TOTAL_ETAPAS - 1, proximaEtapa));
    if (etapaDeDestino === etapa) return;

    const atualizarEtapa = () => {
      setDirecao(novaDirecao);
      setErro("");
      setEtapa(etapaDeDestino);
    };
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Animação 30 da vitrine Não Codei: usa a View Transition API
    // e mantém uma troca direta como fallback para outros navegadores.
    if (document.startViewTransition && !reduzirMovimento) {
      document.startViewTransition(() => flushSync(atualizarEtapa));
    } else {
      atualizarEtapa();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function alternarObjetivo(valor) {
    setDados((estadoAtual) => ({
      ...estadoAtual,
      objetivos: estadoAtual.objetivos.includes(valor)
        ? estadoAtual.objetivos.filter((objetivo) => objetivo !== valor)
        : [...estadoAtual.objetivos, valor],
    }));
  }

  async function avancar() {
    if (etapa < TOTAL_ETAPAS - 1) {
      if (podeAvancar) irPara(etapa + 1, "avancar");
      return;
    }

    setFinalizando(true);
    setErro("");
    try {
      await aoConcluir?.(dados);
      setConcluido(true);
    } catch (error) {
      setErro(error.message || "Não foi possível salvar suas preferências. Tente novamente.");
    } finally {
      setFinalizando(false);
    }
  }

  function renderizarEtapa() {
    if (etapa === 0) return <EtapaIntroducao />;
    if (etapa === 1) return <EtapaNivel valor={dados.nivel} aoSelecionar={(nivel) => setDados((atual) => ({ ...atual, nivel }))} />;
    if (etapa === 2) return <EtapaObjetivos valores={dados.objetivos} aoAlternar={alternarObjetivo} />;
    if (etapa === 3) return <EtapaMeta valor={dados.metaDiaria} aoSelecionar={(metaDiaria) => setDados((atual) => ({ ...atual, metaDiaria }))} />;
    return <EtapaConcluida dados={dados} />;
  }

  const textoBotao = etapa === TOTAL_ETAPAS - 1
    ? (concluido ? "Perfil configurado" : "Começar primeira lição")
    : "Continuar";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#f9f9ff] text-[#111c2c] selection:bg-[#d8e2ff] selection:text-[#001a41]">
      {etapa === 0 ? (
        <ControlesOnboarding
          etapa={etapa}
          aoPular={() => irPara(TOTAL_ETAPAS - 1, "avancar")}
        />
      ) : null}
      <div className={etapa > 0 ? "pt-[max(12px,env(safe-area-inset-top))]" : ""}>
        <TrilhaHorizontal etapa={etapa} aoSelecionarEtapa={(destino) => irPara(destino, "voltar")} />
      </div>

      <main className="flex flex-1 px-4 pb-7 pt-1 sm:px-20 sm:pb-10 sm:pt-3">
        <div key={etapa} className={`onboarding-etapa onboarding-etapa--${direcao} my-auto w-full`} style={{ viewTransitionName: "onboarding-etapa" }}>
          {renderizarEtapa()}
        </div>
      </main>

      <footer className="sticky bottom-[20px] z-30 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-2xl rounded-3xl bg-[#f9f9ff]/88 p-2 shadow-[0_8px_32px_rgb(0_79_172_/_10%)] backdrop-blur-xl">
          {erro ? <p className="mb-3 rounded-xl bg-[#ffdad6] px-4 py-3 text-sm font-semibold text-[#93000a]" role="alert">{erro}</p> : null}
          <button
            type="button"
            onClick={avancar}
            disabled={!podeAvancar || finalizando || concluido}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#004fac] px-6 font-display text-base font-extrabold text-white shadow-[0_5px_0_#003875] transition hover:bg-[#1267d6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] active:translate-y-1 active:shadow-[0_1px_0_#003875] disabled:cursor-not-allowed disabled:bg-[#b7bfce] disabled:shadow-[0_5px_0_#9299a7] disabled:opacity-80"
          >
            {finalizando ? "Salvando..." : textoBotao}
            {!finalizando && !concluido ? <Icone nome={etapa === TOTAL_ETAPAS - 1 ? "rocket_launch" : "arrow_forward"} className="text-xl" /> : null}
            {concluido ? <Icone nome="check_circle" className="text-xl" /> : null}
          </button>
          {etapa === 1 && !dados.nivel ? <p className="mt-2 text-center text-xs font-medium text-[#727785]">Escolha uma opção para continuar.</p> : null}
        </div>
      </footer>
    </div>
  );
}
