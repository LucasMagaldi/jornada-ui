"use client";

import { useState } from "react";
import { Erros } from "@/components/Erros";
import { useSessao } from "@/components/Shell";
import { api } from "@/lib/api";

export default function Conta() {
  const sessao = useSessao();
  const [erro, setErro] = useState<unknown>(null);
  const [confirmacao, setConfirmacao] = useState("");

  async function sair() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/entrar";
  }

  async function excluir() {
    try {
      await api("/conta", { method: "DELETE" });
      window.location.href = "/cadastro";
    } catch (e) {
      setErro(e);
    }
  }

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Conta</h1>
          <p className="subtitulo">{sessao?.rede.nome} · {sessao?.usuario.email}</p>
        </div>
      </div>
      <Erros erro={erro} />
      <div className="cartao">
        <h2>Sessão</h2>
        <button className="secundario" onClick={sair}>Sair</button>
      </div>
      <div className="cartao" style={{ borderColor: "#f2b8b5" }}>
        <h2 style={{ color: "var(--erro)" }}>Excluir conta e dados</h2>
        <p>
          Apaga definitivamente a rede, usuários, unidades, coberturas, quadros e salários (LGPD: exclusão a pedido). Não pode ser desfeito.
          Exporte o relatório antes, se precisar.
        </p>
        <div className="campo" style={{ maxWidth: 360 }}>
          <label htmlFor="conf">Digite EXCLUIR para confirmar</label>
          <input id="conf" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
        </div>
        <button className="perigo" disabled={confirmacao !== "EXCLUIR"} onClick={excluir}>Excluir tudo</button>
      </div>
    </>
  );
}
