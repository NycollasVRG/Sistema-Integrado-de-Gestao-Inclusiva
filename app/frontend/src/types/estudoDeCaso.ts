export type StatusEstudoCaso = 'ATIVO' | 'ENCERRADO' | 'RASCUNHO';

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  turma?: string;
  curso?: string;
}

export interface IndicadorReutilizavel {
  id: string;
  nome: string;
  descricao?: string;
}

export interface DadosFormularioEstudo {
  diagnostico: string;
  historico: string;
  indicadoresIds: string[];
}

export interface ResponsavelAuditoriaDTO {
  id: string;
  nome: string | null;
}

export interface EstudoDeCasoRequestDTO {
  alunoId: string;
  status: StatusEstudoCaso;
  diagnosticoInicial?: string | null;
  historico?: string | null;
  historicoFamiliar?: string | null;
  historicoSocioemocional?: string | null;
  indicadoresIds: string[];
}

export interface EstudoDeCasoUpdateDTO {
  status: StatusEstudoCaso;
  diagnosticoInicial?: string | null;
  historico?: string | null;
  historicoFamiliar?: string | null;
  historicoSocioemocional?: string | null;
  indicadoresIds: string[];
}

export interface EstudoDeCasoResponseDTO {
  id: string;
  alunoId: string;
  status: StatusEstudoCaso;
  diagnosticoInicial: string | null;
  historico?: string | null;
  /** TA11.3: ausentes no JSON para perfis ACESSO_FUNCIONAL. */
  historicoFamiliar?: string | null;
  historicoSocioemocional?: string | null;
  indicadoresIds: string[];
  versao?: number;
  estudoOrigemId?: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
  atualizadoPor?: ResponsavelAuditoriaDTO | null;
}

export interface ProblemDetailRFC9457 {
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string>;
}
