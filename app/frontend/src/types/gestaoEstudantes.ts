// Tipos da US12. O formato do request acompanha os campos usados no AlunoService.java.
export interface TagDificuldadeDTO {
  id?: string;
  nome: string;
  descricao?: string;
}

export interface EstudanteResumo {
  id: string;
  nomeCompleto: string;
  matricula: string;
  curso: string;
  turma: string;
  status: 'ATIVO' | 'INATIVO' | 'EVADIDO' | string;
  ativo: boolean;
  tagsDificuldade: TagDificuldadeDTO[];
}

export interface DadosEstudanteFormulario {
  nomeCompleto: string;
  matricula: string;
  curso: string;
  turma: string;
  status: 'ATIVO' | 'INATIVO' | 'EVADIDO';
  tagsDificuldadeIds: string[];
}

export interface PaginaEstudantes {
  content: EstudanteResumo[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface FiltrosEstudantes {
  termo: string;
  curso: string;
  turma: string;
  tag: string;
  ativo: boolean;
  page: number;
  size: number;
}
