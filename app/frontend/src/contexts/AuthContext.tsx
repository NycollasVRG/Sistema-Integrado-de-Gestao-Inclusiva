import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SessaoUsuario } from '../types/auth';
import { autenticar, revalidarSessao } from '../services/authService';
import { aoEncerrarSessao, CHAVE_SESSAO, lerSessao, limparSessao } from '../services/authSessao';
import { removerRascunhosDoUsuario } from '../services/rascunhoAtendimentoService';
import { podeAdaptarDua } from '../utils/dua';
import { podeGerirTriagem, podeIndicarEstudante } from '../utils/indicacao';

interface AuthContextValue {
  sessao: SessaoUsuario | null;
  autenticado: boolean;
  /** Motivo do encerramento forçado da sessão (ex.: acesso revogado), exibido no login. */
  avisoSessao: string | null;
  limparAviso: () => void;
  login: (email: string, senha: string) => Promise<SessaoUsuario>;
  logout: () => void;
  isAdmin: boolean;
  isCoordenador: boolean;
  isAcessoFuncional: boolean;
  /** TA11.3: Restrição Moderada ou superior enxerga histórico familiar/socioemocional. */
  podeAcessarDadosSensiveis: boolean;
  /** TA11.2: diagnósticos neuropsicológicos exigem SUPER_RESTRICAO e autorização de saúde. */
  podeBaixarLaudo: boolean;
  /** US 10: professores, coordenadores e equipe CLAI podem indicar estudantes para triagem. */
  podeIndicarEstudante: boolean;
  /** US 10: painel de triagem restrito à equipe CLAI/Coordenação (Restrição Moderada ou superior). */
  podeGerirTriagem: boolean;
  /** US 05: Dashboard de Alertas restrito à Restrição Moderada ou superior (espelha o back-end). */
  podeVerDashboard: boolean;
  /** US 08: espelha @rbacGuard.temRestricaoModeradaOuSuperior() para atas de reunião. */
  podeGerirAtas: boolean;
  /** US 07: espelha o @PreAuthorize do POST /api/dua/adaptar. */
  podeAdaptarDua: boolean;
  /** Gestão do catálogo de cargos: ADMIN e COORDENADOR podem criar/editar/excluir. */
  podeGerirCargos: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessao, setSessao] = useState<SessaoUsuario | null>(() => lerSessao());
  const [avisoSessao, setAvisoSessao] = useState<string | null>(null);

  // TA11.4: o apiClient encerra a sessão ao receber 401; a UI reage e volta ao login.
  useEffect(
    () =>
      aoEncerrarSessao((motivo) => {
        setSessao(null);
        setAvisoSessao(motivo);
      }),
    [],
  );

  // Sincroniza logout/login entre abas.
  useEffect(() => {
    const aoMudarStorage = (e: StorageEvent) => {
      if (e.key === CHAVE_SESSAO) setSessao(lerSessao());
    };
    window.addEventListener('storage', aoMudarStorage);
    return () => window.removeEventListener('storage', aoMudarStorage);
  }, []);

  // Revalida a sessão restaurada do storage (detecta acesso revogado ao reabrir o app).
  useEffect(() => {
    if (!lerSessao()) return;
    revalidarSessao()
      .then((atualizada) => {
        if (atualizada) setSessao(atualizada);
      })
      .catch(() => {
        // 401 já tratado globalmente; falhas de rede mantêm a sessão atual.
      });
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const nova = await autenticar(email, senha);
    setSessao(nova);
    setAvisoSessao(null);
    return nova;
  }, []);

  const logout = useCallback(() => {
    // Logout explícito: não deixa texto clínico em rascunho no navegador. Já a expiração/revogação
    // da sessão (401) preserva o rascunho, que volta quando o mesmo usuário entrar de novo.
    const userId = lerSessao()?.userId;
    if (userId) removerRascunhosDoUsuario(userId);
    limparSessao();
    setSessao(null);
    setAvisoSessao(null);
  }, []);

  const limparAviso = useCallback(() => setAvisoSessao(null), []);

  const valor = useMemo<AuthContextValue>(() => {
    const nivel = sessao?.nivelRestricao;
    return {
      sessao,
      autenticado: sessao !== null,
      avisoSessao,
      limparAviso,
      login,
      logout,
      isAdmin: sessao?.role === 'ADMIN',
      isCoordenador: sessao?.role === 'COORDENADOR',
      isAcessoFuncional: nivel === 'ACESSO_FUNCIONAL',
      podeAcessarDadosSensiveis: nivel === 'SUPER_RESTRICAO' || nivel === 'RESTRICAO_MODERADA',
      podeBaixarLaudo: nivel === 'SUPER_RESTRICAO' && sessao?.autorizacaoSaude === true,
      podeIndicarEstudante: podeIndicarEstudante(sessao?.role),
      podeGerirTriagem: podeGerirTriagem(sessao?.role, nivel),
      podeVerDashboard: podeGerirTriagem(sessao?.role, nivel),
      podeGerirAtas:
        nivel === 'SUPER_RESTRICAO' ||
        nivel === 'RESTRICAO_MODERADA' ||
        sessao?.role === 'CLAI_PSICOPEDAGOGO' ||
        sessao?.role === 'COORDENADOR' ||
        sessao?.role === 'ADMIN',
      podeAdaptarDua: podeAdaptarDua(sessao?.role),
      podeGerirCargos: sessao?.role === 'ADMIN' || sessao?.role === 'COORDENADOR',
    };
  }, [sessao, avisoSessao, limparAviso, login, logout]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
