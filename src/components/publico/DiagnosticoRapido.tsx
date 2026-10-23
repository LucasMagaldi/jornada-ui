"use client";

import { useRef, useState } from "react";
import { Erros } from "@/components/Erros";
import { api } from "@/lib/api";
import { linkWhatsApp } from "@/lib/contato";
import { formatarBRL, formatarNumero } from "@/lib/formato";
import type { RespostaDiagnostico } from "@/lib/respostas";
import { AVISO_JURIDICO, LIMITACOES } from "@/lib/textos";
import { NOME_CENARIO } from "@/lib/tipos";
import type { IdCenario, Janela, ResultadoFase } from "@/lib/tipos";

/** Diagnóstico rápido da página pública (D-36): uma unidade típica, calculada pelo motor da API. */

type IdSegmento = "farmacia" | "supermercado" | "restaurante" | "varejo" | "outro";

interface Formulario {
  unidades: number;
  semana: Janela;
  sabadoAberto: boolean;
  sabado: Janela;
  domingoAberto: boolean;
  domingo: Janela;
  pessoas: number;
  colaboradores: number;
  salarioMedio: number;
  jornadaAtual: number;
  temSetor: boolean;
  setor: { nome: string; pessoas: number; colaboradores: number; salarioMedio: number };
  temPico: boolean;
  pico: { descricao: string; janela: Janela; pessoas: number };
}

/** Premissas em % na tela; vazio = padrão da API. */
interface PremissasTela {
  perdas: string;
  fatorEncargos: string;
  adicionalHoraExtra: string;
  margemSeguranca: string;
}

const j = (abre: string, fecha: string): Janela => ({ abre, fecha });

/** Valores de partida por segmento: só exemplos para editar, não benchmarks. */
const SEGMENTOS: Record<IdSegmento, { nome: string; form: Omit<Formulario, "unidades"> }> = {
  farmacia: {
    nome: "Farmácia",
    form: {
      semana: j("07:00", "23:00"), sabadoAberto: true, sabado: j("07:00", "23:00"), domingoAberto: true, domingo: j("08:00", "22:00"),
      pessoas: 2, colaboradores: 7, salarioMedio: 2100, jornadaAtual: 44,
      temSetor: true, setor: { nome: "Farmacêutico", pessoas: 1, colaboradores: 3, salarioMedio: 5500 },
      temPico: true, pico: { descricao: "Dezembro", janela: j("07:00", "23:00"), pessoas: 3 },
    },
  },
  supermercado: {
    nome: "Supermercado",
    form: {
      semana: j("07:00", "22:00"), sabadoAberto: true, sabado: j("07:00", "22:00"), domingoAberto: true, domingo: j("08:00", "14:00"),
      pessoas: 10, colaboradores: 30, salarioMedio: 2000, jornadaAtual: 44,
      temSetor: true, setor: { nome: "Açougue", pessoas: 2, colaboradores: 5, salarioMedio: 2600 },
      temPico: true, pico: { descricao: "Natal", janela: j("07:00", "23:00"), pessoas: 15 },
    },
  },
  restaurante: {
    nome: "Restaurante",
    form: {
      semana: j("11:00", "23:00"), sabadoAberto: true, sabado: j("11:00", "01:00"), domingoAberto: true, domingo: j("11:00", "23:00"),
      pessoas: 4, colaboradores: 12, salarioMedio: 1900, jornadaAtual: 44,
      temSetor: true, setor: { nome: "Cozinha", pessoas: 3, colaboradores: 8, salarioMedio: 2300 },
      temPico: false, pico: { descricao: "Fim de ano", janela: j("11:00", "01:00"), pessoas: 6 },
    },
  },
  varejo: {
    nome: "Loja de varejo",
    form: {
      semana: j("10:00", "22:00"), sabadoAberto: true, sabado: j("10:00", "22:00"), domingoAberto: true, domingo: j("14:00", "20:00"),
      pessoas: 3, colaboradores: 8, salarioMedio: 1900, jornadaAtual: 44,
      temSetor: false, setor: { nome: "Caixa", pessoas: 1, colaboradores: 3, salarioMedio: 1900 },
      temPico: true, pico: { descricao: "Natal", janela: j("09:00", "23:00"), pessoas: 5 },
    },
  },
  outro: {
    nome: "Outro",
    form: {
      semana: j("08:00", "18:00"), sabadoAberto: true, sabado: j("08:00", "14:00"), domingoAberto: false, domingo: j("08:00", "14:00"),
      pessoas: 3, colaboradores: 6, salarioMedio: 2000, jornadaAtual: 44,
      temSetor: false, setor: { nome: "", pessoas: 1, colaboradores: 2, salarioMedio: 2000 },
      temPico: false, pico: { descricao: "", janela: j("08:00", "20:00"), pessoas: 4 },
    },
  },
};

const ORDEM_CENARIOS: IdCenario[] = ["contratar", "horaExtra", "mix", "reduzirHorario"];
const num = (v: string) => (v === "" ? 0 : Number(v));

function corpoDaRequisicao(f: Formulario, p: PremissasTela) {
  const premissas: Record<string, number> = {};
  if (p.perdas !== "") premissas.perdas = num(p.perdas) / 100;
  if (p.fatorEncargos !== "") premissas.fatorEncargos = num(p.fatorEncargos.replace(",", "."));
  if (p.adicionalHoraExtra !== "") premissas.adicionalHoraExtra = num(p.adicionalHoraExtra) / 100;
  if (p.margemSeguranca !== "") premissas.margemSeguranca = num(p.margemSeguranca) / 100;
  return {
    unidades: f.unidades,
    semana: f.semana,
    sabado: f.sabadoAberto ? f.sabado : null,
    domingo: f.domingoAberto ? f.domingo : null,
    pessoas: f.pessoas,
    colaboradores: f.colaboradores,
    salarioMedio: f.salarioMedio,
    jornadaAtual: f.jornadaAtual,
    setor: f.temSetor ? { ...f.setor, nome: f.setor.nome.trim() } : null,
    pico: f.temPico ? { ...f.pico, descricao: f.pico.descricao.trim() || undefined } : null,
    premissas,
  };
}

// ---------------------------------------------------------------------------

function CampoHorario({ rotulo, valor, onChange, desligado }: { rotulo: string; valor: Janela; onChange: (j: Janela) => void; desligado?: boolean }) {
  return (
    <div className="pub-horario" aria-label={rotulo}>
      <input type="time" aria-label={`${rotulo}: abre`} value={valor.abre} disabled={desligado} onChange={(e) => onChange({ ...valor, abre: e.target.value })} />
      <span>às</span>
      <input type="time" aria-label={`${rotulo}: fecha`} value={valor.fecha} disabled={desligado} onChange={(e) => onChange({ ...valor, fecha: e.target.value })} />
    </div>
  );
}

function Numero({ id, rotulo, valor, onChange, min = 0, passo = 1, dica }: { id: string; rotulo: string; valor: number; onChange: (v: number) => void; min?: number; passo?: number | "any"; dica?: string }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <input id={id} type="number" inputMode="decimal" min={min} step={passo} value={Number.isFinite(valor) ? valor : ""} onChange={(e) => onChange(num(e.target.value))} />
      {dica && <p className="dica">{dica}</p>}
    </div>
  );
}

export function DiagnosticoRapido() {
  const [segmento, setSegmento] = useState<IdSegmento>("farmacia");
  const [form, setForm] = useState<Formulario>({ unidades: 10, ...SEGMENTOS.farmacia.form });
  const [premissas, setPremissas] = useState<PremissasTela>({ perdas: "", fatorEncargos: "", adicionalHoraExtra: "", margemSeguranca: "" });
  const [resposta, setResposta] = useState<{ r: RespostaDiagnostico; nomePico: string; segmento: string } | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [calculando, setCalculando] = useState(false);
  const resultadoRef = useRef<HTMLDivElement>(null);

  const mudar = (parcial: Partial<Formulario>) => setForm((f) => ({ ...f, ...parcial }));

  function escolherSegmento(id: IdSegmento) {
    setSegmento(id);
    setForm((f) => ({ unidades: f.unidades, ...SEGMENTOS[id].form }));
    setResposta(null);
  }

  async function calcular(e: React.FormEvent) {
    e.preventDefault();
    setCalculando(true);
    setErro(null);
    try {
      const r = await api<RespostaDiagnostico>("/publico/diagnostico", { method: "POST", body: corpoDaRequisicao(form, premissas) });
      setResposta({ r, nomePico: form.pico.descricao.trim(), segmento: SEGMENTOS[segmento].nome });
      requestAnimationFrame(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setErro(e);
    } finally {
      setCalculando(false);
    }
  }

  const usadas = resposta?.r.resultado.premissas;
  const placeholder = (v: number | undefined, fator = 100) => (v === undefined ? "padrão" : formatarNumero(v * fator, fator === 100 ? 0 : 2));

  return (
    <div className="pub-diagnostico">
      <form className="cartao pub-form" onSubmit={calcular}>
        <fieldset>
          <legend>1. Sua operação</legend>
          <div className="pub-segmentos" role="radiogroup" aria-label="Segmento">
            {(Object.keys(SEGMENTOS) as IdSegmento[]).map((id) => (
              <button key={id} type="button" role="radio" aria-checked={segmento === id} className={segmento === id ? "" : "secundario"} onClick={() => escolherSegmento(id)}>
                {SEGMENTOS[id].nome}
              </button>
            ))}
          </div>
          <p className="dica">O segmento só preenche um exemplo. Troque pelos números de uma unidade típica da sua rede.</p>
          <div className="pub-curto">
            <Numero id="d-unidades" rotulo="Quantas unidades parecidas com esta" valor={form.unidades} min={1} onChange={(v) => mudar({ unidades: v })} />
          </div>
        </fieldset>

        <fieldset>
          <legend>2. Horário de funcionamento</legend>
          <div className="pub-dias">
            <div className="pub-dia">
              <strong>Segunda a sexta</strong>
              <CampoHorario rotulo="Segunda a sexta" valor={form.semana} onChange={(v) => mudar({ semana: v })} />
            </div>
            <div className="pub-dia">
              <label className="campo-inline">
                <input type="checkbox" checked={form.sabadoAberto} onChange={(e) => mudar({ sabadoAberto: e.target.checked })} /> Sábado
              </label>
              <CampoHorario rotulo="Sábado" valor={form.sabado} desligado={!form.sabadoAberto} onChange={(v) => mudar({ sabado: v })} />
            </div>
            <div className="pub-dia">
              <label className="campo-inline">
                <input type="checkbox" checked={form.domingoAberto} onChange={(e) => mudar({ domingoAberto: e.target.checked })} /> Domingo
              </label>
              <CampoHorario rotulo="Domingo" valor={form.domingo} desligado={!form.domingoAberto} onChange={(v) => mudar({ domingo: v })} />
            </div>
          </div>
          <p className="dica">Se fecha depois da meia-noite, informe o horário do dia seguinte (ex.: 11:00 às 01:00).</p>
        </fieldset>

        <fieldset>
          <legend>3. Equipe {form.temSetor ? "(demais funções)" : ""}</legend>
          <div className="grade pub-grade-setor">
            <Numero id="d-pessoas" rotulo="Pessoas trabalhando ao mesmo tempo" valor={form.pessoas} onChange={(v) => mudar({ pessoas: v })} dica="O mínimo para atender durante todo o horário aberto." />
            <Numero id="d-colab" rotulo="Colaboradores hoje" valor={form.colaboradores} onChange={(v) => mudar({ colaboradores: v })} />
            <Numero id="d-salario" rotulo="Salário médio (R$)" valor={form.salarioMedio} min={1} passo="any" onChange={(v) => mudar({ salarioMedio: v })} />
            <Numero id="d-jornada" rotulo="Jornada semanal hoje (h)" valor={form.jornadaAtual} min={1} onChange={(v) => mudar({ jornadaAtual: v })} />
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <label className="campo-inline">
              <input type="checkbox" checked={form.temSetor} onChange={(e) => mudar({ temSetor: e.target.checked })} /> 4. Tem um setor que não pode ficar descoberto?
            </label>
          </legend>
          <p className="dica">Farmacêutico, açougue, cozinha: uma função que o resto da equipe não substitui.</p>
          {form.temSetor && (
            <div className="grade pub-grade-setor">
              <div className="campo">
                <label htmlFor="d-setor">Setor</label>
                <input id="d-setor" value={form.setor.nome} maxLength={60} required onChange={(e) => mudar({ setor: { ...form.setor, nome: e.target.value } })} />
              </div>
              <Numero id="d-setor-pessoas" rotulo="Pessoas ao mesmo tempo" valor={form.setor.pessoas} min={1} onChange={(v) => mudar({ setor: { ...form.setor, pessoas: v } })} />
              <Numero id="d-setor-colab" rotulo="Colaboradores hoje" valor={form.setor.colaboradores} onChange={(v) => mudar({ setor: { ...form.setor, colaboradores: v } })} />
              <Numero id="d-setor-salario" rotulo="Salário médio (R$)" valor={form.setor.salarioMedio} min={1} passo="any" onChange={(v) => mudar({ setor: { ...form.setor, salarioMedio: v } })} />
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>
            <label className="campo-inline">
              <input type="checkbox" checked={form.temPico} onChange={(e) => mudar({ temPico: e.target.checked })} /> 5. Quer testar a semana de pico (Natal, feriados)?
            </label>
          </legend>
          <p className="dica">Mesmo quadro, com o horário e a equipe do pico em todos os dias da semana.</p>
          {form.temPico && (
            <div className="grade grade-3">
              <div className="campo">
                <label htmlFor="d-pico-nome">Nome</label>
                <input id="d-pico-nome" value={form.pico.descricao} maxLength={60} placeholder="Natal" onChange={(e) => mudar({ pico: { ...form.pico, descricao: e.target.value } })} />
              </div>
              <div className="campo">
                <label>Horário no pico</label>
                <CampoHorario rotulo="Horário no pico" valor={form.pico.janela} onChange={(v) => mudar({ pico: { ...form.pico, janela: v } })} />
              </div>
              <Numero id="d-pico-pessoas" rotulo={form.temSetor ? "Pessoas ao mesmo tempo (demais funções)" : "Pessoas ao mesmo tempo"} valor={form.pico.pessoas} onChange={(v) => mudar({ pico: { ...form.pico, pessoas: v } })} />
            </div>
          )}
        </fieldset>

        <details className="pub-premissas">
          <summary>Ajustar premissas (opcional)</summary>
          <div className="grade grade-4">
            <div className="campo">
              <label htmlFor="d-perdas">Perdas (%)</label>
              <input id="d-perdas" type="number" min={0} max={90} placeholder={placeholder(usadas?.perdas)} value={premissas.perdas} onChange={(e) => setPremissas({ ...premissas, perdas: e.target.value })} />
              <p className="dica">Férias, afastamentos e faltas.</p>
            </div>
            <div className="campo">
              <label htmlFor="d-encargos">Fator de encargos</label>
              <input id="d-encargos" type="number" min={1} max={5} step={0.05} placeholder={placeholder(usadas?.fatorEncargos, 1)} value={premissas.fatorEncargos} onChange={(e) => setPremissas({ ...premissas, fatorEncargos: e.target.value })} />
              <p className="dica">Custo total ÷ salário.</p>
            </div>
            <div className="campo">
              <label htmlFor="d-adicional">Adicional de hora extra (%)</label>
              <input id="d-adicional" type="number" min={0} max={500} placeholder={placeholder(usadas?.adicionalHoraExtra)} value={premissas.adicionalHoraExtra} onChange={(e) => setPremissas({ ...premissas, adicionalHoraExtra: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="d-margem">Margem de segurança (%)</label>
              <input id="d-margem" type="number" min={0} max={100} placeholder={placeholder(usadas?.margemSeguranca)} value={premissas.margemSeguranca} onChange={(e) => setPremissas({ ...premissas, margemSeguranca: e.target.value })} />
            </div>
          </div>
        </details>

        <Erros erro={erro} />
        <div className="linha">
          <button type="submit" disabled={calculando}>
            {calculando ? "Calculando…" : resposta ? "Recalcular" : "Calcular impacto"}
          </button>
          {calculando && <span className="dica">O primeiro cálculo pode levar até um minuto enquanto o servidor acorda.</span>}
        </div>
      </form>

      <div ref={resultadoRef}>{resposta && <Resultado resposta={resposta.r} nomePico={resposta.nomePico} segmento={resposta.segmento} />}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const EPS = 1e-9;
const pessoas = (v: number) => `${formatarNumero(v, 1)} ${Math.abs(v) >= 0.95 && Math.abs(v) < 1.05 ? "pessoa" : "pessoas"}`;
const excede = (f: ResultadoFase, id: IdCenario) => f.cenarios[id].detalhes.excedeLimiteLegal === true;
const inteiras = (d: number) => (d > EPS ? Math.ceil(d - EPS) : 0);
const custoMelhor = (f: ResultadoFase) => (f.maisBarato ? f.cenarios[f.maisBarato].custoMensal : 0);

/** Contratações inteiras por unidade, setor a setor (a falta fracionária vira gente inteira). */
function contratacoesPorSetor(f: ResultadoFase) {
  return f.setores.map((s) => ({ setor: s.setor, qtd: inteiras(s.deltaFte) })).filter((s) => s.qtd > 0);
}

function praticaPorUnidade(f: ResultadoFase, hoje: ResultadoFase): string | null {
  const agora = contratacoesPorSetor(f);
  if (!agora.length) return null;
  const antes = new Map(contratacoesPorSetor(hoje).map((s) => [s.setor, s.qtd]));
  return agora
    .map(({ setor, qtd }) => {
      const jaFalta = Math.min(antes.get(setor) ?? 0, qtd);
      return `${setor ? `${setor} ` : ""}+${qtd}${setor ? "" : qtd === 1 ? " pessoa" : " pessoas"}${jaFalta > 0 ? ` (${jaFalta} já falta${jaFalta > 1 ? "m" : ""} hoje)` : ""}`;
    })
    .join("; ");
}

function Resultado({ resposta, nomePico, segmento }: { resposta: RespostaDiagnostico; nomePico: string; segmento: string }) {
  const n = resposta.unidades;
  const u = resposta.resultado.unidades[0];
  const fases = u.fases;
  const hoje = fases[0];
  const futuras = fases.slice(1);
  const ultima = fases[fases.length - 1];
  const pc = resposta.resultado.premissas.mixPercentualContratacao;
  const nomeCenario = (id: IdCenario) =>
    id === "mix" ? `Mix (${formatarNumero(pc * 100, 0)}% contratando, ${formatarNumero((1 - pc) * 100, 0)}% em hora extra)` : NOME_CENARIO[id];
  const porLoja = n > 1 ? "por loja" : "na loja";

  // Saldo da loja × falta por setor: onde a soma esconde a falta (D-32).
  const escondida = [...futuras].reverse().find((f) => f.setores.length > 1 && f.deficitFte - Math.max(0, f.deltaFte) > 0.05);
  const pico = u.fasesPico;
  const saldo = (f: ResultadoFase) => (f.deltaFte <= 0 ? `sobram ${pessoas(-f.deltaFte * n)}` : `faltam só ${pessoas(f.deltaFte * n)}`);

  const resumo =
    `Olá! Fiz o diagnóstico rápido do Jornada (${segmento}, ${n} ${n === 1 ? "unidade" : "unidades"}). ` +
    (ultima.deficitFte > 0.005
      ? `Na ${ultima.fase.nome.toLowerCase()} faltam ${pessoas(ultima.deficitFte * n)}, a partir de ${formatarBRL(custoMelhor(ultima) * n)}/mês. `
      : "O resultado não mostrou falta de pessoas. ") +
    "Quero entender melhor.";

  return (
    <section className="pub-resultado" aria-live="polite">
      <h3 className="pub-resultado-titulo">Resultado {n > 1 ? `para ${n} unidades` : "para a unidade"}</h3>

      <div className="grade grade-3">
        <div className="kpi">
          <span className="rotulo">{hoje.fase.nome}</span>
          {hoje.deficitFte > 0.005 ? (
            <>
              <span className="valor">já faltam {pessoas(hoje.deficitFte * n)}</span>
              <span className="nota">
                Para cobrir todo o horário com a regra atual. Na prática, isso costuma ser coberto hoje com hora extra, ou parte do horário fica descoberta.
              </span>
            </>
          ) : (
            <>
              <span className="valor">sem falta</span>
              <span className="nota">O quadro atual cobre a operação; {saldo(hoje)}.</span>
            </>
          )}
        </div>
        {futuras.map((f) => {
          const aMais = (f.deficitFte - hoje.deficitFte) * n;
          const custoAMais = (custoMelhor(f) - custoMelhor(hoje)) * n;
          const pratica = praticaPorUnidade(f, hoje);
          return (
            <div key={f.fase.id} className="kpi pub-kpi-fase">
              <span className="rotulo">{f.fase.nome}</span>
              <span className="valor">{aMais > 0.005 ? `+${pessoas(aMais)}` : "nada a mais"}</span>
              <span className="nota">em relação a hoje{f.deficitFte > 0.005 ? `; no total, faltam ${pessoas(f.deficitFte * n)}` : ""}</span>
              <ul className="pub-kpi-lista">
                {pratica && (
                  <li>
                    <strong>Na prática, {porLoja}:</strong> {pratica}.
                  </li>
                )}
                {f.maisBarato && f.deficitFte > 0.005 && (
                  <li>
                    <strong>Mais barato:</strong> {nomeCenario(f.maisBarato).toLowerCase()}, {formatarBRL(custoMelhor(f) * n)}/mês
                    {custoAMais > 0.5 ? ` (${formatarBRL(custoAMais)} a mais que hoje)` : ""}.
                  </li>
                )}
                {!f.maisBarato && f.deficitFte > 0.005 && <li>Nenhuma alternativa fica dentro do limite legal de hora extra.</li>}
              </ul>
            </div>
          );
        })}
      </div>

      {escondida && (
        <div className="alerta pub-destaque">
          <strong>Somando a loja inteira, isso não aparece.</strong> Na {escondida.fase.nome.toLowerCase()}, no total {saldo(escondida)}, mas faltam{" "}
          {pessoas(escondida.deficitFte * n)} quando se separa por setor:{" "}
          {escondida.setores
            .map((s) => `${s.setor || "geral"} ${s.deltaFte > 0 ? `precisa de mais ${formatarNumero(s.deltaFte * n, 1)}` : `tem sobra de ${formatarNumero(-s.deltaFte * n, 1)}`}`)
            .join("; ")}
          . A sobra de um setor não cobre a falta do outro.
        </div>
      )}

      <h3 className="pub-subtitulo-resultado">Custo mensal de cada alternativa{n > 1 ? ` (rede, ${n} unidades)` : ""}</h3>
      <div className="grade grade-3 pub-fases-custo">
        {fases.map((f) => {
          const visiveis = ORDEM_CENARIOS.filter((id) => f.cenarios[id].disponivel);
          const max = Math.max(1, ...visiveis.map((id) => f.cenarios[id].custoMensal));
          return (
            <div key={f.fase.id} className="cartao pub-card-custo">
              <h4>{f.fase.nome}</h4>
              {f.deficitFte <= 0.005 ? (
                <p className="dica">Sem falta: nenhum custo adicional.</p>
              ) : (
                <ul>
                  {visiveis.map((id) => {
                    const c = f.cenarios[id];
                    const melhor = f.maisBarato === id;
                    return (
                      <li key={id} className={melhor ? "melhor" : ""}>
                        <div className="pub-custo-linha">
                          <span>{nomeCenario(id)}</span>
                          <strong>{formatarBRL(c.custoMensal * n)}</strong>
                        </div>
                        <div className="barra">
                          <div className={melhor ? "melhor" : ""} style={{ width: `${(c.custoMensal / max) * 100}%` }} />
                        </div>
                        {(melhor || excede(f, id)) && (
                          <div className="pub-custo-selos">
                            {melhor && <span className="selo ok">mais barato</span>}
                            {excede(f, id) && <span className="selo alerta">acima do limite de hora extra</span>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <p className="dica pub-dica-custo">
        O mais barato é escolhido só entre as alternativas dentro do limite legal de hora extra. Reduzir horário é calculado no simulador completo.
      </p>

      {pico && (
        <>
          <h3 className="pub-subtitulo-resultado">Semana de pico{nomePico ? `: ${nomePico}` : ""}</h3>
          <p className="dica">Mesmo quadro, com o horário e a equipe do pico. Os custos supõem o pico durante o mês inteiro, para comparar alternativas.</p>
          <div className="grade grade-3 pub-fases-custo">
            {pico.map((p, i) => {
              const he = p.cenarios.horaExtra;
              const porPessoa = Number(he.detalhes.horasExtrasSemanaPorColaborador ?? 0);
              const limite = Number(he.detalhes.limiteSemanalPorColaborador ?? 0);
              return (
                <div key={p.fase.id} className="cartao pub-card-custo">
                  <h4>{p.fase.nome}</h4>
                  <div className="pub-custo-linha">
                    <span>Falta no pico</span>
                    <strong>{pessoas(p.deficitFte * n)}</strong>
                  </div>
                  <div className="pub-custo-linha">
                    <span>Na semana típica</span>
                    <span>{pessoas(fases[i].deficitFte * n)}</span>
                  </div>
                  <div className="pub-custo-linha">
                    <span>Hora extra por pessoa</span>
                    <span>{he.disponivel ? `${formatarNumero(porPessoa, 1)} h/semana` : "sem quem faça"}</span>
                  </div>
                  {he.disponivel && (
                    <div className="pub-custo-selos">
                      {excede(p, "horaExtra") ? (
                        <span className="selo alerta">acima do limite de {formatarNumero(limite, 0)} h/semana</span>
                      ) : (
                        <span className="selo ok">dentro do limite</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {u.avisos.length > 0 && (
        <div className="aviso">
          <strong>Avisos do cálculo</strong>
          <ul>
            {u.avisos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="cartao">
        <details>
          <summary>Como chegamos nesses números</summary>
          <div className="memoria">
            <p>
              <code>FTE necessário = horas de cobertura ÷ (jornada × (1 − perdas)) × (1 + margem)</code>; a falta é o FTE necessário menos o FTE atual, setor a setor. Valores por
              unidade{n > 1 ? `; a rede é × ${n}` : ""}. &quot;Na prática&quot; arredonda a falta de cada setor para cima.
            </p>
            <div className="tabela-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Por unidade</th>
                    {fases.map((f) => (
                      <th key={f.fase.id}>{f.fase.nome}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Linha rotulo="Horas de cobertura por semana" fases={fases} valor={(f) => formatarNumero(f.horasCoberturaSemana, 1)} />
                  <Linha rotulo="Horas produtivas por pessoa" fases={fases} valor={(f) => formatarNumero(f.horasProdutivasPorColaborador, 2)} />
                  <Linha rotulo="FTE necessário" fases={fases} valor={(f) => formatarNumero(f.fteNecessario, 2)} />
                  <Linha rotulo="FTE atual" fases={fases} valor={(f) => formatarNumero(f.fteAtualEquivalente, 2)} />
                  <Linha rotulo="Falta (soma dos setores)" fases={fases} valor={(f) => formatarNumero(f.deficitFte, 2)} />
                  <Linha rotulo="Valor-hora médio" fases={fases} valor={(f) => formatarBRL(f.valorHora)} />
                </tbody>
              </table>
            </div>
          </div>
        </details>
        <details>
          <summary>Premissas usadas</summary>
          <table className="tabela-chave-valor">
            <tbody>
              {resposta.premissasDescritas.map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>

      <p className="limitacoes">
        {AVISO_JURIDICO} {LIMITACOES}
      </p>

      <div className="cartao pub-cta">
        <div>
          <h3>Quer esse cálculo loja a loja?</h3>
          <p>
            Esta é uma unidade típica. Com os dados de cada loja (horário, cobertura por setor, quadro por cargo e semana de pico), entregamos o relatório da rede em PDF e CSV
            com todas as premissas. Fale com a gente pelo WhatsApp: a mensagem já vai com o resumo deste diagnóstico.
          </p>
        </div>
        <div className="acoes">
          <a className="botao pub-botao-whatsapp" href={linkWhatsApp(resumo)} target="_blank" rel="noopener noreferrer">
            Falar no WhatsApp
          </a>
          <a className="botao secundario" href="/cadastro">
            Criar conta e simular por loja
          </a>
        </div>
      </div>
    </section>
  );
}

function Linha({ rotulo, fases, valor }: { rotulo: string; fases: ResultadoFase[]; valor: (f: ResultadoFase) => string }) {
  return (
    <tr>
      <td>{rotulo}</td>
      {fases.map((f) => (
        <td key={f.fase.id}>{valor(f)}</td>
      ))}
    </tr>
  );
}
