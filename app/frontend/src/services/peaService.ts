import type {
  PeaRequestDTO,
  PeaResponseDTO,
  PeaUpdateDTO,
} from '../types/pea';
import { apiFetch } from './apiClient';

export class PeaService {
  private static baseUrl = '/api/peas';

  static async listarPorAluno(
    alunoId: string,
    signal?: AbortSignal
  ): Promise<PeaResponseDTO[]> {
    const response = await apiFetch(`${this.baseUrl}/aluno/${encodeURIComponent(alunoId)}`, { signal });
    return response.json();
  }

  static async listarPorPei(
    peiId: string,
    signal?: AbortSignal
  ): Promise<PeaResponseDTO[]> {
    const response = await apiFetch(`${this.baseUrl}/pei/${encodeURIComponent(peiId)}`, { signal });
    return response.json();
  }

  static async criar(
    dto: PeaRequestDTO
  ): Promise<PeaResponseDTO> {
    const payload: PeaRequestDTO = {
      acompanhamentoId: dto.acompanhamentoId,
      peiId: dto.peiId ? dto.peiId.trim() : null,
      disciplinaId: dto.disciplinaId ? dto.disciplinaId.trim() : null,
      componenteCurricular: dto.componenteCurricular?.trim() || null,
      semestreAno: dto.semestreAno?.trim() || null,
      docente: dto.docente?.trim() || null,
      objetivoGeral: dto.objetivoGeral.trim(),
      objetivosEspecificos: dto.objetivosEspecificos?.trim() || null,
      conteudosProgramaticos: dto.conteudosProgramaticos?.trim() || null,
      metodologia: dto.metodologia.trim(),
      avaliacao: dto.avaliacao.trim(),
      bibliografiaBasica: dto.bibliografiaBasica?.trim() || null,
      bibliografiaComplementar: dto.bibliografiaComplementar?.trim() || null,
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
      peiId: dto.peiId !== undefined ? (dto.peiId ? dto.peiId.trim() : null) : undefined,
      disciplinaId: dto.disciplinaId !== undefined ? (dto.disciplinaId ? dto.disciplinaId.trim() : null) : undefined,
      componenteCurricular:
        dto.componenteCurricular !== undefined ? (dto.componenteCurricular?.trim() || '') : undefined,
      semestreAno: dto.semestreAno !== undefined ? (dto.semestreAno?.trim() || '') : undefined,
      docente: dto.docente !== undefined ? (dto.docente?.trim() || '') : undefined,
      objetivoGeral: dto.objetivoGeral !== undefined ? dto.objetivoGeral.trim() : undefined,
      objetivosEspecificos:
        dto.objetivosEspecificos !== undefined ? (dto.objetivosEspecificos?.trim() || '') : undefined,
      conteudosProgramaticos:
        dto.conteudosProgramaticos !== undefined ? (dto.conteudosProgramaticos?.trim() || '') : undefined,
      metodologia: dto.metodologia !== undefined ? dto.metodologia.trim() : undefined,
      avaliacao: dto.avaliacao !== undefined ? dto.avaliacao.trim() : undefined,
      bibliografiaBasica: dto.bibliografiaBasica !== undefined ? (dto.bibliografiaBasica?.trim() || '') : undefined,
      bibliografiaComplementar:
        dto.bibliografiaComplementar !== undefined ? (dto.bibliografiaComplementar?.trim() || '') : undefined,
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

  // TA3.2 e TA11.3: Consulta protegida aos anexos do PEI via Bearer JWT do usuário autenticado.
  static async listarAnexosSensiveis(
    peiId: string
  ): Promise<PeaResponseDTO[]> {
    const response = await apiFetch(
      `/api/peis/${encodeURIComponent(peiId)}/anexos-sensiveis`
    );

    return response.json();
  }
}

