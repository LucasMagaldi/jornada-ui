"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Sessao } from "@/lib/respostas";
import { AVISO_JURIDICO } from "@/lib/textos";

const ContextoSessao = createContext<Sessao | null>(null);
export const useSessao = () => useContext(ContextoSessao);

const LINKS = [
  { href: "/painel", rotulo: "Resultado" },
  { href: "/unidades", rotulo: "Unidades" },
  { href: "/importar", rotulo: "Importar CSV" },
  { href: "/conta", rotulo: "Conta" },
];

/** Moldura das páginas autenticadas: navegação, sessão e aviso jurídico permanente. */
export function Shell({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const [sessao, setSessao] = useState<Sessao | null>(null);

  useEffect(() => {
    api<Sessao>("/auth/eu")
      .then(setSessao)
      .catch(() => (window.location.href = "/entrar"));
  }, []);

  return (
    <ContextoSessao.Provider value={sessao}>
      <header className="topo">
        <div className="topo-interno">
          <Link href="/painel" className="marca">
            Simulador 6x1
          </Link>
          <nav className="nav">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={caminho?.startsWith(l.href) ? "ativo" : ""}>
                {l.rotulo}
              </Link>
            ))}
          </nav>
          {sessao && (
            <span className="usuario">
              {sessao.rede.nome} · {sessao.usuario.email}
            </span>
          )}
        </div>
      </header>
      <main>{sessao ? children : <p className="carregando">Carregando…</p>}</main>
      <footer className="rodape">{AVISO_JURIDICO}</footer>
    </ContextoSessao.Provider>
  );
}
