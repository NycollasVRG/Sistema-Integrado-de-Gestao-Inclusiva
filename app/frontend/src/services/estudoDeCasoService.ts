import type {
  EstudoDeCasoRequestDTO,
  EstudoDeCasoResponseDTO,
  EstudoDeCasoUpdateDTO,
} from '../types/estudoDeCaso';
import { apiFetch } from './apiClient';

function normalizarEstudo(estudo: EstudoDeCasoResponseDTO): EstudoDeCasoResponseDTO {
  return {
    ...estudo,
    diagnosticoInicial: estudo.diagnosticoInicial ?? null,
    indicadoresIds: estudo.indicadoresIds ?? [],
  };
}

export class EstudoDeCasoService {
  private static baseUrl = '/api/estudos-de-caso';

  static async buscarPorId(id: string): Promise<EstudoDeCasoResponseDTO> {
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`);
    return normalizarEstudo(await res.json());
  }

  static async listarPorAluno(alunoId: string): Promise<EstudoDeCasoResponseDTO[]> {
    const res = await apiFetch(`${this.baseUrl}/aluno/${encodeURIComponent(alunoId)}`);
    const lista: EstudoDeCasoResponseDTO[] = await res.json();
    return lista.map(normalizarEstudo);
  }

  static async criar(dto: EstudoDeCasoRequestDTO): Promise<EstudoDeCasoResponseDTO> {
    const payload: EstudoDeCasoRequestDTO = {
      ...dto,
      diagnosticoInicial: dto.diagnosticoInicial ? dto.diagnosticoInicial.trim() : null,
    };
    const res = await apiFetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return normalizarEstudo(await res.json());
  }

  static async atualizar(
    id: string,
    dto: EstudoDeCasoUpdateDTO,
  ): Promise<EstudoDeCasoResponseDTO> {
    const payload: EstudoDeCasoUpdateDTO = {
      ...dto,
      diagnosticoInicial: dto.diagnosticoInicial !== undefined ? (dto.diagnosticoInicial ? dto.diagnosticoInicial.trim() : null) : undefined,
    };
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return normalizarEstudo(await res.json());
  }

  static async excluir(id: string): Promise<void> {
    await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}
