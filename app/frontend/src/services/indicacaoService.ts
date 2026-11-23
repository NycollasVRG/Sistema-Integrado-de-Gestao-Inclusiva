import type {
  IndicacaoRequestDTO,
  IndicacaoResponseDTO,
  StatusIndicacao,
} from '../types/indicacao';
import { apiFetch } from './apiClient';

/**
 * Cliente da US 10. O 403 aqui é falta de permissão do perfil (RBAC), não bloqueio de sigilo
 * clínico/LGPD; por isso o modal global de acesso negado é suprimido e o erro é exibido na tela.
 */
const OPCOES_BASE = { ignorarAcessoNegadoGlobal: true } as const;

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

function normalizar(indicacao: IndicacaoResponseDTO): IndicacaoResponseDTO {
  return {
    ...indicacao,
    disciplinasObservadas: indicacao.disciplinasObservadas ?? [],
    justificativaDecisao: indicacao.justificativaDecisao ?? null,
    decididoPor: indicacao.decididoPor ?? null,
    decididoEm: indicacao.decididoEm ?? null,
    estudoDeCasoId: indicacao.estudoDeCasoId ?? null,
    solicitanteNome: indicacao.solicitanteNome ?? null,
    statusAluno: indicacao.statusAluno ?? null,
  };
}

export class IndicacaoService {
  private static baseUrl = '/api/indicacoes';

  /** TA10.1 / TA10.2: registra a indicação; o back-end move o estudante para EM_TRIAGEM. */
  static async criar(dto: IndicacaoRequestDTO, signal?: AbortSignal): Promise<IndicacaoResponseDTO> {
    const res = await apiFetch(this.baseUrl, {
      ...OPCOES_BASE,
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        alunoId: dto.alunoId,
        justificativaPedagogica: dto.justificativaPedagogica.trim(),
        disciplinasObservadas: dto.disciplinasObservadas.map((d) => d.trim()).filter(Boolean),
      }),
      signal,
    });
    return normalizar(await res.json());
  }

  static async listar(status?: StatusIndicacao, signal?: AbortSignal): Promise<IndicacaoResponseDTO[]> {
    const query = status ? `?${new URLSearchParams({ status })}` : '';
    const res = await apiFetch(`${this.baseUrl}${query}`, { ...OPCOES_BASE, signal });
    const lista: IndicacaoResponseDTO[] = await res.json();
    return lista.map(normalizar);
  }

  static async listarPorAluno(alunoId: string, signal?: AbortSignal): Promise<IndicacaoResponseDTO[]> {
    const res = await apiFetch(`${this.baseUrl}/aluno/${encodeURIComponent(alunoId)}`, {
      ...OPCOES_BASE,
      signal,
    });
    const lista: IndicacaoResponseDTO[] = await res.json();
    return lista.map(normalizar);
  }

  /** TA10.3: aprova e inicia o Estudo de Caso (rascunho) vinculado à indicação. */
  static async aprovar(id: string, justificativa?: string): Promise<IndicacaoResponseDTO> {
    const texto = justificativa?.trim();
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}/aprovar`, {
      ...OPCOES_BASE,
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(texto ? { justificativaDecisao: texto } : {}),
    });
    return normalizar(await res.json());
  }

  /** TA10.3: rejeita exigindo justificativa documentada. */
  static async rejeitar(id: string, justificativa: string): Promise<IndicacaoResponseDTO> {
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}/rejeitar`, {
      ...OPCOES_BASE,
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({ justificativaDecisao: justificativa.trim() }),
    });
    return normalizar(await res.json());
  }
}
