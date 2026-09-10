import { Mascote } from "./Mascote.jsx";

const POSICOES = {
  esquerda: "flex-col sm:flex-row",
  direita: "flex-col sm:flex-row-reverse",
};

/**
 * Combina o mascote com uma mensagem, ideal para dicas e feedbacks.
 */
export function MascoteMensagem({
  pose = "boas_vindas",
  titulo,
  children,
  posicao = "esquerda",
  tamanho = "md",
  className = "",
  aoVivo = false,
}) {
  const classePosicao = POSICOES[posicao] ?? POSICOES.esquerda;

  return (
    <aside
      className={`flex items-center gap-5 rounded-[2rem] border border-violet-100 bg-violet-50/70 p-5 sm:p-6 ${classePosicao} ${className}`.trim()}
      aria-live={aoVivo ? "polite" : undefined}
    >
      <Mascote pose={pose} tamanho={tamanho} decorativo animado />
      <div className="min-w-0 flex-1 text-center sm:text-left">
        {titulo ? <h2 className="text-xl font-black tracking-tight text-slate-950">{titulo}</h2> : null}
        <div className={`${titulo ? "mt-2" : ""} leading-7 text-slate-600`}>{children}</div>
      </div>
    </aside>
  );
}
