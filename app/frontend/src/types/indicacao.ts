/** Contratos da US 10 (Indicações / Demanda Espontânea), alinhados com os DTOs do back-end. */
export type StatusIndicacao = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export interface IndicacaoRequestDTO {
  alunoId: string;
  justificativaPedagogica: string;
  disciplinasObservadas: string[];
}

export interface IndicacaoResponseDTO {
  id: string;
  alunoId: string;
  nomeEstudante: string;
  matriculaAluno: string;
  statusAluno: string | null;
  solicitanteId: string;
  solicitanteNome: string | null;
  justificativaPedagogica: string;
  disciplinasObservadas: string[];
  status: StatusIndicacao;
  justificativaDecisao: string | null;
  decididoPor: string | null;
  decididoEm: string | null;
  estudoDeCasoId: string | null;
  criadoEm: string;
  atualizadoEm: string | null;
}

/** Dados mínimos do estudante exibidos no formulário de indicação. */
export interface EstudanteIndicavel {
  id: string;
  nomeCompleto: string;
  matricula: string;
  curso?: string;
  turma?: string;
  status?: string;
}
