"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Erros } from "@/components/Erros";
import { MemoriaCalculo } from "@/components/MemoriaCalculo";
import { PainelPremissas } from "@/components/PainelPremissas";
import { api } from "@/lib/api";
import { formatarBRL, formatarData, formatarNumero, sinal } from "@/lib/formato";
import type { RespostaPremissas, RespostaSimulacao } from "@/lib/respostas";
import { LIMITACOES } from "@/lib/textos";
import type { IdCenario, Premissas } from "@/lib/tipos";
import { NOME_CENARIO } from "@/lib/tipos";

const IDS: IdCenario[] = ["contratar", "horaExtra", "reduzirHorario", "mix"];

export default function Painel() {
  const [sim, setSim] = useState<RespostaSimulacao | null>(null);
  const [premissas, setPremissas] = useState<Premissas | null>(null);
  const [salvas, setSalvas] = useState<Premissas | null>(null);
  const [padrao, setPadrao] = useState<Premissas | null>(null);
  const [data, setData] = useState("");
  const [faseIdx, setFaseIdx] = useState(2);
  const [erro, setErro] = useState<unknown>(null);
  const [calculando, setCalculando] = useState(false);
  const [msg, setMsg] = useState("");
  const pedido = useRef(0);

  useEffect(() => {
    Promise.all([api<RespostaPremissas>("/premissas"), api<RespostaSimulacao>("/simulacao")])
      .then(([p, s]) => {
        setPremissas(p.premissas);
        setSalvas(p.premissas);
        setPadrao(p.padrao);
        setSim(s);
        setData(s.dataReferencia);
        setFaseIdx(s.resultado.versaoRegras.fases.length - 1);
      })
      .catch(setErro);
  }, []);

  // Recalcula a cada alteração de premissa ou data, sem salvar e sem recarregar a página (critério 3).
  const recalcular = useCallback((p: Premissas, d: string) => {
    const n = ++pedido.current;
    setCalculando(true);
    api<RespostaSimulacao>("/simulacao", { method: "POST", body: { premissas: p, data: d || undefined } })
      .then((s) => {
        if (n !== pedido.current) return;
        setSim(s);
        setErro(null);
      })
      .catch((e) => n === pedido.current && setErro(e))
      .finally(() => n === pedido.current && setCalculando(false));
  }, []);

  useEffect(() => {
    if (!premissas || !salvas) return;
    const t = setTimeout(() => recalcular(premissas, data), 250);
    return () => clearTimeout(t);
  }, [premissas, data, recalcular, salvas]);

  const alterado = JSON.stringify(premissas) !== JSON.stringify(salvas);

  async function salvar() {
    if (!premissas) return;
    try {
      const r = await api<{ premissas: Premissas }>("/premissas", { method: "PUT", body: premissas });
      setSalvas(r.premissas);
      setPremissas(r.premissas);
      setMsg("Premissas salvas.");
      setTimeout(() => setMsg(""), 2500);
    } catch (e) {
      setErro(e);
    }
  }

  if (!sim || !premissas) return erro ? <Erros erro={erro} /> : <p className="carregando">Calculando…</p>;

  const r = sim.resultado;
  const fases = r.consolidado;
  const c = fases[Math.min(faseIdx, fases.length - 1)];
  const melhor = c.maisBarato;
  const maxCusto = Math.max(1, ...IDS.map((id) => c.custos[id]));
  const query = data ? `?data=${data}` : "";

  if (r.unidades.length === 0) {
    return (
      <div className="cartao">
        <h1>Nenhuma unidade cadastrada</h1>
        <p className="subtitulo">Comece importando suas unidades por CSV ou cadastrando uma a uma.</p>
        <div className="linha">
          <Link className="botao" href="/importar">Importar CSV</Link>
          <Link className="botao secundario" href="/unidades">Cadastrar unidade</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="linha" style={{ marginBottom: 16, alignItems: "flex-end" }}>
        <div>
          <h1>Resultado da rede</h1>
          <p className="subtitulo" style={{ margin: 0 }}>
            {r.unidades.length} unidade(s) · {r.headcountAtual} colaboradores · regras {r.versaoRegras.id}
            {calculando && " · recalculando…"}
          </p>
        </div>
        <div className="espaco" />
        <div>
          <label htmlFor="data">Data de referência</label>
          <input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ width: 160 }} />
        </div>
        <a className={`botao secundario${alterado ? " desativado" : ""}`} href={alterado ? undefined : `/api/relatorio.pdf${query}`} aria-disabled={alterado} title={alterado ? "Salve as premissas para exportar" : ""}>
          Exportar PDF
        </a>
        <a className={`botao secundario${alterado ? " desativado" : ""}`} href={alterado ? undefined : `/api/relatorio.csv${query}`} aria-disabled={alterado} title={alterado ? "Salve as premissas para exportar" : ""}>
          Exportar CSV
        </a>
      </div>
      {alterado && <div className="alerta">Premissas alteradas e ainda não salvas. Os números abaixo já usam os novos valores; salve para exportar.</div>}
      <Erros erro={erro} />

      <div className="layout-painel">
        <div style={{ minWidth: 0 }}>
          <div className="abas">
            {fases.map((f, i) => (
              <button key={f.fase.id} className={i === faseIdx ? "ativa" : ""} onClick={() => setFaseIdx(i)}>
                {f.fase.nome}
                {f.fase.inicio && <span className="dica"> · {formatarData(f.fase.inicio)}</span>}
              </button>
            ))}
          </div>

          <div className="grade grade-4" style={{ marginBottom: 20 }}>
            <div className="kpi">
              <div className="rotulo">FTE necessário</div>
              <div className="valor">{formatarNumero(c.fteNecessario, 1)}</div>
              <div className="nota">{formatarNumero(c.horasCoberturaSemana, 0)} h de cobertura/semana</div>
            </div>
            <div className="kpi">
              <div className="rotulo">FTE atual equivalente</div>
              <div className="valor">{formatarNumero(c.fteAtualEquivalente, 1)}</div>
              <div className="nota">jornada de {c.fase.jornadaSemanal} h</div>
            </div>
            <div className="kpi">
              <div className="rotulo">Pessoas a mais</div>
              <div className="valor">{formatarNumero(c.deltaFte, 1)}</div>
              <div className="nota">soma dos déficits por unidade</div>
            </div>
            <div className="kpi">
              <div className="rotulo">Custo mensal (melhor por unidade)</div>
              <div className="valor">{formatarBRL(c.custoMelhorPorUnidade)}</div>
              <div className="nota">cada unidade no seu cenário mais barato</div>
            </div>
          </div>

          <div className="cartao">
            <h2>Comparação de cenários — {c.fase.nome}</h2>
            {IDS.map((id) => (
              <div key={id} style={{ marginBottom: 12 }}>
                <div className="linha" style={{ justifyContent: "space-between" }}>
                  <span>
                    <strong>{NOME_CENARIO[id]}</strong>{" "}
                    {id === melhor && <span className="selo ok">mais barato</span>}{" "}
                    {c.unidadesAcimaDoLimite[id] > 0 && <span className="selo alerta">{c.unidadesAcimaDoLimite[id]} unid. acima do limite de HE</span>}{" "}
                    {c.unidadesSemCenario[id] > 0 && <span className="selo">{c.unidadesSemCenario[id]} unid. usando “contratar”</span>}
                  </span>
                  <strong>{formatarBRL(c.custos[id])}/mês</strong>
                </div>
                <div className="barra">
                  <div className={id === melhor ? "melhor" : ""} style={{ width: `${(c.custos[id] / maxCusto) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="dica">
              Custos mensais adicionais ao quadro atual. Unidades sem o cenário (ex.: sem horário reduzido informado) entram com o custo de contratar.
              Cenários que excedem o limite legal de hora extra não são indicados como mais baratos.
            </p>
          </div>

          <div className="cartao">
            <h2>Três fotografias</h2>
            <div className="tabela-wrap">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    {fases.map((f) => (
                      <th key={f.fase.id}>{f.fase.nome}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>FTE necessário</td>
                    {fases.map((f) => <td key={f.fase.id}>{formatarNumero(f.fteNecessario)}</td>)}
                  </tr>
                  <tr>
                    <td>FTE atual equivalente</td>
                    {fases.map((f) => <td key={f.fase.id}>{formatarNumero(f.fteAtualEquivalente)}</td>)}
                  </tr>
                  <tr>
                    <td>Déficit de FTE</td>
                    {fases.map((f) => <td key={f.fase.id}>{formatarNumero(f.deltaFte)}</td>)}
                  </tr>
                  {IDS.map((id) => (
                    <tr key={id}>
                      <td>{NOME_CENARIO[id]}</td>
                      {fases.map((f) => (
                        <td key={f.fase.id} className={f.maisBarato === id ? "melhor" : ""}>
                          {formatarBRL(f.custos[id])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="cartao">
            <h2>Por unidade — {c.fase.nome}</h2>
            <div className="tabela-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Unidade</th>
                    <th>FTE nec.</th>
                    <th>FTE atual</th>
                    <th>Delta</th>
                    {IDS.map((id) => <th key={id}>{NOME_CENARIO[id]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {r.unidades.map((u) => {
                    const f = u.fases[faseIdx];
                    return (
                      <Fragment key={u.unidadeId}>
                        <tr>
                          <td>
                            <Link href={`/unidades/${u.unidadeId}`}>{u.nome}</Link>
                            {u.avisos.length > 0 && <span className="selo alerta" title={u.avisos.join("\n")} style={{ marginLeft: 6 }}>{u.avisos.length} aviso(s)</span>}
                          </td>
                          <td>{formatarNumero(f.fteNecessario)}</td>
                          <td>{formatarNumero(f.fteAtualEquivalente)}</td>
                          <td>{sinal(f.deltaFte)}</td>
                          {IDS.map((id) => {
                            const cen = f.cenarios[id];
                            return (
                              <td key={id} className={!cen.disponivel ? "na" : f.maisBarato === id ? "melhor" : ""}>
                                {cen.disponivel ? formatarBRL(cen.custoMensal) : "n/d"}
                                {cen.detalhes.excedeLimiteLegal === true && " ⚠"}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td colSpan={8} style={{ whiteSpace: "normal", borderBottomWidth: 2 }}>
                            <details>
                              <summary>Memória de cálculo</summary>
                              <MemoriaCalculo f={f} p={r.premissas} />
                              {u.avisos.map((a, i) => (
                                <div key={i} className="dica" style={{ color: "var(--alerta)" }}>⚠ {a}</div>
                              ))}
                            </details>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="cartao">
            <h2>Premissas utilizadas</h2>
            <div className="tabela-wrap">
              <table>
                <tbody>
                  {sim.premissasDescritas.map(([k, v]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td style={{ whiteSpace: "normal" }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(r.versaoRegras.observacoes ?? []).length > 0 && (
              <ul className="dica">
                {r.versaoRegras.observacoes!.map((o) => <li key={o}>{o}</li>)}
              </ul>
            )}
          </div>
          <div className="aviso"><strong>Limitações.</strong> {LIMITACOES}</div>
        </div>

        <aside className="cartao lateral">
          <h2>Premissas</h2>
          <PainelPremissas premissas={premissas} versao={r.versaoRegras} onChange={setPremissas} />
          <div className="linha">
            <button onClick={salvar} disabled={!alterado}>Salvar</button>
            <button className="secundario" onClick={() => salvas && setPremissas(salvas)} disabled={!alterado}>Desfazer</button>
            {padrao && <button className="link" onClick={() => setPremissas(padrao)}>Padrão</button>}
          </div>
          {msg && <div className="sucesso" style={{ marginTop: 12 }}>{msg}</div>}
        </aside>
      </div>
    </>
  );
}
