import type {
  PeaRequestDTO,
  PeaResponseDTO,
  PeaUpdateDTO,
  PerfilUsuario,
} from '../types/pea';
import { apiFetch } from './apiClient';

export class PeaService {
  private static baseUrl = '/api/peas';

  private static defaultUserId =
    '99999999-9999-9999-9999-999999999999';

  static async listarPorAluno(
    alunoId: string
  ): Promise<PeaResponseDTO[]> {
    const response = await apiFetch(`${this.baseUrl}/aluno/${alunoId}`);

    return response.json();
  }

  static async criar(
    dto: PeaRequestDTO,
    usuarioId = this.defaultUserId
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
        'X-User-Id': usuarioId,
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  static async atualizar(
    id: string,
    dto: PeaUpdateDTO,
    usuarioId = this.defaultUserId
  ): Promise<PeaResponseDTO> {
    const payload: PeaUpdateDTO = {
      disciplinaId: dto.disciplinaId !== undefined ? (dto.disciplinaId ? dto.disciplinaId.trim() : null) : undefined,
      objetivoGeral: dto.objetivoGeral !== undefined ? dto.objetivoGeral.trim() : undefined,
      metodologia: dto.metodologia !== undefined ? dto.metodologia.trim() : undefined,
      avaliacao: dto.avaliacao !== undefined ? dto.avaliacao.trim() : undefined,
    };

    const response = await apiFetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': usuarioId,
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  // TA3.2: Consulta protegida aos anexos do PEI.
  // Recebe o ID de um PEI, nunca o ID de um PEA.
  // A autorização é decidida pelo Backend (deny by default): o front sempre
  // faz a requisição real com X-User-Perfil e exibe o 403 recebido.
  static async listarAnexosSensiveis(
    peiId: string,
    perfil: PerfilUsuario
  ): Promise<PeaResponseDTO[]> {
    const response = await apiFetch(
      `/api/peis/${peiId}/anexos-sensiveis`,
      {
        headers: {
          'X-User-Perfil': perfil,
        },
      }
    );

    return response.json();
  }
}
