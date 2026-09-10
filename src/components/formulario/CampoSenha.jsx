import { useState } from "react";
import { MensagemErro } from "./MensagemErro.jsx";

function IconeOlho({ visivel }) {
  return visivel ? (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.1 12s3.6-7 9.9-7 9.9 7 9.9 7-3.6 7-9.9 7-9.9-7-9.9-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.3 0 9.9 8 9.9 8a17.7 17.7 0 0 1-2.1 3.2M6.6 6.6C3.7 8.6 2.1 12 2.1 12s3.6 8 9.9 8a9.8 9.8 0 0 0 4.1-.9" />
    </svg>
  );
}

export function CampoSenha({
  id,
  name = id,
  label,
  value,
  onChange,
  erro = "",
  autoComplete,
  placeholder = "••••••••",
}) {
  const [visivel, setVisivel] = useState(false);
  const idErro = `${id}-erro`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={`text-sm font-semibold tracking-[0.03em] ${erro ? "text-[#ba1a1a]" : "text-[#111c2c]"}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={visivel ? "text" : "password"}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? idErro : undefined}
          className={`h-12 w-full rounded-xl border-2 px-4 pr-12 text-base outline-none transition placeholder:text-[#727785] focus:ring-4 ${erro ? "border-[#ba1a1a] bg-[#ffdad6] text-[#93000a] focus:border-[#ba1a1a] focus:ring-[#ffdad6]" : "border-[#727785] bg-white text-[#111c2c] focus:border-[#004fac] focus:ring-[#d8e2ff]"}`}
        />
        <button
          type="button"
          onClick={() => setVisivel((valorAtual) => !valorAtual)}
          className={`absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 ${erro ? "text-[#ba1a1a] hover:bg-[#ba1a1a]/10 focus-visible:ring-[#ba1a1a]" : "text-[#424753] hover:bg-[#f0f3ff] focus-visible:ring-[#004fac]"}`}
          aria-label={visivel ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visivel}
        >
          <IconeOlho visivel={visivel} />
        </button>
      </div>
      <MensagemErro id={idErro}>{erro}</MensagemErro>
    </div>
  );
}
