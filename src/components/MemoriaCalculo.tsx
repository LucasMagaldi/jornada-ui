import { formatarBRL, formatarNumero, formatarPct } from "@/lib/formato";
import type { Premissas, ResultadoFase } from "@/lib/tipos";
import { NOME_CENARIO } from "@/lib/tipos";

/** Mostra de onde vem cada número de uma fase (todo número acompanha suas premissas). */
export function MemoriaCalculo({ f, p }: { f: ResultadoFase; p: Premissas }) {
  const J = f.fase.jornadaSemanal;
  const porSetor = f.setores.length > 1;
  return (
    <div className="memoria">
      <ol>
        <li>
          Horas de cobertura/semana = Σ (horas da faixa × pessoas) = <code>{formatarNumero(f.horasCoberturaSemana, 1)} h</code>
        </li>
        <li>
          Horas produtivas por colaborador = {J} h × (1 − {formatarPct(p.perdas)}) = <code>{formatarNumero(f.horasProdutivasPorColaborador)} h</code>
        </li>
        <li>
          FTE necessário = {formatarNumero(f.horasCoberturaSemana, 1)} ÷ {formatarNumero(f.horasProdutivasPorColaborador)} ={" "}
          {formatarNumero(f.fteNecessarioSemMargem)} × (1 + {formatarPct(p.margemSeguranca)} de margem) = <code>{formatarNumero(f.fteNecessario)}</code>
        </li>
        <li>
          FTE atual equivalente = Σ quantidade × mín(jornada, {J}) ÷ {J} = <code>{formatarNumero(f.fteAtualEquivalente)}</code>
        </li>
        <li>
          Delta FTE = <code>{formatarNumero(f.deltaFte)}</code>
          {f.deltaFte < 0 && " (sobra de quadro)"}
          {porSetor && (
            <>
              ; déficit = Σ faltas por setor = <code>{formatarNumero(f.deficitFte)}</code> (sobra num setor não cobre falta em outro)
            </>
          )}
        </li>
        <li>
          Salário médio ponderado = <code>{formatarBRL(f.salarioMedio)}</code>; valor-hora = salário ÷ divisor {f.divisorUsado} ={" "}
          <code>{formatarBRL(f.valorHora)}</code>
          {porSetor && " (os custos usam o salário médio de cada setor)"}
        </li>
        <li>
          Horas faltantes = {formatarNumero(f.deficitFte)} FTE × {formatarNumero(f.horasProdutivasPorColaborador)} h ={" "}
          {formatarNumero(f.horasFaltantesSemana, 1)} h/semana = <code>{formatarNumero(f.horasFaltantesMes, 1)} h/mês</code> (× 52/12)
        </li>
      </ol>
      {porSetor && (
        <div className="tabela-wrap">
          <table>
            <thead>
              <tr><th>Setor</th><th>Cobertura (h)</th><th>FTE nec.</th><th>FTE atual</th><th>Delta</th><th>Pessoas</th><th>Salário médio</th></tr>
            </thead>
            <tbody>
              {f.setores.map((s) => (
                <tr key={s.setor}>
                  <td>{s.setor || "geral"}</td>
                  <td>{formatarNumero(s.horasCoberturaSemana, 1)}</td>
                  <td>{formatarNumero(s.fteNecessario)}</td>
                  <td>{formatarNumero(s.fteAtualEquivalente)}</td>
                  <td>{formatarNumero(s.deltaFte)}</td>
                  <td>{s.headcount}</td>
                  <td>{formatarBRL(s.salarioMedio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ul>
        {Object.values(f.cenarios).map((c) => (
          <li key={c.id}>
            <strong>{NOME_CENARIO[c.id]}:</strong>{" "}
            {c.disponivel ? (
              <>
                {formatarBRL(c.custoMensal)}/mês — <em>{String(c.detalhes.formula ?? "")}</em>
                {c.id === "contratar" && Number(c.detalhes.contratacoesInteiras) > 0 && (
                  <> · {String(c.detalhes.contratacoesInteiras)} contratação(ões) inteira(s) = {formatarBRL(Number(c.detalhes.custoContratacoesInteiras))}</>
                )}
                {c.id === "horaExtra" && Number(c.detalhes.horasExtrasMes) > 0 && (
                  <>
                    {" "}
                    · {formatarNumero(Number(c.detalhes.horasExtrasSemanaPorColaborador), 1)} h/semana por colaborador (limite{" "}
                    {formatarNumero(Number(c.detalhes.limiteSemanalPorColaborador), 0)} h)
                  </>
                )}
                {c.id === "reduzirHorario" && (
                  <>
                    {" "}
                    · perde {formatarNumero(Number(c.detalhes.horasAtendimentoPerdidasSemana), 1)} h de atendimento/semana · economia de{" "}
                    {formatarBRL(Number(c.detalhes.economiaVsContratar))} vs. contratar
                  </>
                )}
              </>
            ) : (
              "não disponível"
            )}
            {c.avisos.map((a, i) => (
              <div key={i} style={{ color: "var(--alerta)" }}>
                ⚠ {a}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
