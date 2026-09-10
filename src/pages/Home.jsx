import { useState } from "react";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { Mascote } from "../components/mascote/index.js";

const ETAPAS = [
  { id: 1, titulo: "Saudações", descricao: "Concluída", icone: "check", status: "concluida", lado: "esquerda" },
  { id: 2, titulo: "Família", descricao: "Concluída", icone: "check", status: "concluida", lado: "direita" },
  { id: 3, titulo: "Saúde", descricao: "Comece agora!", icone: "stethoscope", status: "atual", lado: "esquerda" },
  { id: 4, titulo: "Consulta", descricao: "Bloqueada", icone: "lock", status: "bloqueada", lado: "direita" },
  { id: 5, titulo: "Emergência", descricao: "Bloqueada", icone: "lock", status: "bloqueada", lado: "esquerda" },
  { id: 6, titulo: "Revisão", descricao: "Bloqueada", icone: "lock", status: "bloqueada", lado: "direita" },
];

const NAVEGACAO = [
  { id: "aprender", icone: "school", rotulo: "Aprender" },
  { id: "praticar", icone: "sign_language", rotulo: "Praticar" },
  { id: "ranking", icone: "leaderboard", rotulo: "Ranking" },
  { id: "conquistas", icone: "emoji_events", rotulo: "Conquistas" },
  { id: "perfil", icone: "account_circle", rotulo: "Perfil" },
];

function Icone({ nome, className = "" }) {
  return <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">{nome}</span>;
}

function Medalha({ etapa }) {
  const classes = {
    concluida: "border-[#6ebb00] bg-gradient-to-br from-[#b6ed35] to-[#68b600] text-white shadow-[0_7px_0_#4b9000,0_12px_22px_rgba(104,182,0,0.25)]",
    atual: "border-white bg-gradient-to-br from-[#2188ff] to-[#004fac] text-white shadow-[0_0_0_8px_#d8edff,0_8px_0_#003875,0_16px_30px_rgba(0,79,172,0.30)]",
    bloqueada: "border-[#d8dde7] bg-gradient-to-br from-[#f5f6f9] to-[#ccd1db] text-[#606875] shadow-[0_7px_0_#b6bdc9,0_12px_22px_rgba(82,91,109,0.12)]",
  }[etapa.status];

  return (
    <span className={`relative z-10 grid size-[4.75rem] shrink-0 place-items-center rounded-full border-[5px] sm:size-[5.5rem] ${classes}`}>
      <Icone nome={etapa.icone} className={etapa.status === "atual" ? "text-[2.5rem] sm:text-5xl" : "text-3xl sm:text-4xl"} />
    </span>
  );
}

function Trilha({ aoContinuar }) {
  return (
    <section className="relative mt-10 overflow-hidden pb-10" aria-labelledby="trilha-titulo">
      <div className="pointer-events-none absolute -left-20 top-48 size-52 rounded-full bg-[#dff3ff] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 bottom-16 size-56 rounded-full bg-[#e6ffcf] blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-2xl">
        <div className="mb-8 flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#668100]">Sua jornada</p>
            <h2 id="trilha-titulo" className="font-display mt-1 text-2xl font-extrabold tracking-[-0.035em] text-[#10203b] sm:text-3xl">Trilha do curso</h2>
          </div>
          <span className="rounded-full border border-[#cbe1fa] bg-white px-3 py-1.5 text-sm font-extrabold text-[#004fac] shadow-sm">2 de 6 etapas</span>
        </div>

        <svg className="pointer-events-none absolute left-1/2 top-[5.8rem] h-[calc(100%-7rem)] w-44 -translate-x-1/2" viewBox="0 0 176 670" preserveAspectRatio="none" aria-hidden="true">
          <path d="M88 20 C32 75 147 125 88 180 C29 235 146 285 88 340 C30 395 147 445 88 500 C30 555 146 605 88 660" fill="none" stroke="#cdd6e5" strokeWidth="8" strokeLinecap="round" strokeDasharray="5 15" />
        </svg>

        <div className="relative space-y-6 sm:space-y-7">
          {ETAPAS.map((etapa) => {
            const esquerda = etapa.lado === "esquerda";
            const atual = etapa.status === "atual";
            return (
              <div key={etapa.id} className="relative grid min-h-24 grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className={`min-w-0 ${esquerda ? "text-right" : "order-3 text-left"}`}>
                  {atual ? <span className="mb-2 inline-flex rounded-full bg-[#1267d6] px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_3px_0_#004fac]">Próxima aula</span> : null}
                  <p className="font-display text-base font-extrabold leading-tight text-[#10203b] sm:text-lg"><span className="text-[#004fac]">{etapa.id}.</span> {etapa.titulo}</p>
                  <p className={`mt-1 text-sm font-medium ${atual ? "text-[#1267d6]" : "text-[#71798a]"}`}>{etapa.descricao}</p>
                </div>

                <button type="button" onClick={atual ? aoContinuar : undefined} disabled={!atual} className={`relative z-10 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] ${atual ? "cursor-pointer transition hover:-translate-y-1" : "cursor-default"}`} aria-label={atual ? "Começar a unidade Saúde" : `${etapa.titulo}: ${etapa.descricao}`}>
                  <Medalha etapa={etapa} />
                </button>

                <div className={`min-w-0 ${esquerda ? "order-3" : "order-1"}`} aria-hidden="true" />
              </div>
            );
          })}
        </div>

        <div className="relative mt-5 h-32 overflow-hidden rounded-[2rem] border border-[#d4e9c1] bg-gradient-to-br from-[#f4ffdf] via-[#e9ffdb] to-[#d6f4c3] p-5 shadow-sm">
          <div className="absolute -bottom-14 -left-8 size-36 rounded-full bg-[#87c976]/50" aria-hidden="true" />
          <div className="absolute -bottom-10 left-16 size-28 rounded-full bg-[#64b75d]/35" aria-hidden="true" />
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-[#c8ef66]/60" aria-hidden="true" />
          <div className="relative flex h-full items-center justify-between gap-4">
            <div className="rotate-[-4deg] rounded-xl bg-[#ffd5a1] px-4 py-3 text-sm font-extrabold leading-5 text-[#634018] shadow-[0_4px_0_#d5a66d]">Mais conhecimento,<br />mais inclusão!</div>
            <p className="max-w-[12rem] text-right font-display text-lg font-extrabold italic leading-5 text-[#004fac]">Libras transforma vidas!</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Home({ nome = "Usuário" }) {
  const [abaAtiva, setAbaAtiva] = useState("aprender");
  const [mensagem, setMensagem] = useState("");
  const primeiroNome = nome.trim().split(" ")[0] || "Usuário";

  function continuar() {
    setMensagem("A unidade Saúde está pronta. Vamos praticar os sinais essenciais?");
  }

  function trocarAba(aba) {
    setAbaAtiva(aba);
    setMensagem(aba === "aprender" ? "" : `${NAVEGACAO.find((item) => item.id === aba)?.rotulo}: em breve você terá novidades aqui.`);
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#fbfdff] pb-24 text-[#10203b] selection:bg-[#d8e2ff] selection:text-[#001a41]">
      <header className="sticky top-0 z-40 border-b border-[#e1e8f2]/90 bg-white/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="grid size-10 shrink-0 place-items-center rounded-xl text-[#004fac] transition hover:bg-[#e8efff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]" aria-label="Abrir menu"><Icone nome="menu" className="text-3xl" /></button>
            <LogoLumiLibras tamanho="sm" className="hidden sm:flex" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2" aria-label="Seu progresso">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e0e7f0] bg-white px-2.5 py-2 text-sm font-extrabold text-[#c55a00] shadow-sm sm:px-3"><Icone nome="local_fire_department" className="text-[1.35rem]" /><span className="hidden sm:inline">7 dias</span><span className="sm:hidden">7</span></span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e0e7f0] bg-white px-2.5 py-2 text-sm font-extrabold text-[#10203b] shadow-sm sm:px-3"><Icone nome="diamond" className="text-[1.35rem] text-[#1267d6]" /><span>250</span></span>
            <span className="hidden items-center gap-1 rounded-full border border-[#e0e7f0] bg-white px-3 py-2 text-sm font-extrabold text-[#10203b] shadow-sm sm:inline-flex"><Icone nome="favorite" className="text-[1.25rem] text-[#e75075]" /><span>5</span></span>
            <button type="button" className="grid size-10 place-items-center rounded-full border-2 border-[#004fac] bg-[#e8efff] text-[#004fac] shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]" aria-label={`Perfil de ${primeiroNome}`}><Icone nome="person" className="text-2xl" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pt-5 sm:px-6 sm:pt-8">
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#075bd3] via-[#004fac] to-[#002e7d] px-5 py-7 text-white shadow-[0_10px_0_#003875,0_18px_36px_rgba(0,79,172,0.22)] sm:min-h-[23rem] sm:px-9 sm:py-10" aria-labelledby="curso-atual">
          <div className="absolute -left-12 top-1/3 size-44 rounded-full bg-[#39a0ff]/20 blur-2xl" aria-hidden="true" />
          <div className="absolute bottom-0 right-1/4 size-52 rounded-full bg-[#001f69]/35 blur-2xl" aria-hidden="true" />
          <div className="relative z-10 max-w-[65%] sm:max-w-[58%]">
            <span className="inline-flex rounded-full bg-[#21a6ff]/85 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.06em] shadow-sm sm:text-sm">Seção 2, unidade 5</span>
            <h1 id="curso-atual" className="font-display mt-4 text-[2rem] font-extrabold leading-[1.08] tracking-[-0.045em] sm:text-5xl">Libras no contexto da saúde</h1>
            <p className="mt-4 text-sm leading-5 text-[#e4efff] sm:max-w-md sm:text-lg sm:leading-7">Continue aprendendo sinais essenciais para se comunicar em situações de saúde.</p>
            <button type="button" onClick={continuar} className="mt-6 inline-flex h-13 min-w-44 items-center justify-center gap-2 rounded-2xl bg-[#8edb00] px-6 font-display text-lg font-extrabold text-white shadow-[0_5px_0_#5a9900] transition hover:bg-[#9dea00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d8ff87] active:translate-y-[3px] active:shadow-[0_2px_0_#5a9900] sm:h-15 sm:min-w-60 sm:text-2xl">Continuar <Icone nome="arrow_forward_ios" className="text-xl" /></button>
          </div>
          <p className="absolute right-4 top-7 hidden max-w-28 rotate-[-7deg] text-center font-display text-xl font-extrabold italic leading-5 text-[#d9ff6a] sm:block">Você consegue!</p>
          <div className="absolute bottom-0 right-[-2.25rem] w-[50%] sm:right-2 sm:w-[43%]" aria-hidden="true"><Mascote pose="joia" tamanho="full" decorativo prioridade animado className="drop-shadow-2xl" /></div>
        </section>

        <section className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Resumo do progresso">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#668100]">Olá, {primeiroNome}</p>
            <p className="mt-1 text-base text-[#596579]">Sua próxima aula já está te esperando.</p>
          </div>
          <button type="button" onClick={() => setMensagem("Sua meta diária é de 10 minutos. Você já começou muito bem!")} className="flex items-center gap-3 rounded-2xl border border-[#f4dfbb] bg-[#fff8e9] px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffe0a8]">
            <span className="grid size-10 place-items-center rounded-xl bg-[#fff0d4] text-[#e26c00]"><Icone nome="track_changes" className="text-2xl" /></span>
            <span><span className="block text-xs font-bold uppercase tracking-[0.1em] text-[#9d6326]">Meta diária</span><span className="font-display text-lg font-extrabold text-[#10203b]">10 min</span></span>
            <Icone nome="chevron_right" className="ml-2 text-[#10203b]" />
          </button>
        </section>

        {mensagem ? <p className="mt-5 rounded-2xl border border-[#b8d98b] bg-[#f4ffdf] px-4 py-3 text-sm font-semibold text-[#3c5e00]" role="status">{mensagem}</p> : null}

        <Trilha aoContinuar={continuar} />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dce2f2] bg-white/95 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="Navegação principal">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-5 gap-1">
          {NAVEGACAO.map((item) => {
            const ativa = abaAtiva === item.id;
            return <button key={item.id} type="button" onClick={() => trocarAba(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.65rem] font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] sm:text-xs ${ativa ? "bg-[#075bd3] text-white shadow-[0_3px_0_#003875]" : "text-[#173d78] hover:bg-[#eef5ff]"}`} aria-current={ativa ? "page" : undefined}><Icone nome={item.icone} className="text-[1.35rem]" /><span>{item.rotulo}</span></button>;
          })}
        </div>
      </nav>
    </div>
  );
}
