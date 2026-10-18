
export interface PeaRequestDTO {
  acompanhamentoId: string;
  disciplinaId?: string | null;
  objetivoGeral: string;
  metodologia: string;
  avaliacao: string;
}

export interface PeaUpdateDTO {
  objetivoGeral?: string;
  metodologia?: string;
  avaliacao?: string;
}

export interface PeaResponseDTO {
  id: string;
  acompanhamentoId: string;
  disciplinaId?: string | null;
  objetivoGeral: string | null;
  metodologia: string | null;
  avaliacao: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export type PerfilUsuario = 'Professor' | 'Coordenador' | 'Outro';
