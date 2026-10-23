/** Logo do Jornada: símbolo (cor do fundo vem de `color`) e, fora do modo compacto, o nome. */
export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <span className={`logo ${compacto ? "logo-compacto" : ""}`}>
      <svg className="logo-simbolo" viewBox="0 0 40 40" role="img" aria-label="Jornada">
        <rect width="40" height="40" rx="10" fill="currentColor" />
        <path d="M27 9v16.25C27 30.08 23.08 34 18.25 34S9.5 30.08 9.5 25.25" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M18 9h12" fill="none" stroke="#75B8F3" strokeWidth="4" strokeLinecap="round" />
        <circle cx="10" cy="20" r="2.25" fill="#75B8F3" />
      </svg>
      {!compacto && <span className="logo-nome">Jornada</span>}
    </span>
  );
}
