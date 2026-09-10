export function MensagemErro({ id, children }) {
  if (!children) return null;

  return (
    <p id={id} className="flex items-center gap-1 text-xs font-medium text-[#ba1a1a]">
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6" />
        <path d="M12 17h.01" />
      </svg>
      {children}
    </p>
  );
}
