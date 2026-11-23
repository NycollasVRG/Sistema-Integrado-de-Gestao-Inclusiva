import type { AuditLogDTO } from './dossie';

/** Resposta de GET /api/admin/auditoria (AuditoriaListaResponseDTO do backend). */
export interface AuditoriaListaDTO {
  logs: AuditLogDTO[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface AuditoriaFiltros {
  pagina?: number;
  tamanho?: number;
  acao?: string;
  entidade?: string;
  usuarioId?: string;
}
