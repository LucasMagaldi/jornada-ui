"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Erros } from "@/components/Erros";
import { api } from "@/lib/api";
import { formatarNumero } from "@/lib/formato";
import type { ResumoUnidade } from "@/lib/respostas";

export default function Unidades() {
  const [unidades, setUnidades] = useState<ResumoUnidade[] | null>(null);
  const [erro, setErro] = useState<unknown>(null);

  const carregar = () => api<ResumoUnidade[]>("/unidades").then(setUnidades).catch(setErro);
  useEffect(() => {
    carregar();
  }, []);

  async function excluir(u: ResumoUnidade) {
    if (!confirm(`Excluir a unidade "${u.nome}"? Cobertura e quadro dela serão apagados.`)) return;
    try {
      await api(`/unidades/${u.id}`, { method: "DELETE" });
      carregar();
    } catch (e) {
      setErro(e);
    }
  }

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Unidades</h1>
          <p className="subtitulo">Horário de funcionamento, cobertura mínima e quadro atual de cada unidade.</p>
        </div>
        <div className="acoes">
          <Link className="botao secundario" href="/importar">Importar CSV</Link>
          <Link className="botao" href="/unidades/nova">Nova unidade</Link>
        </div>
      </div>
      <Erros erro={erro} />
      {unidades === null ? (
        <p className="carregando">Carregando…</p>
      ) : unidades.length === 0 ? (
        <div className="cartao vazio">Nenhuma unidade ainda. <Link href="/importar">Importe um CSV</Link> ou <Link href="/unidades/nova">cadastre a primeira</Link>.</div>
      ) : (
        <div className="cartao tabela-wrap">
          <table>
            <thead>
              <tr>
                <th>Unidade</th>
                <th>Bandeira</th>
                <th>Regional</th>
                <th>Colaboradores</th>
                <th>Horas abertas/semana</th>
                <th>Horário reduzido</th>
                <th>Semana de pico</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => (
                <tr key={u.id}>
                  <td><Link href={`/unidades/${u.id}`}>{u.nome}</Link></td>
                  <td>{u.bandeira ?? "—"}</td>
                  <td>{u.regional ?? "—"}</td>
                  <td>{u.headcount}</td>
                  <td>{formatarNumero(u.horasAbertasSemana, 1)}</td>
                  <td>{u.temHorarioReduzido ? <span className="selo ok">informado</span> : <span className="selo">não</span>}</td>
                  <td>{u.temPico ? <span className="selo ok">informada</span> : <span className="selo">não</span>}</td>
                  <td><button className="link" onClick={() => excluir(u)}>Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
