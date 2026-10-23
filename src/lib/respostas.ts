import type { Cargo, CoberturaSemanal, HorarioSemanal, Premissas, ResultadoRede } from "./tipos";

export interface Sessao {
  usuario: { email: string };
  rede: { id: string; nome: string };
}

export interface ResumoUnidade {
  id: string;
  nome: string;
  headcount: number;
  horasAbertasSemana: number;
  temHorarioReduzido: boolean;
}

export interface UnidadeCompleta {
  id: string;
  nome: string;
  horarios: HorarioSemanal;
  horarioReduzido: HorarioSemanal | null;
  cobertura: CoberturaSemanal;
  quadro: Cargo[];
}

export interface RespostaSimulacao {
  dataReferencia: string;
  resultado: ResultadoRede;
  premissasDescritas: [string, string][];
}

export interface RespostaPremissas {
  premissas: Premissas;
  padrao: Premissas;
}
