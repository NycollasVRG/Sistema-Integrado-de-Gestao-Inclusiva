import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SessaoUsuario } from '../types/auth';
import { autenticar, revalidarSessao } from '../services/authService';
import { aoEncerrarSessao, CHAVE_SESSAO, lerSessao, limparSessao } from '../services/authSessao';

interface AuthContextValue {
  sessao: SessaoUsuario | null;
  autenticado: boolean;
  /** Motivo do encerramento forçado da sessão (ex.: acesso revogado), exibido no login. */
  avisoSessao: string | null;
  limparAviso: () => void;
  login: (email: string, senha: string) => Promise<SessaoUsuario>;
  logout: () => void;
  isAdmin: boolean;
  isAcessoFuncional: boolean;
  /** TA11.3: Restrição Moderada ou superior enxerga histórico familiar/socioemocional. */
  podeAcessarDadosSensiveis: boolean;
  /** TA11.2: laudos exigem SUPER_RESTRICAO e autorização de saúde. */
  podeBaixarLaudo: boolean;
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
      isAcessoFuncional: nivel === 'ACESSO_FUNCIONAL',
      podeAcessarDadosSensiveis: nivel === 'SUPER_RESTRICAO' || nivel === 'RESTRICAO_MODERADA',
      podeBaixarLaudo: nivel === 'SUPER_RESTRICAO' && sessao?.autorizacaoSaude === true,
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
