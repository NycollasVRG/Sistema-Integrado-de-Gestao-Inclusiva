import type { AlunoHeaderData } from '../types/alunoHeader';
import { GestaoEstudantesService } from './gestaoEstudantesService';
import { apiFetch } from './apiClient';

export interface AcompanhamentoDTO {
  id: string;
  alunoId: string;
  dataInicio: string;
}

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

export async function getAcompanhamento(alunoId: string): Promise<AcompanhamentoDTO> {
  const res = await apiFetch(`/api/alunos/${encodeURIComponent(alunoId)}/acompanhamento`);
  return (await res.json()) as AcompanhamentoDTO;
}
