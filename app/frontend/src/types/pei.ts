export interface DadosFormularioPei {
  semestreAno: string;
  historicoEstudante: string;
  necessidadesEspecificas: string;
  habilidadesInteresses: string;
  dificuldadesApresentadas: string;
  propostasAdaptacoes: string;
}

export interface PeiRequestDTO {
  acompanhamentoId: string;
  semestreAno?: string | null;
  historicoEstudante?: string | null;
  necessidadesEspecificas?: string | null;
  habilidadesInteresses: string;
  dificuldadesApresentadas?: string | null;
  propostasAdaptacoes: string;
}

export interface PeiUpdateDTO {
  semestreAno?: string | null;
  historicoEstudante?: string | null;
  necessidadesEspecificas?: string | null;
  habilidadesInteresses?: string;
  dificuldadesApresentadas?: string | null;
  propostasAdaptacoes?: string;
}

export interface PeiResponseDTO {
  id: string;
  acompanhamentoId: string;
  alunoId: string;
  semestreAno: string | null;
  historicoEstudante: string | null;
  necessidadesEspecificas: string | null;
  habilidadesInteresses: string | null;
  dificuldadesApresentadas: string | null;
  propostasAdaptacoes: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

