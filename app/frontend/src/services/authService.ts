import type { SessaoUsuario } from '../types/auth';
import { apiFetch } from './apiClient';
import { lerSessao, salvarSessao } from './authSessao';

/** POST /api/auth/login: autentica e persiste a sessão (JWT + dados de RBAC). */
export async function autenticar(email: string, senha: string): Promise<SessaoUsuario> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: email.trim(), senha }),
  });
  const dados = (await res.json()) as Partial<SessaoUsuario> | null;
  if (!dados || typeof dados.token !== 'string' || !dados.token.trim()) {
    throw new Error('A resposta de login não contém o token JWT.');
  }
  const sessao = dados as SessaoUsuario;
  salvarSessao(sessao);
  return sessao;
}

/**
 * GET /api/auth/me: revalida a sessão armazenada. Se o acesso foi revogado
 * enquanto o navegador estava fechado, o 401 é tratado pelo apiClient (logout global).
 * Retorna a sessão atualizada com os dados vigentes do servidor.
 */
export async function revalidarSessao(): Promise<SessaoUsuario | null> {
  const atual = lerSessao();
  if (!atual) return null;
  const res = await apiFetch('/api/auth/me');
  const me = (await res.json()) as Partial<SessaoUsuario> & { id?: string };
  const atualizada: SessaoUsuario = {
    ...atual,
    userId: me.id ?? atual.userId,
    nome: me.nome ?? atual.nome,
    email: me.email ?? atual.email,
    role: me.role ?? atual.role,
    nivelRestricao: me.nivelRestricao ?? atual.nivelRestricao,
    autorizacaoSaude: me.autorizacaoSaude ?? atual.autorizacaoSaude,
    tokenVersion: me.tokenVersion ?? atual.tokenVersion,
  };
  salvarSessao(atualizada);
  return atualizada;
}
