export type StatusEstudoCaso = 'ATIVO' | 'ENCERRADO' | 'RASCUNHO';

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
}

export interface IndicadorReutilizavel {
  id: string;
  nome: string;
  descricao?: string;
}

export interface EstudoDeCasoRequestDTO {
  alunoId: string;
  status: StatusEstudoCaso;
  diagnosticoInicial?: string | null;
  indicadoresIds: string[];
}

export interface EstudoDeCasoUpdateDTO {
  status: StatusEstudoCaso;
  diagnosticoInicial?: string | null;
  indicadoresIds: string[];
}

export interface EstudoDeCasoResponseDTO {
  id: string;
  alunoId: string;
  status: StatusEstudoCaso;
  diagnosticoInicial: string | null;
  indicadoresIds: string[];
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface ProblemDetailRFC9457 {
  title: string;
  status: number;
  detail: string;
  instance?: string;
}
