import type {
  PeiRequestDTO,
  PeiResponseDTO,
  PeiUpdateDTO,
} from '../types/pei';
import { apiFetch } from './apiClient';
import { getAcompanhamento, type AcompanhamentoDTO } from './alunoService';

export class PeiService {
  private static baseUrl = '/api/peis';

  static async buscarAcompanhamentoPorAluno(alunoId: string, signal?: AbortSignal): Promise<AcompanhamentoDTO> {
    return getAcompanhamento(alunoId, signal);
  }

  static async listarPorAluno(alunoId: string, signal?: AbortSignal): Promise<PeiResponseDTO[]> {
    const res = await apiFetch(`${this.baseUrl}/aluno/${encodeURIComponent(alunoId)}`, { signal });
    return await res.json();
  }

  static async criar(dto: PeiRequestDTO): Promise<PeiResponseDTO> {
    const payload: PeiRequestDTO = {
      acompanhamentoId: dto.acompanhamentoId,
      semestreAno: dto.semestreAno?.trim() || null,
      historicoEstudante: dto.historicoEstudante?.trim() || null,
      necessidadesEspecificas: dto.necessidadesEspecificas?.trim() || null,
      habilidadesInteresses: dto.habilidadesInteresses.trim(),
      dificuldadesApresentadas: dto.dificuldadesApresentadas?.trim() || null,
      propostasAdaptacoes: dto.propostasAdaptacoes.trim(),
    };
    const res = await apiFetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  static async atualizar(id: string, dto: PeiUpdateDTO): Promise<PeiResponseDTO> {
    const payload: PeiUpdateDTO = {
      semestreAno: dto.semestreAno !== undefined ? (dto.semestreAno?.trim() || '') : undefined,
      historicoEstudante: dto.historicoEstudante !== undefined ? (dto.historicoEstudante?.trim() || '') : undefined,
      necessidadesEspecificas:
        dto.necessidadesEspecificas !== undefined ? (dto.necessidadesEspecificas?.trim() || '') : undefined,
      habilidadesInteresses: dto.habilidadesInteresses !== undefined ? dto.habilidadesInteresses.trim() : undefined,
      dificuldadesApresentadas:
        dto.dificuldadesApresentadas !== undefined ? (dto.dificuldadesApresentadas?.trim() || '') : undefined,
      propostasAdaptacoes: dto.propostasAdaptacoes !== undefined ? dto.propostasAdaptacoes.trim() : undefined,
    };
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  static async inativar(id: string): Promise<void> {
    await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}

