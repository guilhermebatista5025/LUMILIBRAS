const TAMANHOS = {
  sm: "text-xl tracking-[-0.025em]",
  lg: "text-[2.5rem] tracking-[-0.04em]",
};

export function LogoLumiLibras({
  className = "",
  tamanho = "lg",
}) {
  const classeTamanho = TAMANHOS[tamanho] ?? TAMANHOS.lg;

  return (
    <div
      className={`font-display flex items-center font-extrabold leading-none ${classeTamanho} ${className}`.trim()}
      aria-label="LumiLibras"
    >
      <span className="text-[#004fac]" aria-hidden="true">Lumi</span>
      <span className="text-[#87aa00]" aria-hidden="true">Libras</span>
    </div>
  );
}
