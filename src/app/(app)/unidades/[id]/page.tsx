"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Erros } from "@/components/Erros";
import { MemoriaCalculo } from "@/components/MemoriaCalculo";
import { api } from "@/lib/api";
import { coberturaUniforme, coberturaVazia, horarioPadrao, horasCoberturaDia, replicarDia } from "@/lib/cobertura-ui";
import { formatarBRL, formatarNumero } from "@/lib/formato";
import type { ResumoUnidade, RespostaSimulacao, UnidadeCompleta } from "@/lib/respostas";
import type { Cargo, CoberturaSemanal, DiaSemana, HorarioSemanal } from "@/lib/tipos";
import { DIAS_SEMANA, NOME_CENARIO, NOME_DIA } from "@/lib/tipos";

type Aba = "cobertura" | "quadro" | "reduzido" | "resultado";

function nova(): UnidadeCompleta {
  const horarios = horarioPadrao();
  return { id: "", nome: "", horarios, horarioReduzido: null, cobertura: coberturaUniforme(horarios, 2), quadro: [] };
}

export default function EditorUnidade() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ehNova = id === "nova";
  const [u, setU] = useState<UnidadeCompleta | null>(ehNova ? nova() : null);
  const [aba, setAba] = useState<Aba>("cobertura");
  const [outras, setOutras] = useState<ResumoUnidade[]>([]);
  const [erro, setErro] = useState<unknown>(null);
  const [msg, setMsg] = useState("");
  const [sim, setSim] = useState<RespostaSimulacao | null>(null);
  const [pessoasUniforme, setPessoasUniforme] = useState(2);

  useEffect(() => {
    if (!ehNova) api<UnidadeCompleta>(`/unidades/${id}`).then(setU).catch(setErro);
    api<ResumoUnidade[]>("/unidades").then((l) => setOutras(l.filter((x) => x.id !== id))).catch(() => {});
  }, [id, ehNova]);

  useEffect(() => {
    if (aba === "resultado" && !ehNova) api<RespostaSimulacao>("/simulacao").then(setSim).catch(setErro);
  }, [aba, ehNova]);

  if (!u) return erro ? <Erros erro={erro} /> : <p className="carregando">Carregando…</p>;

  const set = (parcial: Partial<UnidadeCompleta>) => setU({ ...u, ...parcial });
  const setDia = (d: DiaSemana, aberto: boolean) => {
    const horarios = { ...u.horarios, [d]: aberto ? { abre: "08:00", fecha: "20:00" } : null };
    set({ horarios, cobertura: { ...u.cobertura, [d]: aberto ? [{ inicio: "08:00", fim: "20:00", pessoas: 1 }] : [] } });
  };
  const setFaixas = (d: DiaSemana, faixas: CoberturaSemanal[DiaSemana]) => set({ cobertura: { ...u.cobertura, [d]: faixas } });
  const totalCobertura = DIAS_SEMANA.reduce((s, d) => s + horasCoberturaDia(u.horarios, u.cobertura, d), 0);

  async function duplicarDe(origemId: string) {
    if (!origemId) return;
    const o = await api<UnidadeCompleta>(`/unidades/${origemId}`);
    if (confirm(`Substituir horário e cobertura desta unidade pelos de "${o.nome}"?`)) set({ horarios: o.horarios, cobertura: o.cobertura });
  }

  async function salvar() {
    setErro(null);
    try {
      const corpo = { nome: u!.nome, horarios: u!.horarios, horarioReduzido: u!.horarioReduzido, cobertura: u!.cobertura, quadro: u!.quadro };
      if (ehNova) {
        const criada = await api<UnidadeCompleta>("/unidades", { method: "POST", body: corpo });
        router.replace(`/unidades/${criada.id}`);
      } else {
        setU(await api<UnidadeCompleta>(`/unidades/${id}`, { method: "PUT", body: corpo }));
        setSim(null);
        if (aba === "resultado") api<RespostaSimulacao>("/simulacao").then(setSim);
        setMsg("Unidade salva.");
        setTimeout(() => setMsg(""), 2500);
      }
    } catch (e) {
      setErro(e);
    }
  }

  const resultado = sim?.resultado.unidades.find((x) => x.unidadeId === id);

  return (
    <>
      <p><Link href="/unidades">← Unidades</Link></p>
      <div className="linha" style={{ marginBottom: 16, alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <label htmlFor="nome">Nome da unidade</label>
          <input id="nome" value={u.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex.: Loja Centro" style={{ fontSize: "1.2rem", fontWeight: 600 }} />
        </div>
        <button onClick={salvar}>{ehNova ? "Criar unidade" : "Salvar alterações"}</button>
      </div>
      <Erros erro={erro} />
      {msg && <div className="sucesso">{msg}</div>}

      <div className="abas">
        {(
          [
            ["cobertura", "Horário e cobertura"],
            ["quadro", `Quadro atual (${u.quadro.reduce((s, c) => s + c.quantidade, 0)})`],
            ["reduzido", "Horário reduzido (cenário)"],
            ...(ehNova ? [] : [["resultado", "Resultado"]]),
          ] as [Aba, string][]
        ).map(([k, r]) => (
          <button key={k} className={aba === k ? "ativa" : ""} onClick={() => setAba(k)}>{r}</button>
        ))}
      </div>

      {aba === "cobertura" && (
        <div className="cartao">
          <div className="linha" style={{ marginBottom: 16 }}>
            <span>Atalhos:</span>
            <span className="linha" style={{ gap: 6 }}>
              <input className="curto" type="number" min={0} value={pessoasUniforme} onChange={(e) => setPessoasUniforme(Number(e.target.value))} aria-label="Pessoas" />
              <button className="secundario" onClick={() => set({ cobertura: coberturaUniforme(u.horarios, pessoasUniforme) })}>
                Mesma cobertura todos os dias
              </button>
            </span>
            {outras.length > 0 && (
              <select style={{ width: "auto" }} value="" onChange={(e) => duplicarDe(e.target.value).catch(setErro)}>
                <option value="">Duplicar de outra unidade…</option>
                {outras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            )}
            <div className="espaco" />
            <strong>{formatarNumero(totalCobertura, 1)} h de cobertura/semana</strong>
          </div>
          {DIAS_SEMANA.map((d) => (
            <Dia
              key={d}
              dia={d}
              horarios={u.horarios}
              faixas={u.cobertura[d]}
              onAberto={(v) => setDia(d, v)}
              onJanela={(j) => set({ horarios: { ...u.horarios, [d]: j } })}
              onFaixas={(f) => setFaixas(d, f)}
              onReplicar={() => {
                const [h, c] = replicarDia(u.horarios, u.cobertura, d);
                set({ horarios: h, cobertura: c });
              }}
            />
          ))}
          <p className="dica">
            Faixas fora do horário de funcionamento são desconsideradas. Horários vão de 00:00 a 24:00; operações que viram a noite usam duas faixas.
          </p>
        </div>
      )}

      {aba === "quadro" && <Quadro quadro={u.quadro} onChange={(quadro) => set({ quadro })} />}

      {aba === "reduzido" && (
        <div className="cartao">
          <p>
            Informe um horário de funcionamento menor para avaliar o cenário <strong>reduzir horário</strong>. A cobertura mínima de cada faixa é mantida,
            só a parte fora do novo horário deixa de contar.
          </p>
          {u.horarioReduzido === null ? (
            <button onClick={() => set({ horarioReduzido: JSON.parse(JSON.stringify(u.horarios)) as HorarioSemanal })}>Informar horário reduzido</button>
          ) : (
            <>
              {DIAS_SEMANA.map((d) => {
                const j = u.horarioReduzido![d];
                return (
                  <div key={d} className="dia-cab">
                    <strong>{NOME_DIA[d]}</strong>
                    <label style={{ display: "flex", gap: 6, margin: 0 }}>
                      <input type="checkbox" checked={!!j} onChange={(e) => set({ horarioReduzido: { ...u.horarioReduzido!, [d]: e.target.checked ? u.horarios[d] ?? { abre: "08:00", fecha: "20:00" } : null } })} />
                      aberto
                    </label>
                    {j && (
                      <>
                        <input type="time" value={j.abre} onChange={(e) => set({ horarioReduzido: { ...u.horarioReduzido!, [d]: { ...j, abre: e.target.value } } })} />
                        até
                        <input type="time" value={j.fecha === "24:00" ? "23:59" : j.fecha} onChange={(e) => set({ horarioReduzido: { ...u.horarioReduzido!, [d]: { ...j, fecha: e.target.value } } })} />
                      </>
                    )}
                    <span className="dica">
                      atual: {u.horarios[d] ? `${u.horarios[d]!.abre}–${u.horarios[d]!.fecha}` : "fechado"}
                    </span>
                  </div>
                );
              })}
              <button className="secundario" onClick={() => set({ horarioReduzido: null })} style={{ marginTop: 12 }}>Remover horário reduzido</button>
            </>
          )}
        </div>
      )}

      {aba === "resultado" && (
        <div className="cartao">
          {!resultado ? (
            <p className="carregando">Calculando…</p>
          ) : (
            <>
              <p className="dica">Resultado com as premissas salvas da rede. Salve a unidade para atualizar.</p>
              {resultado.avisos.map((a, i) => <div key={i} className="alerta">{a}</div>)}
              <div className="tabela-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fase</th><th>Cobertura (h)</th><th>FTE nec.</th><th>FTE atual</th><th>Delta</th><th>Valor-hora</th>
                      {Object.values(NOME_CENARIO).map((n) => <th key={n}>{n}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.fases.map((f) => (
                      <tr key={f.fase.id}>
                        <td>{f.fase.nome}</td>
                        <td>{formatarNumero(f.horasCoberturaSemana, 1)}</td>
                        <td>{formatarNumero(f.fteNecessario)}</td>
                        <td>{formatarNumero(f.fteAtualEquivalente)}</td>
                        <td>{formatarNumero(f.deltaFte)}</td>
                        <td>{formatarBRL(f.valorHora)}</td>
                        {Object.values(f.cenarios).map((c) => (
                          <td key={c.id} className={!c.disponivel ? "na" : f.maisBarato === c.id ? "melhor" : ""}>
                            {c.disponivel ? formatarBRL(c.custoMensal) : "n/d"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {resultado.fases.map((f) => (
                <details key={f.fase.id}>
                  <summary>Memória de cálculo — {f.fase.nome}</summary>
                  <MemoriaCalculo f={f} p={sim!.resultado.premissas} />
                </details>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}

function Dia(props: {
  dia: DiaSemana;
  horarios: HorarioSemanal;
  faixas: CoberturaSemanal[DiaSemana];
  onAberto: (v: boolean) => void;
  onJanela: (j: { abre: string; fecha: string }) => void;
  onFaixas: (f: CoberturaSemanal[DiaSemana]) => void;
  onReplicar: () => void;
}) {
  const { dia, horarios, faixas } = props;
  const j = horarios[dia];
  const cob = coberturaVazia();
  cob[dia] = faixas;
  const horas = horasCoberturaDia(horarios, cob, dia);
  const atualizar = (i: number, campo: "inicio" | "fim" | "pessoas", v: string) =>
    props.onFaixas(faixas.map((f, k) => (k === i ? { ...f, [campo]: campo === "pessoas" ? Number(v) : v } : f)));

  return (
    <div className="dia">
      <div className="dia-cab">
        <strong>{NOME_DIA[dia]}</strong>
        <label style={{ display: "flex", gap: 6, margin: 0 }}>
          <input type="checkbox" checked={!!j} onChange={(e) => props.onAberto(e.target.checked)} /> aberto
        </label>
        {j && (
          <>
            <input type="time" value={j.abre} onChange={(e) => props.onJanela({ ...j, abre: e.target.value })} aria-label="Abre" />
            até
            <input type="time" value={j.fecha === "24:00" ? "23:59" : j.fecha} onChange={(e) => props.onJanela({ ...j, fecha: e.target.value })} aria-label="Fecha" />
            <span className="dica">{formatarNumero(horas, 1)} h×pessoa</span>
            <div className="espaco" />
            <button className="link" onClick={props.onReplicar}>Copiar este dia para todos</button>
          </>
        )}
      </div>
      {j &&
        faixas.map((f, i) => (
          <div key={i} className="faixa">
            <span className="dica">Faixa</span>
            <input type="time" value={f.inicio} onChange={(e) => atualizar(i, "inicio", e.target.value)} aria-label="Início" />
            até
            <input type="time" value={f.fim === "24:00" ? "23:59" : f.fim} onChange={(e) => atualizar(i, "fim", e.target.value)} aria-label="Fim" />
            <input className="curto" type="number" min={0} value={f.pessoas} onChange={(e) => atualizar(i, "pessoas", e.target.value)} aria-label="Pessoas" />
            <span className="dica">pessoas</span>
            <button className="link" onClick={() => props.onFaixas(faixas.filter((_, k) => k !== i))}>remover</button>
          </div>
        ))}
      {j && (
        <button
          className="link"
          onClick={() => {
            const ultimo = faixas[faixas.length - 1];
            props.onFaixas([...faixas, { inicio: ultimo?.fim ?? j.abre, fim: j.fecha, pessoas: ultimo?.pessoas ?? 1 }]);
          }}
        >
          + adicionar faixa
        </button>
      )}
    </div>
  );
}

function Quadro({ quadro, onChange }: { quadro: Cargo[]; onChange: (q: Cargo[]) => void }) {
  const atualizar = (i: number, campo: keyof Cargo, v: string) =>
    onChange(quadro.map((c, k) => (k === i ? { ...c, [campo]: campo === "nome" ? v : Number(v) } : c)));
  return (
    <div className="cartao">
      <div className="tabela-wrap">
        <table>
          <thead>
            <tr><th>Cargo</th><th>Quantidade</th><th>Salário-base (R$)</th><th>Jornada atual (h/sem)</th><th></th></tr>
          </thead>
          <tbody>
            {quadro.map((c, i) => (
              <tr key={i}>
                <td><input value={c.nome} onChange={(e) => atualizar(i, "nome", e.target.value)} /></td>
                <td><input className="curto" type="number" min={0} value={c.quantidade} onChange={(e) => atualizar(i, "quantidade", e.target.value)} /></td>
                <td><input type="number" min={0} step="0.01" value={c.salarioBase} onChange={(e) => atualizar(i, "salarioBase", e.target.value)} style={{ width: 130 }} /></td>
                <td><input className="curto" type="number" min={1} max={44} value={c.jornadaSemanal} onChange={(e) => atualizar(i, "jornadaSemanal", e.target.value)} /></td>
                <td><button className="link" onClick={() => onChange(quadro.filter((_, k) => k !== i))}>remover</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="secundario" style={{ marginTop: 12 }} onClick={() => onChange([...quadro, { nome: "", quantidade: 1, salarioBase: 2000, jornadaSemanal: 44 }])}>
        + adicionar cargo
      </button>
      <p className="dica" style={{ marginTop: 8 }}>
        Todo o quadro conta para a cobertura mínima (sem distinção de cargo). Salários são dados sensíveis: ficam apenas no banco da sua rede e não são registrados em logs.
      </p>
    </div>
  );
}
