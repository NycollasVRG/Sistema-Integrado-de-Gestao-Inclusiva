import React, { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toProblem } from '../services/apiClient';

export const Login: React.FC = () => {
  const { autenticado, login, avisoSessao, limparAviso } = useAuth();
  const location = useLocation();
  const destino = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  if (autenticado) return <Navigate to={destino} replace />;

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!email.trim() || !senha) {
      setErro('Informe o e-mail e a senha.');
      return;
    }
    setErro('');
    limparAviso();
    setCarregando(true);
    try {
      await login(email, senha);
    } catch (falha: unknown) {
      setErro(toProblem(falha, 'Falha na autenticação', 'Não foi possível autenticar.').detail);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#0F6460]">Entrar no SIGI-CLAI</h1>
        <p className="text-sm text-gray-600 mt-1">Use uma conta cadastrada no sistema.</p>
      </div>

      {avisoSessao && (
        <div
          role="alert"
          className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-lg"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Sessão encerrada</p>
            <p>{avisoSessao}</p>
          </div>
        </div>
      )}

      <form onSubmit={entrar} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          E-mail
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5"
            placeholder="seuemail@exemplo.com"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Senha
          <input
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5"
          />
        </label>
        {erro && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={carregando}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F6460] text-white font-semibold p-2.5 disabled:opacity-50 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </section>
  );
};

export default Login;
