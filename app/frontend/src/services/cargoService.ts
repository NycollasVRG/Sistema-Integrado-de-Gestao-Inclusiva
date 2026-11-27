import { apiFetch } from './apiClient';
import type { CargoDTO, CargoRequestDTO } from '../types/cargo';

export interface FiltroCargosParams {
  apenasAtivos?: boolean;
  busca?: string;
}

export const CargoService = {
  async listar(filtros?: FiltroCargosParams, signal?: AbortSignal): Promise<CargoDTO[]> {
    const params = new URLSearchParams();
    if (filtros?.apenasAtivos !== undefined) {
      params.set('apenasAtivos', String(filtros.apenasAtivos));
    }
    if (filtros?.busca && filtros.busca.trim()) {
      params.set('busca', filtros.busca.trim());
    }
    const query = params.toString();
    const res = await apiFetch(query ? `/api/cargos?${query}` : '/api/cargos', { signal });
    return (await res.json()) as CargoDTO[];
  },

  async buscarPorId(id: string, signal?: AbortSignal): Promise<CargoDTO> {
    const res = await apiFetch(`/api/cargos/${encodeURIComponent(id)}`, { signal });
    return (await res.json()) as CargoDTO;
  },

  async criar(payload: CargoRequestDTO): Promise<CargoDTO> {
    const res = await apiFetch('/api/cargos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (await res.json()) as CargoDTO;
  },

  async atualizar(id: string, payload: CargoRequestDTO): Promise<CargoDTO> {
    const res = await apiFetch(`/api/cargos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return (await res.json()) as CargoDTO;
  },

  async alterarStatus(id: string, ativo: boolean): Promise<CargoDTO> {
    const res = await apiFetch(`/api/cargos/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo }),
    });
    return (await res.json()) as CargoDTO;
  },

  async excluir(id: string): Promise<void> {
    await apiFetch(`/api/cargos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
