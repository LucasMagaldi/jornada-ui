"use client";

import Link from "next/link";
import { useState } from "react";
import { Erros } from "@/components/Erros";
import { api } from "@/lib/api";

interface Resumo {
  unidadesNovas: string[];
  unidadesAtualizadas: string[];
  linhasQuadro: number;
}

async function lerArquivo(f: File | null): Promise<string | undefined> {
  if (!f) return undefined;
  const buf = await f.arrayBuffer();
  // CSV salvo pelo Excel em português costuma vir em Windows-1252; tenta UTF-8 primeiro.
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  return utf8.includes("�") ? new TextDecoder("windows-1252").decode(buf) : utf8;
}

export default function Importar() {
  const [cobertura, setCobertura] = useState<File | null>(null);
  const [quadro, setQuadro] = useState<File | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [previa, setPrevia] = useState<Resumo | null>(null);
  const [feito, setFeito] = useState<Resumo | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(simular: boolean) {
    setErro(null);
    setEnviando(true);
    try {
      const corpo = { cobertura: await lerArquivo(cobertura), quadro: await lerArquivo(quadro), simular };
      const r = await api<{ resumo: Resumo }>("/importacao", { method: "POST", body: corpo });
      if (simular) setPrevia(r.resumo);
      else {
        setFeito(r.resumo);
        setPrevia(null);
      }
    } catch (e) {
      setErro(e);
      setPrevia(null);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Importar CSV</h1>
          <p className="subtitulo">Cadastre várias unidades de uma vez. A importação é tudo-ou-nada: se houver erro, nada é gravado.</p>
        </div>
      </div>

      <div className="grade grade-2">
        <div className="cartao">
          <h2>1. Cobertura mínima</h2>
          <p>
            Uma linha por faixa horária: <code>unidade;dia;inicio;fim;pessoas</code>. Em <code>dia</code> use <code>seg</code>…<code>dom</code>,{" "}
            <code>todos</code>, <code>uteis</code> (seg–sex) ou <code>fds</code>. O horário de funcionamento de cada dia é deduzido das faixas.
          </p>
          <p><a href="/api/modelos/cobertura.csv">Baixar modelo de cobertura</a></p>
          <input type="file" accept=".csv,text/csv" onChange={(e) => { setCobertura(e.target.files?.[0] ?? null); setPrevia(null); }} />
        </div>
        <div className="cartao">
          <h2>2. Quadro atual</h2>
          <p>
            Uma linha por cargo: <code>unidade;cargo;quantidade;salario;jornada</code>. Salário mensal (aceita <code>2.500,00</code>), jornada semanal em horas.
            Reimportar uma unidade substitui o quadro dela.
          </p>
          <p><a href="/api/modelos/quadro.csv">Baixar modelo de quadro</a></p>
          <input type="file" accept=".csv,text/csv" onChange={(e) => { setQuadro(e.target.files?.[0] ?? null); setPrevia(null); }} />
        </div>
      </div>

      <Erros erro={erro} />
      {previa && (
        <div className="aviso">
          <strong>Arquivos válidos.</strong> Unidades novas: {previa.unidadesNovas.join(", ") || "nenhuma"}. Atualizadas:{" "}
          {previa.unidadesAtualizadas.join(", ") || "nenhuma"}. Linhas de quadro: {previa.linhasQuadro}.
        </div>
      )}
      {feito && (
        <div className="sucesso">
          Importação concluída: {feito.unidadesNovas.length} unidade(s) nova(s), {feito.unidadesAtualizadas.length} atualizada(s).{" "}
          <Link href="/painel">Ver resultado →</Link>
        </div>
      )}
      <div className="linha">
        <button className="secundario" disabled={enviando || (!cobertura && !quadro)} onClick={() => enviar(true)}>Validar</button>
        <button disabled={enviando || (!cobertura && !quadro)} onClick={() => enviar(false)}>Importar</button>
      </div>
      <p className="dica" style={{ marginTop: 16 }}>
        Depois de importar, ajuste premissas (perdas, encargos, adicional de hora extra, divisores) no painel de resultado e informe horários reduzidos
        na página de cada unidade.
      </p>
    </>
  );
}
