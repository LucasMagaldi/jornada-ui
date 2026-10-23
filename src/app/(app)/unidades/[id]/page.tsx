"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Erros } from "@/components/Erros";
import { MemoriaCalculo } from "@/components/MemoriaCalculo";
import { api } from "@/lib/api";
import { coberturaUniforme, coberturaVazia, horarioPadrao, horasCoberturaDia, replicarDia, setoresUsados, viraODia } from "@/lib/cobertura-ui";
import { formatarBRL, formatarNumero } from "@/lib/formato";
import type { ResumoUnidade, RespostaSimulacao, UnidadeCompleta } from "@/lib/respostas";
import type { Cargo, CoberturaSemanal, DiaSemana, HorarioSemanal, ResultadoFase } from "@/lib/tipos";
import { DIAS_SEMANA, NOME_CENARIO, NOME_DIA } from "@/lib/tipos";

type Aba = "cobertura" | "quadro" | "pico" | "reduzido" | "resultado";

const copia = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function nova(): UnidadeCompleta {
  const horarios = horarioPadrao();
  return { id: "", nome: "", bandeira: null, regional: null, horarios, horarioReduzido: null, cobertura: coberturaUniforme(horarios, 2), pico: null, quadro: [] };
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
  const setores = setoresUsados([u.cobertura, ...(u.pico ? [u.pico.cobertura] : [])], u.quadro);
  const unicos = (lista: (string | null)[]) => [...new Set(lista.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  async function duplicarDe(origemId: string) {
    if (!origemId) return;
    const o = await api<UnidadeCompleta>(`/unidades/${origemId}`);
    if (confirm(`Substituir horário e cobertura desta unidade pelos de "${o.nome}"?`)) set({ horarios: o.horarios, cobertura: o.cobertura });
  }

  async function salvar() {
    setErro(null);
    try {
      const corpo = {
        nome: u!.nome,
        bandeira: u!.bandeira?.trim() || null,
        regional: u!.regional?.trim() || null,
        horarios: u!.horarios,
        horarioReduzido: u!.horarioReduzido,
        cobertura: u!.cobertura,
        pico: u!.pico,
        quadro: u!.quadro,
      };
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
  const linhasResultado: [ResultadoFase, string][] = resultado
    ? [...resultado.fases.map((f): [ResultadoFase, string] => [f, f.fase.nome]), ...(resultado.fasesPico ?? []).map((f): [ResultadoFase, string] => [f, `${f.fase.nome} · pico`])]
    : [];

  return (
    <>
      <p><Link href="/unidades">← Unidades</Link></p>
      <div className="linha" style={{ marginBottom: 16, alignItems: "flex-end" }}>
        <div style={{ flex: 2, minWidth: 220 }}>
          <label htmlFor="nome">Nome da unidade</label>
          <input id="nome" value={u.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex.: Loja Centro" style={{ fontSize: "1.2rem", fontWeight: 600 }} />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label htmlFor="bandeira">Bandeira</label>
          <input id="bandeira" list="lista-bandeiras" value={u.bandeira ?? ""} onChange={(e) => set({ bandeira: e.target.value })} placeholder="opcional" />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label htmlFor="regional">Regional</label>
          <input id="regional" list="lista-regionais" value={u.regional ?? ""} onChange={(e) => set({ regional: e.target.value })} placeholder="opcional" />
        </div>
        <button onClick={salvar}>{ehNova ? "Criar unidade" : "Salvar alterações"}</button>
      </div>
      <datalist id="lista-bandeiras">{unicos(outras.map((o) => o.bandeira)).map((b) => <option key={b} value={b} />)}</datalist>
      <datalist id="lista-regionais">{unicos(outras.map((o) => o.regional)).map((r) => <option key={r} value={r} />)}</datalist>
      <datalist id="lista-setores">{setores.map((s) => <option key={s} value={s} />)}</datalist>
      <Erros erro={erro} />
      {msg && <div className="sucesso">{msg}</div>}

      <div className="abas">
        {(
          [
            ["cobertura", "Horário e cobertura"],
            ["quadro", `Quadro atual (${u.quadro.reduce((s, c) => s + c.quantidade, 0)})`],
            ["pico", u.pico ? `Semana de pico (${u.pico.descricao?.trim() || "informada"})` : "Semana de pico"],
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
          </div>
          <EditorSemana horarios={u.horarios} cobertura={u.cobertura} onChange={(horarios, cobertura) => set({ horarios, cobertura })} />
        </div>
      )}

      {aba === "quadro" && <Quadro quadro={u.quadro} onChange={(quadro) => set({ quadro })} />}

      {aba === "pico" && (
        <div className="cartao">
          <p>
            Informe uma semana de pico (Natal, Páscoa, feriados) com horário e cobertura próprios. O resultado mostra se o <strong>quadro atual</strong>{" "}
            aguenta essa semana e onde a hora extra passa do limite legal. Os custos são mensais, como se o pico durasse o mês inteiro.
          </p>
          {u.pico === null ? (
            <button onClick={() => set({ pico: { descricao: "Natal", horarios: copia(u.horarios), cobertura: copia(u.cobertura) } })}>
              Informar semana de pico (a partir da semana típica)
            </button>
          ) : (
            <>
              <div className="linha" style={{ marginBottom: 16, alignItems: "flex-end" }}>
                <div style={{ minWidth: 200 }}>
                  <label htmlFor="pico-descricao">Descrição</label>
                  <input id="pico-descricao" value={u.pico.descricao ?? ""} onChange={(e) => set({ pico: { ...u.pico!, descricao: e.target.value } })} placeholder="Ex.: Natal" />
                </div>
                <button className="secundario" onClick={() => confirm("Substituir o pico pela semana típica?") && set({ pico: { ...u.pico!, horarios: copia(u.horarios), cobertura: copia(u.cobertura) } })}>
                  Copiar da semana típica
                </button>
                <button className="link" onClick={() => set({ pico: null })}>Remover semana de pico</button>
              </div>
              <EditorSemana horarios={u.pico.horarios} cobertura={u.pico.cobertura} onChange={(horarios, cobertura) => set({ pico: { ...u.pico!, horarios, cobertura } })} />
            </>
          )}
        </div>
      )}

      {aba === "reduzido" && (
        <div className="cartao">
          <p>
            Informe um horário de funcionamento menor para avaliar o cenário <strong>reduzir horário</strong>. A cobertura mínima de cada faixa é mantida,
            só a parte fora do novo horário deixa de contar.
          </p>
          {u.horarioReduzido === null ? (
            <button onClick={() => set({ horarioReduzido: copia(u.horarios) })}>Informar horário reduzido</button>
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
                        {viraODia(j.abre, j.fecha) && <span className="selo">dia seguinte</span>}
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
                      <th>Fase</th><th>Cobertura (h)</th><th>FTE nec.</th><th>FTE atual</th><th>Delta</th><th>Déficit</th><th>Valor-hora</th>
                      {Object.values(NOME_CENARIO).map((n) => <th key={n}>{n}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {linhasResultado.map(([f, nome]) => (
                      <tr key={nome}>
                        <td>{nome}</td>
                        <td>{formatarNumero(f.horasCoberturaSemana, 1)}</td>
                        <td>{formatarNumero(f.fteNecessario)}</td>
                        <td>{formatarNumero(f.fteAtualEquivalente)}</td>
                        <td>{formatarNumero(f.deltaFte)}</td>
                        <td>{formatarNumero(f.deficitFte)}</td>
                        <td>{formatarBRL(f.valorHora)}</td>
                        {Object.values(f.cenarios).map((c) => (
                          <td key={c.id} className={!c.disponivel ? "na" : f.maisBarato === c.id ? "melhor" : ""}>
                            {c.disponivel ? formatarBRL(c.custoMensal) : "n/d"}
                            {c.detalhes.excedeLimiteLegal === true && " ⚠"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="dica">Delta é o saldo da unidade inteira; déficit soma só as faltas de cada setor e é o que gera custo.</p>
              {linhasResultado.map(([f, nome]) => (
                <details key={nome}>
                  <summary>Memória de cálculo — {nome}</summary>
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

/** Horário e faixas de cobertura de uma semana (típica ou de pico). */
function EditorSemana({ horarios, cobertura, onChange }: { horarios: HorarioSemanal; cobertura: CoberturaSemanal; onChange: (h: HorarioSemanal, c: CoberturaSemanal) => void }) {
  const total = DIAS_SEMANA.reduce((s, d) => s + horasCoberturaDia(horarios, cobertura, d), 0);
  const setDia = (d: DiaSemana, aberto: boolean) =>
    onChange({ ...horarios, [d]: aberto ? { abre: "08:00", fecha: "20:00" } : null }, { ...cobertura, [d]: aberto ? [{ inicio: "08:00", fim: "20:00", pessoas: 1 }] : [] });
  return (
    <>
      <p style={{ textAlign: "right" }}><strong>{formatarNumero(total, 1)} h de cobertura/semana</strong></p>
      {DIAS_SEMANA.map((d) => (
        <Dia
          key={d}
          dia={d}
          horarios={horarios}
          faixas={cobertura[d]}
          onAberto={(v) => setDia(d, v)}
          onJanela={(j) => onChange({ ...horarios, [d]: j }, cobertura)}
          onFaixas={(f) => onChange(horarios, { ...cobertura, [d]: f })}
          onReplicar={() => {
            const [h, c] = replicarDia(horarios, cobertura, d);
            onChange(h, c);
          }}
        />
      ))}
      <p className="dica">
        Faixas fora do horário de funcionamento são desconsideradas. Fim antes do início termina no dia seguinte (ex.: 22:00 até 06:00). Informe o
        setor quando um cargo não cobre o outro (ex.: caixa e açougue, cozinha e salão); faixas sem setor valem para o quadro sem setor.
      </p>
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
  const atualizar = (i: number, campo: "inicio" | "fim" | "pessoas" | "setor", v: string) =>
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
            {viraODia(j.abre, j.fecha) && <span className="selo">dia seguinte</span>}
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
            {viraODia(f.inicio, f.fim) && <span className="selo">dia seguinte</span>}
            <input className="curto" type="number" min={0} value={f.pessoas} onChange={(e) => atualizar(i, "pessoas", e.target.value)} aria-label="Pessoas" />
            <span className="dica">pessoas</span>
            <input list="lista-setores" value={f.setor ?? ""} onChange={(e) => atualizar(i, "setor", e.target.value)} placeholder="setor (opcional)" aria-label="Setor" style={{ width: 150 }} />
            <button className="link" onClick={() => props.onFaixas(faixas.filter((_, k) => k !== i))}>remover</button>
          </div>
        ))}
      {j && (
        <button
          className="link"
          onClick={() => {
            const ultimo = faixas[faixas.length - 1];
            props.onFaixas([...faixas, { inicio: ultimo?.fim ?? j.abre, fim: j.fecha, pessoas: ultimo?.pessoas ?? 1, ...(ultimo?.setor ? { setor: ultimo.setor } : {}) }]);
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
    onChange(quadro.map((c, k) => (k === i ? { ...c, [campo]: campo === "nome" || campo === "setor" ? v : Number(v) } : c)));
  return (
    <div className="cartao">
      <div className="tabela-wrap">
        <table>
          <thead>
            <tr><th>Cargo</th><th>Setor</th><th>Quantidade</th><th>Salário-base (R$)</th><th>Jornada atual (h/sem)</th><th></th></tr>
          </thead>
          <tbody>
            {quadro.map((c, i) => (
              <tr key={i}>
                <td><input value={c.nome} onChange={(e) => atualizar(i, "nome", e.target.value)} /></td>
                <td><input list="lista-setores" value={c.setor ?? ""} onChange={(e) => atualizar(i, "setor", e.target.value)} placeholder="geral" style={{ width: 130 }} /></td>
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
        Sem setores na cobertura, todo o quadro conta para a cobertura mínima. Com setores, cada cargo só cobre o próprio setor e a sobra de um setor não
        cobre a falta de outro. Salários são dados sensíveis: ficam apenas no banco da sua rede e não são registrados em logs.
      </p>
    </div>
  );
}
