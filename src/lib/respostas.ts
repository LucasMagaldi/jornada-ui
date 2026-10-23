import type { Cargo, CoberturaSemanal, HorarioSemanal, Premissas, ResultadoRede, SemanaPico } from "./tipos";

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
  temPico: boolean;
  bandeira: string | null;
  regional: string | null;
}

export interface UnidadeCompleta {
  id: string;
  nome: string;
  bandeira: string | null;
  regional: string | null;
  horarios: HorarioSemanal;
  horarioReduzido: HorarioSemanal | null;
  cobertura: CoberturaSemanal;
  pico: SemanaPico | null;
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
