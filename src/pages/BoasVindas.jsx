import { GoogleIcon } from "../components/icons/index.js";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { Mascote } from "../components/mascote/index.js";

const classeBotaoBase =
  "flex h-14 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] active:translate-y-[3px]";

export function BoasVindas({
  aoCriarConta,
  aoEntrar,
  aoEntrarComGoogle,
}) {
  return (
    <main className="min-h-dvh bg-[#f9f9ff] px-4 py-10 text-[#111c2c] selection:bg-[#1267d6] selection:text-white sm:py-12">
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-md flex-col items-center justify-center sm:min-h-[calc(100dvh-6rem)]">
        <LogoLumiLibras className="mb-6" />

        <div className="relative z-0 mb-5 flex size-[clamp(12rem,36vh,16rem)] items-center justify-center">
          <div
            className="absolute inset-0 -z-10 rounded-full bg-[#dee9ff]/70 motion-safe:animate-pulse"
            aria-hidden="true"
          />
          <Mascote
            pose="boas_vindas"
            tamanho="full"
            prioridade
            alt="Lumi, mascote da LumiLibras, acenando em boas-vindas"
            className="drop-shadow-xl transition-transform duration-300 ease-out motion-safe:hover:-translate-y-2"
          />
        </div>

        <div className="mb-10 w-full px-2 text-center">
          <h1 className="font-display text-[2rem] font-bold leading-10 tracking-[-0.025em] text-[#111c2c]">
            Sua jornada em Libras começa aqui
          </h1>
          <p className="mt-3 text-base leading-6 text-[#424753]">
            Aprenda a Língua Brasileira de Sinais de forma divertida e interativa com a Lumi!
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={aoCriarConta}
            className={`${classeBotaoBase} bg-[#004fac] text-white shadow-[0_4px_0_#003875] hover:bg-[#005bbf] active:shadow-[0_1px_0_#003875]`}
          >
            Criar conta
          </button>

          <button
            type="button"
            onClick={aoEntrar}
            className={`${classeBotaoBase} bg-[#d8e3f9] text-[#004fac] shadow-[0_4px_0_#bac7df] hover:bg-[#cfdaf0] active:shadow-[0_1px_0_#bac7df]`}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={aoEntrarComGoogle}
            className={`${classeBotaoBase} mt-2 gap-2.5 border border-[#747775] bg-white text-[#1f1f1f] shadow-[0_3px_0_#c2c6d6] hover:bg-[#f8f9fa] active:shadow-none`}
          >
            <GoogleIcon />
            Continuar com o Google
          </button>
        </div>
      </section>
    </main>
  );
}
