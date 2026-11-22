import type { NotificacaoResponseDTO } from '../types/notificacao';
import { apiFetch } from './apiClient';

const EVENTO_ATUALIZACAO = 'sigi:notificacoes-atualizadas';

/** Infraestrutura reutilizável de notificações (US 01, US 03, US 08 e US 10). */
export class NotificacaoService {
  private static baseUrl = '/api/notificacoes';

  static async listar(
    perfil = 'COORDENADOR',
    apenasNaoLidas = false,
    signal?: AbortSignal
  ): Promise<NotificacaoResponseDTO[]> {
    const params = new URLSearchParams({
      perfil,
      apenasNaoLidas: String(apenasNaoLidas),
    });
    const res = await apiFetch(`${this.baseUrl}?${params.toString()}`, { signal });
    return (await res.json()) as NotificacaoResponseDTO[];
  }

  static async marcarComoLida(id: string): Promise<NotificacaoResponseDTO> {
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}/ler`, {
      method: 'PATCH',
    });
    return (await res.json()) as NotificacaoResponseDTO;
  }
}

/** Avisa ao cabeçalho que uma notificação foi gerada e a lista deve ser recarregada. */
export function notificarAlteracaoNotificacoes(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(EVENTO_ATUALIZACAO));
}

export function registrarAlteracaoNotificacoes(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENTO_ATUALIZACAO, listener);
  return () => window.removeEventListener(EVENTO_ATUALIZACAO, listener);
}

/**
 * O back-end devolve um caminho de API no `linkReferencia`. A navegação da SPA
 * precisa da rota de tela correspondente, com o aluno da notificação (TA3.3).
 */
export function rotaPeiDaNotificacao(linkReferencia?: string | null): string | null {
  if (!linkReferencia) return null;
  const match = linkReferencia.match(/\/api\/peis\/aluno\/([0-9a-fA-F-]{36})/);
  return match ? `/estudantes/${match[1]}/pei` : null;
}
