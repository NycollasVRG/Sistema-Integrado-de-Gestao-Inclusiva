import type { ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import { API_URL, USE_LOCAL_FALLBACK } from '../config/featureFlags';
import { encerrarSessao, lerSessao, notificarAcessoNegado, obterToken } from './authSessao';
import {
  mensagemPadraoPorStatus,
  sanitizarDetalhe,
  sanitizarProblema,
  sanitizarTitulo,
} from '../utils/mensagensErro';

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
  const padrao = mensagemPadraoPorStatus(STATUS_REDE);
  return {
    title: padrao.title,
    status: STATUS_REDE,
    detail: padrao.detail,
  };
}

function problemaPadrao(status: number, ehLogin = false): Pick<ApiProblem, 'title' | 'detail'> {
  return mensagemPadraoPorStatus(status, ehLogin);
}

export function isProblem(e: unknown): e is ApiProblem {
  if (typeof e !== 'object' || e === null) return false;
  const obj = e as Record<string, unknown>;
  return typeof obj.status === 'number' && typeof obj.title === 'string';
}

/** Identifica erros nativos de cancelamento via AbortController/AbortSignal. */
export function isAbortError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  return (e as { name?: unknown }).name === 'AbortError';
}

/** Converte qualquer valor lançado em um ProblemDetail exibível e sanitizado. */
export function toProblem(
  e: unknown,
  titulo = 'Erro inesperado',
  detalhe = 'Algo deu errado. Tente novamente.',
): ApiProblem {
  if (isProblem(e)) {
    return sanitizarProblema(e);
  }
  return {
    title: sanitizarTitulo(titulo, 'Erro inesperado'),
    status: STATUS_DESCONHECIDO,
    detail: sanitizarDetalhe(detalhe, 'Algo deu errado. Tente novamente.'),
  };
}

/** Backend indisponível (falha de rede ou 503 do proxy do Vite). */
export function isIndisponivel(e: unknown): boolean {
  return isProblem(e) && (e.status === STATUS_REDE || e.status === STATUS_INDISPONIVEL);
}

/** O fallback local só vale com a flag ligada E backend realmente indisponível. */
export function usarFallbackLocal(e: unknown): boolean {
  return USE_LOCAL_FALLBACK && isIndisponivel(e);
}

/** Rota de login: 401 aqui significa credenciais inválidas, não sessão expirada. */
function ehRotaLogin(input: string): boolean {
  return input.split('?')[0].endsWith('/auth/login');
}

async function lerProblema(res: Response, input = ''): Promise<ApiProblem> {
  let corpo: Record<string, unknown> = {};
  try {
    const texto = await res.text();
    if (texto) corpo = JSON.parse(texto) as Record<string, unknown>;
  } catch {
    // Corpo vazio ou não-JSON: usa a mensagem padrão do status.
  }
  const ehLogin = ehRotaLogin(input);
  const padrao = problemaPadrao(res.status, ehLogin);
  return sanitizarProblema(
    {
      title: (corpo.title as string) || padrao.title,
      status: res.status,
      detail: (corpo.detail as string) || padrao.detail,
      type: (corpo.type as string) || undefined,
      instance: (corpo.instance as string) || undefined,
      timestamp: (corpo.timestamp as string) || undefined,
      errors: (corpo.errors as Record<string, string>) || undefined,
      // US 08: o 409 de ata finalizada orienta a UI a abrir o formulário de termo aditivo.
      termoAditivoUri: (corpo.termoAditivoUri as string) || undefined,
    },
    ehLogin,
  );
}

/**
 * Resolve o caminho do endpoint combinando com VITE_API_URL sem duplicar o prefixo /api.
 */
export function resolveApiUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) return input;
  const cleanInput = input.startsWith('/') ? input : `/${input}`;

  if (!API_URL || API_URL === '/api') {
    return cleanInput.startsWith('/api/') || cleanInput === '/api'
      ? cleanInput
      : `/api${cleanInput}`;
  }

  const base = API_URL.replace(/\/+$/, '');
  if (base.endsWith('/api')) {
    return cleanInput.startsWith('/api/')
      ? `${base}${cleanInput.slice(4)}`
      : `${base}${cleanInput}`;
  }

  return cleanInput.startsWith('/api/')
    ? `${base}${cleanInput}`
    : `${base}/api${cleanInput}`;
}

/**
 * Tratamento global de status de segurança (compartilhado por todos os clientes HTTP):
 * - 401 (exceto login): sessão revogada/expirada (TA11.4) -> limpa storage e avisa a UI.
 * - 403: bloqueio por sigilo clínico/LGPD (TA11.2) -> abre o aviso de acesso negado.
 */
export function tratarStatusGlobal(
  status: number,
  problema: Pick<ApiProblem, 'detail'>,
  input = '',
  ignorarAcessoNegado = false,
): void {
  if (status === 401 && !ehRotaLogin(input)) {
    // Sessão expirada ou encerrada: desloga silenciosamente e redireciona ao login.
    if (lerSessao()) {
      encerrarSessao(null);
    }
  } else if (status === 403 && !ignorarAcessoNegado) {
    notificarAcessoNegado(problema.detail);
  }
}

/**
 * fetch que lança ApiProblem para falha de rede e para qualquer resposta
 * não-2xx, injeta o Bearer token da sessão e aplica o tratamento global 401/403.
 * Respostas 2xx são devolvidas ao chamador.
 */
export interface ApiFetchInit extends RequestInit {
  /**
   * Quando o 403 é uma regra de negócio esperada (ex.: trava de 24h de edição do atendimento) e não
   * um bloqueio de sigilo clínico/LGPD, o chamador trata o erro e o modal global não deve abrir.
   * O 401 (sessão revogada) continua sendo tratado globalmente.
   */
  ignorarAcessoNegadoGlobal?: boolean;
}

export async function apiFetch(input: string, init?: ApiFetchInit): Promise<Response> {
  const { ignorarAcessoNegadoGlobal = false, ...initFetch } = init ?? {};
  const headers = new Headers(initFetch.headers);
  const token = obterToken();
  if (token && !headers.has('Authorization') && !ehRotaLogin(input)) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(resolveApiUrl(input), { ...initFetch, headers });
  } catch (err: unknown) {
    if (isAbortError(err) || initFetch.signal?.aborted) {
      throw err;
    }
    throw problemaRede();
  }
  if (!res.ok) {
    const problema = await lerProblema(res, input);
    tratarStatusGlobal(res.status, problema, input, ignorarAcessoNegadoGlobal);
    throw problema;
  }
  return res;
}

