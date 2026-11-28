import type { ProblemDetailRFC9457 } from '../types/estudoDeCaso';

const PADRAO_JARGAO_TECNICO =
  /\b(jwt|token|bearer|oauth|uuid|rbac|role_[a-z_]+|super_restricao|restricao_moderada|acesso_funcional|api_key|gemini_api_key|tokenversion|aes-256|append-only|rfc\s*9457|json|sql|http|endpoint|stack|exception|payload|bytes|banco de dados)\b|(\bta\d+\.\d+\b|\bus\s*\d+\b|a api |da api|pela api|na resposta da api|versão do token|com o id:\s*[0-9a-f-]{8,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

const TITULOS_GENERICOS: Record<string, string> = {
  'erro de regra de negócio': 'Aviso',
  'erro de validação de campos': 'Dados inválidos',
  'recurso não encontrado': 'Não encontrado',
  'conflito de dados': 'Não foi possível salvar',
  'conflito de recursos': 'Não foi possível salvar',
  'falha na autenticação': 'Não foi possível entrar',
  'não autorizado': 'Acesso necessário',
  'sessão revogada': 'Sessão encerrada',
  'acesso negado': 'Acesso restrito',
  'tempo limite excedido na adaptação via ia': 'Tempo esgotado',
  'serviço de adaptação via ia indisponível': 'Serviço indisponível',
  'ata finalizada – imutável': 'Ata finalizada',
};

export function mensagemPadraoPorStatus(
  status: number,
  ehLogin = false,
): Pick<ProblemDetailRFC9457, 'title' | 'detail'> {
  if (status === 401 && ehLogin) {
    return {
      title: 'Não foi possível entrar',
      detail: 'E-mail ou senha incorretos.',
    };
  }

  switch (status) {
    case 0:
      return {
        title: 'Sem conexão',
        detail: 'Não foi possível conectar. Tente novamente.',
      };
    case 400:
      return {
        title: 'Dados inválidos',
        detail: 'Verifique as informações preenchidas e tente novamente.',
      };
    case 401:
      return {
        title: 'Sessão encerrada',
        detail: 'Faça login novamente para continuar.',
      };
    case 403:
      return {
        title: 'Acesso restrito',
        detail: 'Você não tem permissão para realizar esta ação.',
      };
    case 404:
      return {
        title: 'Não encontrado',
        detail: 'A informação solicitada não foi encontrada.',
      };
    case 409:
      return {
        title: 'Não foi possível continuar',
        detail: 'Não foi possível concluir a alteração solicitada.',
      };
    case 503:
      return {
        title: 'Serviço indisponível',
        detail: 'O serviço está indisponível no momento. Tente novamente em instantes.',
      };
    case 504:
      return {
        title: 'Tempo esgotado',
        detail: 'A operação demorou mais que o esperado. Tente novamente.',
      };
    default:
      return status >= 500
        ? {
            title: 'Erro inesperado',
            detail: 'Algo deu errado. Tente novamente em instantes.',
          }
        : {
            title: 'Não foi possível concluir',
            detail: 'Não foi possível concluir a operação. Tente novamente.',
          };
  }
}

export function contemJargaoTecnico(texto?: string | null): boolean {
  if (!texto) return false;
  return PADRAO_JARGAO_TECNICO.test(texto);
}

export function sanitizarTitulo(titulo: string | undefined, fallback: string): string {
  const limpo = titulo?.trim();
  if (!limpo) return fallback;
  const mapeado = TITULOS_GENERICOS[limpo.toLocaleLowerCase('pt-BR')];
  if (mapeado) return mapeado;
  if (contemJargaoTecnico(limpo)) return fallback;
  return limpo;
}

export function sanitizarDetalhe(
  detalhe: string | undefined,
  fallback: string,
  status?: number,
): string {
  const limpo = detalhe?.trim();
  if (!limpo) return fallback;
  if (status !== undefined && status >= 500 && status !== 503 && status !== 504) {
    return fallback;
  }
  if (contemJargaoTecnico(limpo)) {
    return fallback;
  }
  if (limpo.toLocaleLowerCase('pt-BR').startsWith('credenciais inválidas')) {
    return 'E-mail ou senha incorretos.';
  }
  if (limpo.toLocaleLowerCase('pt-BR').startsWith('autenticação obrigatória')) {
    return 'Faça login novamente para continuar.';
  }
  return limpo;
}

export function sanitizarProblema(
  problema: ProblemDetailRFC9457,
  ehLogin = false,
): ProblemDetailRFC9457 {
  const padrao = mensagemPadraoPorStatus(problema.status, ehLogin);
  return {
    ...problema,
    title: sanitizarTitulo(problema.title, padrao.title),
    detail: sanitizarDetalhe(problema.detail, padrao.detail, problema.status),
  };
}

export function sanitizarMensagemTexto(
  mensagem: string | undefined | null,
  fallback = 'Não foi possível concluir a operação. Tente novamente.',
): string {
  return sanitizarDetalhe(mensagem ?? undefined, fallback);
}
