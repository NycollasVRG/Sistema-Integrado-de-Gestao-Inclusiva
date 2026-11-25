import type { AlertaPedagogicoDTO } from '../types/alertaDashboard';
import { apiFetch } from './apiClient';

/**
 * Cliente da US 05 (Dashboard de Alertas). O 403 aqui é falta de permissão do perfil (RBAC),
 * não bloqueio de sigilo clínico/LGPD; por isso o modal global de acesso negado é suprimido
 * e o erro é exibido na própria tela.
 */
const OPCOES_BASE = { ignorarAcessoNegadoGlobal: true } as const;

function normalizar(alerta: AlertaPedagogicoDTO): AlertaPedagogicoDTO {
  return {
    ...alerta,
    unidade: alerta.unidade ?? null,
    curso: alerta.curso ?? null,
    turma: alerta.turma ?? null,
    tratado: alerta.tratado === true,
    tratadoPor: alerta.tratadoPor ?? null,
    tratadoEm: alerta.tratadoEm ?? null,
  };
}

export class DashboardAlertaService {
  private static baseUrl = '/api/dashboard/alertas';

  /**
   * Lista os alertas ativos (`tratado=false`) ou o log de histórico (`tratado=true`).
   * Os filtros por Unidade/Curso/Turma (TA5.3) são aplicados na tela, sobre esta lista.
   */
  static async listar(tratado: boolean, signal?: AbortSignal): Promise<AlertaPedagogicoDTO[]> {
    const query = new URLSearchParams({ tratado: String(tratado) });
    const res = await apiFetch(`${this.baseUrl}?${query}`, { ...OPCOES_BASE, signal });
    const lista: AlertaPedagogicoDTO[] = await res.json();
    return lista.map(normalizar);
  }

  /** TA5.4: marca o alerta como "Ciente/Tratado" (o back-end registra autor e data/hora). */
  static async tratar(id: string): Promise<AlertaPedagogicoDTO> {
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}/tratar`, {
      ...OPCOES_BASE,
      method: 'PATCH',
      headers: { Accept: 'application/json' },
    });
    return normalizar(await res.json());
  }
}
