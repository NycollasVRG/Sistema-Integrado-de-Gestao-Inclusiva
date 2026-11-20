export interface AlunoHeaderData {
  id: string;
  nome: string;
  fotoUrl?: string | null;
  matricula: string;
  curso: string;
  turma?: string | null;
  tagsDificuldade: string[];
}
