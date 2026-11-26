export interface DadosFormularioPei {
  semestreAno: string;
  historicoEstudante: string;
  necessidadesEspecificas: string;
  habilidadesInteresses: string;
  dificuldadesApresentadas: string;
  propostasAdaptacoes: string;
  assinaturaClai?: string;
  assinaturaSetorPedagogico?: string;
  assinaturaCoordenadorCurso?: string;
  assinaturaEstudanteResponsavel?: string;
  assinaturasDocentes?: string[];
}

export interface PeiRequestDTO {
  acompanhamentoId: string;
  semestreAno?: string | null;
  historicoEstudante?: string | null;
  necessidadesEspecificas?: string | null;
  habilidadesInteresses: string;
  dificuldadesApresentadas?: string | null;
  propostasAdaptacoes: string;
  assinaturaClai?: string | null;
  assinaturaSetorPedagogico?: string | null;
  assinaturaCoordenadorCurso?: string | null;
  assinaturaEstudanteResponsavel?: string | null;
  assinaturasDocentes?: string[] | null;
}

export interface PeiUpdateDTO {
  semestreAno?: string | null;
  historicoEstudante?: string | null;
  necessidadesEspecificas?: string | null;
  habilidadesInteresses?: string;
  dificuldadesApresentadas?: string | null;
  propostasAdaptacoes?: string;
  assinaturaClai?: string | null;
  assinaturaSetorPedagogico?: string | null;
  assinaturaCoordenadorCurso?: string | null;
  assinaturaEstudanteResponsavel?: string | null;
  assinaturasDocentes?: string[] | null;
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
  assinaturaClai?: string | null;
  assinaturaSetorPedagogico?: string | null;
  assinaturaCoordenadorCurso?: string | null;
  assinaturaEstudanteResponsavel?: string | null;
  assinaturasDocentes?: string[] | null;
  criadoEm?: string;
  atualizadoEm?: string;
}
