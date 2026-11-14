import type {
  EstudoDeCasoRequestDTO,
  EstudoDeCasoResponseDTO,
  EstudoDeCasoUpdateDTO,
} from '../types/estudoDeCaso';
import { apiFetch } from './apiClient';

function normalizarTextoOpcional(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const limpo = valor.trim();
  return limpo.length > 0 ? limpo : null;
}

function normalizarEstudo(estudo: EstudoDeCasoResponseDTO): EstudoDeCasoResponseDTO {
  return {
    ...estudo,
    diagnosticoInicial: estudo.diagnosticoInicial ?? null,
    historico: estudo.historico ?? null,
    indicadoresIds: estudo.indicadoresIds ?? [],
    versao: estudo.versao ?? 1,
    estudoOrigemId: estudo.estudoOrigemId ?? null,
    atualizadoPor: estudo.atualizadoPor ?? null,
  };
}

export class EstudoDeCasoService {
  private static baseUrl = '/api/estudos-de-caso';

  static async buscarPorId(id: string, signal?: AbortSignal): Promise<EstudoDeCasoResponseDTO> {
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, { signal });
    return normalizarEstudo(await res.json());
  }

  static async listarPorAluno(alunoId: string, signal?: AbortSignal): Promise<EstudoDeCasoResponseDTO[]> {
    const res = await apiFetch(`${this.baseUrl}/aluno/${encodeURIComponent(alunoId)}`, { signal });
    const lista: EstudoDeCasoResponseDTO[] = await res.json();
    return lista.map(normalizarEstudo);
  }

  static async criar(dto: EstudoDeCasoRequestDTO): Promise<EstudoDeCasoResponseDTO> {
    const payload: EstudoDeCasoRequestDTO = {
      ...dto,
      diagnosticoInicial: normalizarTextoOpcional(dto.diagnosticoInicial),
      historico:
        dto.historico !== undefined ? normalizarTextoOpcional(dto.historico) : undefined,
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

  /**
   * Cria uma nova versão de avaliação do Estudo de Caso para o estudante.
   * No backend, POST /api/estudos-de-caso incrementa automaticamente a versão,
   * vincula estudoOrigemId e encerra qualquer versão ATIVO anterior (TA2.4).
   */
  static async criarNovaAvaliacao(dto: EstudoDeCasoRequestDTO): Promise<EstudoDeCasoResponseDTO> {
    return this.criar(dto);
  }

  static async atualizar(
    id: string,
    dto: EstudoDeCasoUpdateDTO,
  ): Promise<EstudoDeCasoResponseDTO> {
    const payload: EstudoDeCasoUpdateDTO = {
      ...dto,
      diagnosticoInicial:
        dto.diagnosticoInicial !== undefined
          ? normalizarTextoOpcional(dto.diagnosticoInicial)
          : undefined,
      historico:
        dto.historico !== undefined ? normalizarTextoOpcional(dto.historico) : undefined,
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

  /**
   * Reabre um Estudo de Caso concluído, revertendo seu status para RASCUNHO
   * e registrando metadados de auditoria do usuário responsável (TA2.2).
   */
  static async reabrir(id: string): Promise<EstudoDeCasoResponseDTO> {
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}/reabrir`, {
      method: 'PATCH',
    });
    return normalizarEstudo(await res.json());
  }

  static async excluir(id: string): Promise<void> {
    await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}
