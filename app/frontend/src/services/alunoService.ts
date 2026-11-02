import type { AlunoHeaderData } from '../types/alunoHeader';
import { GestaoEstudantesService } from './gestaoEstudantesService';

// US12 / TA12.3: consulta sempre o estudante escolhido, em vez do mock fixo.
export async function getAlunoHeader(alunoId: string): Promise<AlunoHeaderData> {
  const aluno = await GestaoEstudantesService.buscarPorId(alunoId);
  return {
    id: aluno.id,
    nome: aluno.nomeCompleto,
    fotoUrl: null,
    matricula: aluno.matricula,
    curso: aluno.curso,
    tagsDificuldade: aluno.tagsDificuldade.map((tag) => tag.nome),
  };
}
