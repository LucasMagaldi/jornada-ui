import { DIAS_SEMANA } from "./tipos";
import type { CoberturaSemanal, DiaSemana, HorarioSemanal } from "./tipos";

export const horarioVazio = (): HorarioSemanal => ({ seg: null, ter: null, qua: null, qui: null, sex: null, sab: null, dom: null });
export const coberturaVazia = (): CoberturaSemanal => ({ seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] });

export function horarioPadrao(): HorarioSemanal {
  const h = horarioVazio();
  for (const d of DIAS_SEMANA) h[d] = { abre: "08:00", fecha: "20:00" };
  return h;
}

const min = (h: string) => {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
};

/** Fim antes do início = termina no dia seguinte (D-35). */
export const viraODia = (inicio: string, fim: string) => min(fim) < min(inicio);

/** Fim em minutos a partir da 00:00 do próprio dia (passa de 1440 quando vira o dia). */
const fimNoDia = (inicio: string, fim: string) => min(fim) + (viraODia(inicio, fim) ? 24 * 60 : 0);

/** Setores usados nas faixas e no quadro, para sugerir no campo (D-32). */
export function setoresUsados(coberturas: CoberturaSemanal[], quadro: { setor?: string }[]): string[] {
  const nomes = [...coberturas.flatMap((c) => DIAS_SEMANA.flatMap((d) => c[d].map((f) => f.setor))), ...quadro.map((c) => c.setor)];
  return [...new Set(nomes.map((s) => s?.trim()).filter((s): s is string => !!s))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Atalho "mesma cobertura todos os dias": uma faixa cobrindo o horário inteiro de cada dia aberto. */
export function coberturaUniforme(h: HorarioSemanal, pessoas: number): CoberturaSemanal {
  const c = coberturaVazia();
  for (const d of DIAS_SEMANA) c[d] = h[d] ? [{ inicio: h[d]!.abre, fim: h[d]!.fecha, pessoas }] : [];
  return c;
}

/** Copia horário e faixas de um dia para todos os outros. */
export function replicarDia(h: HorarioSemanal, c: CoberturaSemanal, origem: DiaSemana): [HorarioSemanal, CoberturaSemanal] {
  const h2 = horarioVazio();
  const c2 = coberturaVazia();
  for (const d of DIAS_SEMANA) {
    h2[d] = h[origem] ? { ...h[origem]! } : null;
    c2[d] = c[origem].map((f) => ({ ...f }));
  }
  return [h2, c2];
}

/**
 * Prévia local das horas de cobertura do dia, recortadas pelo horário do mesmo dia (o cálculo
 * oficial é feito pela API e também considera a madrugada que vem do dia anterior, D-35).
 */
export function horasCoberturaDia(h: HorarioSemanal, c: CoberturaSemanal, d: DiaSemana): number {
  const j = h[d];
  if (!j) return 0;
  return c[d].reduce((s, f) => {
    const ini = Math.max(min(f.inicio), min(j.abre));
    const fim = Math.min(fimNoDia(f.inicio, f.fim), fimNoDia(j.abre, j.fecha));
    return s + (Math.max(0, fim - ini) / 60) * f.pessoas;
  }, 0);
}
