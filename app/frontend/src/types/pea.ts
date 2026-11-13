export interface DadosFormularioPea {
  peiId?: string | null;
  disciplinaId?: string | null;
  componenteCurricular: string;
  semestreAno: string;
  docente: string;
  objetivoGeral: string;
  objetivosEspecificos: string;
  conteudosProgramaticos: string;
  metodologia: string;
  avaliacao: string;
  bibliografiaBasica: string;
  bibliografiaComplementar: string;
}

export interface PeaRequestDTO {
  acompanhamentoId: string;
  peiId?: string | null;
  disciplinaId?: string | null;
  componenteCurricular?: string | null;
  semestreAno?: string | null;
  docente?: string | null;
  objetivoGeral: string;
  objetivosEspecificos?: string | null;
  conteudosProgramaticos?: string | null;
  metodologia: string;
  avaliacao: string;
  bibliografiaBasica?: string | null;
  bibliografiaComplementar?: string | null;
}

export interface PeaUpdateDTO {
  peiId?: string | null;
  disciplinaId?: string | null;
  componenteCurricular?: string | null;
  semestreAno?: string | null;
  docente?: string | null;
  objetivoGeral?: string;
  objetivosEspecificos?: string | null;
  conteudosProgramaticos?: string | null;
  metodologia?: string;
  avaliacao?: string;
  bibliografiaBasica?: string | null;
  bibliografiaComplementar?: string | null;
}

export interface PeaResponseDTO {
  id: string;
  acompanhamentoId: string;
  peiId: string | null;
  alunoId: string;
  disciplinaId: string | null;
  componenteCurricular: string | null;
  semestreAno: string | null;
  docente: string | null;
  objetivoGeral: string | null;
  objetivosEspecificos: string | null;
  conteudosProgramaticos: string | null;
  metodologia: string | null;
  avaliacao: string | null;
  bibliografiaBasica: string | null;
  bibliografiaComplementar: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
}


