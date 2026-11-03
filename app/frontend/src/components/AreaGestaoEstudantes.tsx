import { useState, type FormEvent } from 'react';
import { GestaoEstudantes } from '../pages/GestaoEstudantes';
import type { EstudanteResumo } from '../types/gestaoEstudantes';
import {
  entrarGestao,
  obterSessaoGestao,
  sairGestao,
  type SessaoGestaoEstudantes,
} from '../services/authGestaoEstudantes';

interface Props {
  onAbrirProntuario: (estudante: EstudanteResumo) => void;
}

export function AreaGestaoEstudantes({ onAbrirProntuario }: Props) {
  const [sessao, setSessao] = useState<SessaoGestaoEstudantes | null>(() => obterSessaoGestao());
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!email.trim() || !senha) {
      setErro('Informe o e-mail e a senha.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      const novaSessao = await entrarGestao(email, senha);
      setSessao(novaSessao);
      setSenha('');
    } catch (falha: unknown) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível autenticar.');
    } finally {
      setCarregando(false);
    }
  }

  if (!sessao) {
    return (
      <section className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F6460]">Entrar na Gestão de Estudantes</h1>
          <p className="text-sm text-gray-600 mt-1">Use uma conta cadastrada no SIGI-CLAI.</p>
        </div>
        <form onSubmit={entrar} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            E-mail
            <input type="email" autoComplete="username" required value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5"
              placeholder="seuemail@exemplo.com" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Senha
            <input type="password" autoComplete="current-password" required value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5" />
          </label>
          {erro && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{erro}</p>}
          <button type="submit" disabled={carregando}
            className="w-full rounded-lg bg-[#0F6460] text-white font-semibold p-2.5 disabled:opacity-50">
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-3 text-sm text-gray-600">
        <span>Conectado como {sessao.nome || sessao.email}</span>
        <button type="button" onClick={() => { sairGestao(); setSessao(null); }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50">
          Sair
        </button>
      </div>
      <GestaoEstudantes onAbrirProntuario={onAbrirProntuario} />
    </div>
  );
}
