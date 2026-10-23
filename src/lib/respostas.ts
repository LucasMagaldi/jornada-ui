import type { Cargo, CoberturaSemanal, HorarioSemanal, Premissas, ResultadoRede, SemanaPico, VersaoRegras } from "./tipos";

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

/** GET /publico/regras (D-37). */
export interface RespostaRegrasPublicas {
  dataReferencia: string;
  vigente: VersaoRegras;
}

/** POST /publico/diagnostico (D-36): `resultado` tem uma unidade típica; a rede é ela × `unidades`. */
export interface RespostaDiagnostico extends RespostaSimulacao {
  unidades: number;
}
