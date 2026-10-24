import type { ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import { API_URL, USE_LOCAL_FALLBACK } from '../config/featureFlags';

/**
 * Cliente HTTP único para os serviços (Estudo de Caso, PEI, PEA, Timeline).
 * Garante o mesmo tratamento de erro em todas as telas: qualquer resposta
 * não-2xx ou falha de rede é lançada como um ProblemDetail (RFC 9457).
 */
export type ApiProblem = ProblemDetailRFC9457;

export const STATUS_REDE = 0;
export const STATUS_DESCONHECIDO = -1;
const STATUS_INDISPONIVEL = 503;

export function problemaRede(): ApiProblem {
  return {
    title: 'Servidor indisponível',
    status: STATUS_REDE,
    detail:
      'Não foi possível se comunicar com o servidor. Verifique sua conexão e tente novamente.',
  };
}

function problemaPadrao(status: number): Pick<ApiProblem, 'title' | 'detail'> {
  switch (status) {
    case 400:
      return { title: 'Requisição inválida', detail: 'Os dados enviados são inválidos.' };
    case 401:
      return { title: 'Sessão expirada', detail: 'Faça login novamente para continuar.' };
    case 403:
      return { title: 'Acesso negado', detail: 'Você não possui permissão para executar esta ação.' };
    case 404:
      return { title: 'Recurso não encontrado', detail: 'O registro solicitado não foi encontrado.' };
    case STATUS_INDISPONIVEL:
      return { title: 'Servidor indisponível', detail: 'O servidor não está respondendo. Tente novamente em instantes.' };
    default:
      return status >= 500
        ? { title: 'Erro no servidor', detail: 'Ocorreu um erro interno. Tente novamente em instantes.' }
        : { title: 'Erro na requisição', detail: 'Não foi possível concluir a operação.' };
  }
}

export function isProblem(e: unknown): e is ApiProblem {
  if (typeof e !== 'object' || e === null) return false;
  const obj = e as Record<string, unknown>;
  return typeof obj.status === 'number' && typeof obj.title === 'string';
}

/** Converte qualquer valor lançado em um ProblemDetail exibível. */
export function toProblem(e: unknown, titulo = 'Erro inesperado', detalhe = 'Ocorreu um erro inesperado.'): ApiProblem {
  if (isProblem(e)) return e;
  return { title: titulo, status: STATUS_DESCONHECIDO, detail: detalhe };
}

/** Backend indisponível (falha de rede ou 503 do proxy do Vite). */
export function isIndisponivel(e: unknown): boolean {
  return isProblem(e) && (e.status === STATUS_REDE || e.status === STATUS_INDISPONIVEL);
}

/** O fallback local só vale com a flag ligada E backend realmente indisponível. */
export function usarFallbackLocal(e: unknown): boolean {
  return USE_LOCAL_FALLBACK && isIndisponivel(e);
}

async function lerProblema(res: Response): Promise<ApiProblem> {
  let corpo: Record<string, unknown> = {};
  try {
    const texto = await res.text();
    if (texto) corpo = JSON.parse(texto) as Record<string, unknown>;
  } catch {
    // Corpo vazio ou não-JSON: usa a mensagem padrão do status.
  }
  const padrao = problemaPadrao(res.status);
  return {
    title: (corpo.title as string) || padrao.title,
    status: res.status,
    detail: (corpo.detail as string) || padrao.detail,
    instance: (corpo.instance as string) || undefined,
    errors: (corpo.errors as Record<string, string>) || undefined,
  };
}

/**
 * Resolve o caminho do endpoint combinando com VITE_API_URL sem duplicar o prefixo /api.
 */
export function resolveApiUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) return input;
  if (!API_URL || API_URL === '/api') return input;
  if (API_URL.endsWith('/api') && input.startsWith('/api/')) {
    return `${API_URL}${input.slice(4)}`;
  }
  return `${API_URL}${input.startsWith('/') ? input : `/${input}`}`;
}

/**
 * fetch que lança ApiProblem para falha de rede e para qualquer resposta
 * não-2xx. Respostas 2xx são devolvidas ao chamador.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(resolveApiUrl(input), init);
  } catch {
    throw problemaRede();
  }
  if (!res.ok) {
    throw await lerProblema(res);
  }
  return res;
}

