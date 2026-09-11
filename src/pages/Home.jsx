import { useState } from "react";
import { Check, Flame, Gem, Heart, Hand } from "lucide-react";
import fundoOficialHome from "../assets/componentes/fundo-oficial-da-home.png";
import { AppIcon as Icone } from "../components/icons/index.js";

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
  { id: "praticar", icone: "fitness_center", rotulo: "Praticar" },
  { id: "ranking", icone: "leaderboard", rotulo: "Ranking" },
  { id: "conquistas", icone: "emoji_events", rotulo: "Conquistas" },
  { id: "perfil", icone: "account_circle", rotulo: "Perfil" },
];


// Labels occupy the wider side of each row, with a 16px gap from the medal.
// Connectors share the medals' 62% / 38% anchors and 40px vertical centre.
function Trilha({ aoContinuar }) {
  return (
    <ol className="relative m-0 list-none p-0" aria-label="Trilha do curso">
      {ETAPAS.map((etapa, indice) => {
        const esquerda = etapa.lado === "esquerda";
        const atual = etapa.status === "atual";
        const concluida = etapa.status === "concluida";
        return (
          <li key={etapa.id} className="relative h-32 last:h-24">
            {indice < ETAPAS.length - 1 && (
              <svg className="pointer-events-none absolute left-0 top-10 h-32 w-full overflow-visible text-outline-variant" viewBox="0 0 100 128" preserveAspectRatio="none" aria-hidden="true">
                <path d={esquerda ? "M62 0 C62 54 38 74 38 128" : "M38 0 C38 54 62 74 62 128"} fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="5 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
            )}
            <div className={`absolute top-0 z-10 flex min-h-20 w-[calc(62%-52px)] flex-col justify-center ${esquerda ? "left-0 items-end text-right" : "right-0 items-start text-left"}`}>
              {atual && <span className="mb-1 max-w-full rounded-full bg-primary-container px-2 py-1 text-[10px] font-bold leading-3 text-on-primary shadow-sm">PRÓXIMA AULA</span>}
              <h2 className="font-display text-[clamp(14px,3.8vw,16px)] font-extrabold leading-5 tracking-[-0.035em] text-on-primary-fixed">{etapa.id}. {etapa.titulo}</h2>
              <p className="mt-1 font-sans text-[clamp(13px,3.5vw,15px)] font-normal leading-5 tracking-[-0.025em] text-on-surface-variant">{etapa.descricao}</p>
            </div>
            <button type="button" disabled={!atual} onClick={atual ? aoContinuar : undefined}
              aria-label={atual ? "Começar a aula de Saúde" : `${etapa.titulo}: ${etapa.descricao}`}
              className={`absolute top-1 z-10 grid size-18 -translate-x-1/2 place-items-center rounded-full border-[6px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-fixed-dim ${esquerda ? "left-[62%]" : "left-[38%]"} ${atual ? "border-white bg-primary-container text-white shadow-[0_0_0_6px_#d8e2ff,0_8px_20px_rgb(0_79_172_/_24%)] transition-transform active:translate-y-0.5 motion-reduce:transition-none" : concluida ? "border-secondary-fixed bg-secondary-fixed-dim text-on-secondary-container shadow-[0_4px_0_#8aad00,0_8px_16px_rgb(81_102_0_/_12%)]" : "border-surface-container-low bg-outline-variant text-on-surface-variant shadow-[0_4px_0_#b1b8c7,0_8px_16px_rgb(17_28_44_/_8%)]"}`}>
              {concluida ? <Check className="size-8 text-white" strokeWidth={4} aria-hidden="true" /> : <Icone nome={etapa.icone} className="text-[30px]" strokeWidth={2.5} />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function Home() {
  const [abaAtiva, setAbaAtiva] = useState("aprender");
  const [mensagem, setMensagem] = useState("");
  function continuar() {
    setMensagem("A aula de Saúde estará disponível em breve.");
  }
  function trocarAba(aba) {
    setAbaAtiva(aba);
    setMensagem(aba === "aprender" ? "" : `${NAVEGACAO.find((item) => item.id === aba)?.rotulo}: em breve você terá novidades aqui.`);
  }

  return (
    <div className="relative isolate mx-auto min-h-dvh w-full max-w-[430px] overflow-x-clip bg-[#f5fbff] font-sans text-on-surface selection:bg-primary-fixed">
      <img src={fundoOficialHome} width="941" height="1672" alt="" aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-auto w-full select-none [mask-image:linear-gradient(to_bottom,transparent,black_96px)]" />
      <header className="relative z-20">
        <div className="relative isolate overflow-hidden bg-primary-container px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))] text-on-primary" aria-label="Seu progresso">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,transparent_25%,rgb(255_255_255_/_9%)_25%,rgb(255_255_255_/_9%)_48%,transparent_48%,transparent_78%,rgb(0_79_172_/_30%)_78%)]" />
          <div className="flex min-h-14 items-center justify-between gap-3 text-sm font-bold tabular-nums">
            <span className="flex shrink-0 items-center gap-1.5" aria-label="Curso de Libras">
              <span className="grid size-7 place-items-center rounded-lg border-2 border-white/90 bg-white/15 shadow-sm"><Hand className="size-5" strokeWidth={2.5} aria-hidden="true" /></span>
              <span>Libras</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5" aria-label="Sequência de 7 dias"><Flame className="size-6 fill-[#FFD84D] stroke-[#FFD84D]" strokeWidth={2} aria-hidden="true" />7</span>
            <span className="flex shrink-0 items-center gap-1.5" aria-label="5 corações"><Heart className="size-6 fill-error stroke-error-container" strokeWidth={2} aria-hidden="true" />5</span>
            <span className="flex shrink-0 items-center gap-1.5" aria-label="250 gemas"><Gem className="size-6 fill-primary-fixed-dim stroke-white" strokeWidth={2} aria-hidden="true" />250</span>
          </div>
        </div>
      </header>
      <main className="relative z-10 px-4 pb-56 pt-8">
        <h1 className="sr-only">Sua trilha de aprendizado em Libras</h1>
        <Trilha aoContinuar={continuar} />
      </main>
      {mensagem && <div role="status" className="fixed bottom-28 left-1/2 z-40 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 rounded-lumi-md border border-outline-variant bg-white p-3 text-sm shadow-lg">
        <div className="flex items-start gap-3"><p className="flex-1">{mensagem}</p><button type="button" onClick={() => setMensagem("")} className="min-h-8 px-2 font-bold text-primary" aria-label="Fechar aviso">×</button></div>
      </div>}
      <nav className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-24px)] max-w-[406px] -translate-x-1/2 rounded-lumi-xl border border-surface-container bg-white/95 p-1.5 shadow-[0_6px_24px_rgb(0_79_172_/_12%)] backdrop-blur-md" aria-label="Navegação principal">
        <div className="grid grid-cols-5 gap-1">
          {NAVEGACAO.map((item) => {
            const ativa = abaAtiva === item.id;
            return <button key={item.id} type="button" onClick={() => trocarAba(item.id)} aria-current={ativa ? "page" : undefined}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lumi-lg px-0.5 text-[clamp(9px,2.6vw,11px)] leading-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim ${ativa ? "bg-primary-container font-bold text-white shadow-[0_3px_0_var(--color-primary)]" : "font-medium text-primary hover:bg-surface-container-low"}`}>
              <Icone nome={item.icone} className="text-2xl" strokeWidth={ativa ? 2.5 : 2} /><span>{item.rotulo}</span>
            </button>;
          })}
        </div>
      </nav>
    </div>
  );
}
