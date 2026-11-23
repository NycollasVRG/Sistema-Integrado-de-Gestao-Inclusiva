import { apiFetch } from './apiClient';
import type { AuditoriaFiltros, AuditoriaListaDTO } from '../types/auditoria';

/**
 * Consulta somente-leitura da trilha imutável de auditoria (US 06 / TA6.1 / TA6.3).
 * Exige ROLE_ADMIN no backend; nenhuma operação de escrita é exposta aqui.
 */
export const AuditoriaService = {
  async listar(
    filtros: AuditoriaFiltros = {},
    signal?: AbortSignal
  ): Promise<AuditoriaListaDTO> {
    const params = new URLSearchParams();
    if (filtros.pagina !== undefined) params.set('pagina', String(filtros.pagina));
    if (filtros.tamanho !== undefined) params.set('tamanho', String(filtros.tamanho));
    if (filtros.acao?.trim()) params.set('acao', filtros.acao.trim());
    if (filtros.entidade?.trim()) params.set('entidade', filtros.entidade.trim());
    if (filtros.usuarioId?.trim()) params.set('usuarioId', filtros.usuarioId.trim());

    const query = params.toString();
    const res = await apiFetch(`/api/admin/auditoria${query ? `?${query}` : ''}`, { signal });
    return (await res.json()) as AuditoriaListaDTO;
  },
};
