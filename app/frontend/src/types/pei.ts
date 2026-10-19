export interface PeiRequestDTO {
  acompanhamentoId: string;
  habilidadesInteresses: string;
  propostasAdaptacoes: string;
}

export interface PeiUpdateDTO {
  habilidadesInteresses?: string;
  propostasAdaptacoes?: string;
}

export interface PeiResponseDTO {
  id: string;
  acompanhamentoId: string;
  alunoId: string;
  habilidadesInteresses: string | null;
  propostasAdaptacoes: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
}
