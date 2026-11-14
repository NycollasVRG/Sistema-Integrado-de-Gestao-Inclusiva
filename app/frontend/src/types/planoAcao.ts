export interface DadosFormularioPlanoAcao {
  demandasIdentificadas: string;
  propostasIntervencao: string;
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

export interface PlanoAcaoRequestDTO {
  acompanhamentoId: string;
  demandasIdentificadas?: string | null;
  propostasIntervencao?: string | null;
  componenteCurricular?: string | null;
  semestreAno?: string | null;
  docente?: string | null;
  objetivoGeral?: string | null;
  objetivosEspecificos?: string | null;
  conteudosProgramaticos?: string | null;
  metodologia?: string | null;
  avaliacao?: string | null;
  bibliografiaBasica?: string | null;
  bibliografiaComplementar?: string | null;
}

export interface PlanoAcaoUpdateDTO {
  demandasIdentificadas?: string | null;
  propostasIntervencao?: string | null;
  componenteCurricular?: string | null;
  semestreAno?: string | null;
  docente?: string | null;
  objetivoGeral?: string | null;
  objetivosEspecificos?: string | null;
  conteudosProgramaticos?: string | null;
  metodologia?: string | null;
  avaliacao?: string | null;
  bibliografiaBasica?: string | null;
  bibliografiaComplementar?: string | null;
}

export interface PlanoAcaoResponseDTO {
  id: string;
  acompanhamentoId: string;
  alunoId: string;
  nomeEstudante: string | null;
  matriculaEstudante: string | null;
  cursoEstudante: string | null;
  demandasIdentificadas: string | null;
  propostasIntervencao: string | null;
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
