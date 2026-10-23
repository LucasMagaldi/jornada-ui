"use client";

import Link from "next/link";
import { useState } from "react";
import { Erros } from "@/components/Erros";
import { api } from "@/lib/api";
import { AVISO_JURIDICO } from "@/lib/textos";
import { Logo } from "@/components/Logo";

export function FormAuth({ modo }: { modo: "entrar" | "cadastro" }) {
  const [erro, setErro] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      await api(modo === "entrar" ? "/auth/login" : "/auth/cadastro", {
        method: "POST",
        body: { email: f.get("email"), senha: f.get("senha"), ...(modo === "cadastro" ? { nomeRede: f.get("nomeRede") } : {}) },
      });
      window.location.href = modo === "entrar" ? "/painel" : "/importar";
    } catch (err) {
      setErro(err);
      setEnviando(false);
    }
  }

  return (
    <div className="centro">
      <div className="cartao">
        <div className="login-marca">
          <Logo />
        </div>
        <h2 style={{ marginBottom: 4 }}>{modo === "entrar" ? "Entre na sua conta" : "Crie sua conta"}</h2>
        <p className="subtitulo">Impacto do fim da escala 6x1 em pessoal e custo, com números defensáveis.</p>
        <Erros erro={erro} />
        <form onSubmit={enviar}>
          {modo === "cadastro" && (
            <div className="campo">
              <label htmlFor="nomeRede">Nome da rede / empresa</label>
              <input id="nomeRede" name="nomeRede" required maxLength={120} />
            </div>
          )}
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input id="senha" name="senha" type="password" required minLength={8} autoComplete={modo === "entrar" ? "current-password" : "new-password"} />
            {modo === "cadastro" && <div className="dica">Mínimo de 8 caracteres.</div>}
          </div>
          <button type="submit" disabled={enviando} style={{ width: "100%" }}>
            {enviando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <p style={{ marginTop: 16, marginBottom: 0, fontSize: 13 }}>
          {modo === "entrar" ? (
            <>Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></>
          ) : (
            <>Já tem conta? <Link href="/entrar">Entrar</Link></>
          )}
        </p>
      </div>
      <p className="dica" style={{ fontSize: 11, lineHeight: 1.6 }}>{AVISO_JURIDICO}</p>
    </div>
  );
}
