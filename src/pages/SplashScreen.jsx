import { useEffect } from "react";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { AppIcon } from "../components/icons/index.js";
import { Mascote } from "../components/mascote/index.js";

const iconesDecorativos = [
  {
    nome: "sign_language",
    classe: "left-8 top-1/4 rotate-12 text-6xl text-[#004fac]/20",
  },
  {
    nome: "auto_awesome",
    classe: "bottom-1/3 right-10 -rotate-12 text-5xl text-[#87aa00]/30",
  },
  {
    nome: "menu_book",
    classe: "right-10 top-1/3 rotate-45 text-4xl text-[#1267d6]/20 sm:right-16",
  },
  {
    nome: "school",
    classe: "bottom-1/4 left-10 -rotate-6 text-6xl text-[#cba81b]/30 sm:left-16",
  },
];

export function SplashScreen({ aoConcluir, duracao = 2400 }) {
  useEffect(() => {
    if (!aoConcluir) return undefined;

    const temporizador = window.setTimeout(aoConcluir, duracao);
    return () => window.clearTimeout(temporizador);
  }, [aoConcluir, duracao]);

  return (
    <main
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#f0f3ff] px-4 text-[#111c2c]"
      aria-busy="true"
    >
      <div className="splash-pattern pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {iconesDecorativos.map((icone, indice) => (
          <AppIcon
            key={icone.nome}
            nome={icone.nome}
            className={`splash-icone-flutuante absolute ${icone.classe}`}
            style={{ animationDelay: `${indice * 350}ms` }}
          />
        ))}
      </div>

      <section className="relative z-10 flex w-full max-w-md flex-col items-center justify-center">
        <div className="mb-12 flex flex-col items-center">
          <LogoLumiLibras />
          <div className="mt-2 grid size-10 place-items-center rounded-full bg-[#acd600] text-[#161e00] shadow-sm" aria-hidden="true">
            <AppIcon nome="sign_language" className="text-2xl" />
          </div>
        </div>

        <div className="relative mb-10 flex size-[clamp(13rem,38vh,16rem)] items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#d8e2ff]/60 blur-2xl" aria-hidden="true" />
          <Mascote
            pose="boas_vindas"
            tamanho="full"
            prioridade
            animado
            alt="Lumi, mascote da LumiLibras, sorrindo e acenando"
            className="relative z-10 drop-shadow-xl"
          />
        </div>

        <p className="max-w-[17.5rem] text-center text-lg leading-7 text-[#424753]">
          Sua amiga que ensina, em Libras, com alegria!
        </p>

        <div className="mt-8 flex h-8 items-center gap-2" role="status" aria-label="Carregando LumiLibras">
          {[0, 1, 2].map((indice) => (
            <span
              key={indice}
              className="splash-loading-dot size-3 rounded-full bg-[#004fac]"
              style={{ animationDelay: `${indice * 180}ms` }}
              aria-hidden="true"
            />
          ))}
          <span className="sr-only">Carregando...</span>
        </div>
      </section>
    </main>
  );
}
