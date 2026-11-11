import type { AlunoHeaderData } from '../types/alunoHeader';
import type { EstudanteResumo } from '../types/gestaoEstudantes';
import { GestaoEstudantesService } from './gestaoEstudantesService';
import { apiFetch } from './apiClient';

export interface AcompanhamentoDTO {
  id: string;
  alunoId: string;
  dataInicio: string;
}

export function estudanteParaHeader(aluno: EstudanteResumo): AlunoHeaderData {
  return {
    id: aluno.id,
    nome: aluno.nomeCompleto,
    fotoUrl: null,
    matricula: aluno.matricula,
    curso: aluno.curso,
    tagsDificuldade: aluno.tagsDificuldade.map((tag) => tag.nome),
  };
}

// US12 / TA12.3: consulta sempre o estudante escolhido, em vez do mock fixo.
export async function getAlunoHeader(alunoId: string, signal?: AbortSignal): Promise<AlunoHeaderData> {
  const aluno = await GestaoEstudantesService.buscarPorId(alunoId, signal);
  return estudanteParaHeader(aluno);
}

export async function getAcompanhamento(alunoId: string, signal?: AbortSignal): Promise<AcompanhamentoDTO> {
  const res = await apiFetch(`/api/alunos/${encodeURIComponent(alunoId)}/acompanhamento`, { signal });
  return (await res.json()) as AcompanhamentoDTO;
}
