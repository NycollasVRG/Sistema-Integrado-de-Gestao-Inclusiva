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
      habilidadesInteresses: dto.habilidadesInteresses.trim(),
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
      habilidadesInteresses: dto.habilidadesInteresses !== undefined ? dto.habilidadesInteresses.trim() : undefined,
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
