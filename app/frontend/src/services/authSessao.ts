import type { SessaoUsuario } from '../types/auth';

/**
 * Persistência da sessão (JWT) e barramento de eventos globais de segurança.
 * Módulo sem dependências de React para poder ser usado pelo cliente HTTP.
 */
export const CHAVE_SESSAO = 'sigi_clai_sessao';

export function lerSessao(): SessaoUsuario | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto) as SessaoUsuario;
    return sessao && typeof sessao.token === 'string' && sessao.token ? sessao : null;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao: SessaoUsuario): void {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function limparSessao(): void {
  localStorage.removeItem(CHAVE_SESSAO);
}

export function obterToken(): string | null {
  return lerSessao()?.token ?? null;
}

type Ouvinte<T> = (valor: T) => void;

const ouvintesSessaoEncerrada = new Set<Ouvinte<string>>();
const ouvintesAcessoNegado = new Set<Ouvinte<string | undefined>>();

/** Registra callback para quando a sessão for encerrada pelo servidor (401). */
export function aoEncerrarSessao(ouvinte: Ouvinte<string>): () => void {
  ouvintesSessaoEncerrada.add(ouvinte);
  return () => {
    ouvintesSessaoEncerrada.delete(ouvinte);
  };
}

/** TA11.4: limpa imediatamente o storage e avisa a UI para redirecionar ao login. */
export function encerrarSessao(motivo: string): void {
  limparSessao();
  ouvintesSessaoEncerrada.forEach((ouvinte) => ouvinte(motivo));
}

/** Registra callback para bloqueios de sigilo clínico/LGPD (403). */
export function aoAcessoNegado(ouvinte: Ouvinte<string | undefined>): () => void {
  ouvintesAcessoNegado.add(ouvinte);
  return () => {
    ouvintesAcessoNegado.delete(ouvinte);
  };
}

export function notificarAcessoNegado(detalhe?: string): void {
  ouvintesAcessoNegado.forEach((ouvinte) => ouvinte(detalhe));
}
