import type {
  PeaRequestDTO,
  PeaResponseDTO,
  PeaUpdateDTO,
  PerfilUsuario,
} from '../types/pea';
import { apiFetch } from './apiClient';

export class PeaService {
  private static baseUrl = '/api/peas';

  static async listarPorAluno(
    alunoId: string
  ): Promise<PeaResponseDTO[]> {
    const response = await apiFetch(`${this.baseUrl}/aluno/${encodeURIComponent(alunoId)}`);
    return response.json();
  }

  static async criar(
    dto: PeaRequestDTO
  ): Promise<PeaResponseDTO> {
    const payload: PeaRequestDTO = {
      acompanhamentoId: dto.acompanhamentoId,
      disciplinaId: dto.disciplinaId ? dto.disciplinaId.trim() : null,
      objetivoGeral: dto.objetivoGeral.trim(),
      metodologia: dto.metodologia.trim(),
      avaliacao: dto.avaliacao.trim(),
    };

    const response = await apiFetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  static async atualizar(
    id: string,
    dto: PeaUpdateDTO
  ): Promise<PeaResponseDTO> {
    const payload: PeaUpdateDTO = {
      disciplinaId: dto.disciplinaId !== undefined ? (dto.disciplinaId ? dto.disciplinaId.trim() : null) : undefined,
      objetivoGeral: dto.objetivoGeral !== undefined ? dto.objetivoGeral.trim() : undefined,
      metodologia: dto.metodologia !== undefined ? dto.metodologia.trim() : undefined,
      avaliacao: dto.avaliacao !== undefined ? dto.avaliacao.trim() : undefined,
    };

    const response = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  // TA3.2: Consulta protegida aos anexos do PEI.
  static async listarAnexosSensiveis(
    peiId: string,
    perfil?: PerfilUsuario
  ): Promise<PeaResponseDTO[]> {
    const headers: Record<string, string> = {};
    if (perfil) {
      headers['X-User-Perfil'] = perfil;
    }
    const response = await apiFetch(
      `/api/peis/${encodeURIComponent(peiId)}/anexos-sensiveis`,
      { headers }
    );

    return response.json();
  }
}
