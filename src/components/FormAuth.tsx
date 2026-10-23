"use client";

import Link from "next/link";
import { useState } from "react";
import { Erros } from "@/components/Erros";
import { api } from "@/lib/api";
import { AVISO_JURIDICO } from "@/lib/textos";

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
        <h1>{modo === "entrar" ? "Entrar" : "Criar conta"}</h1>
        <p className="subtitulo">Simulador de impacto do fim da escala 6x1</p>
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
        <p style={{ marginTop: 16, fontSize: "0.9rem" }}>
          {modo === "entrar" ? (
            <>Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></>
          ) : (
            <>Já tem conta? <Link href="/entrar">Entrar</Link></>
          )}
        </p>
      </div>
      <p className="dica">{AVISO_JURIDICO}</p>
    </div>
  );
}
