import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  History,
  Lock,
  RotateCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { CardAcessoRestrito } from '../components/CardAcessoRestrito';
import { useAuth } from '../contexts/AuthContext';
import { toProblem } from '../services/apiClient';
import { AuditoriaService } from '../services/auditoriaService';
import type { AuditoriaListaDTO } from '../types/auditoria';

const TAMANHO_PAGINA = 20;

interface FiltrosAplicados {
  acao: string;
  entidade: string;
  usuarioId: string;
}

const FILTROS_VAZIOS: FiltrosAplicados = { acao: '', entidade: '', usuarioId: '' };

function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
}

function resumoId(id: string | null | undefined): string {
  if (!id) return 'Sistema';
  return id.length > 13 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

function corMetodo(metodo: string): string {
  switch (metodo.toUpperCase()) {
    case 'POST':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'PUT':
    case 'PATCH':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'DELETE':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-sky-50 text-sky-700 border-sky-200';
  }
}

export const PainelAdminAuditoria: React.FC = () => {
  const { isAdmin } = useAuth();

  const [dados, setDados] = useState<AuditoriaListaDTO | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acao, setAcao] = useState('');
  const [entidade, setEntidade] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [pagina, setPagina] = useState(0);
  const [filtros, setFiltros] = useState<FiltrosAplicados>(FILTROS_VAZIOS);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await AuditoriaService.listar({
        pagina,
        tamanho: TAMANHO_PAGINA,
        acao: filtros.acao,
        entidade: filtros.entidade,
        usuarioId: filtros.usuarioId,
      });
      setDados(resposta);
    } catch (err: unknown) {
      const problema = toProblem(err);
      setErro(
        problema.detail ||
          'Não foi possível carregar a trilha de auditoria. Tente novamente em instantes.'
      );
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtros]);

  useEffect(() => {
    if (!isAdmin) return;
    void carregar();
  }, [isAdmin, carregar]);

  const aplicarFiltros = (evento: React.FormEvent) => {
    evento.preventDefault();
    setPagina(0);
    setFiltros({ acao: acao.trim(), entidade: entidade.trim(), usuarioId: usuarioId.trim() });
  };

  const limparFiltros = () => {
    setAcao('');
    setEntidade('');
    setUsuarioId('');
    setPagina(0);
    setFiltros(FILTROS_VAZIOS);
  };

  if (!isAdmin) {
    return (
      <CardAcessoRestrito mensagem="A consulta à trilha de auditoria é restrita a perfis ROLE_ADMIN." />
    );
  }

  const totalPaginas = dados?.totalPaginas ?? 0;
  const paginaAtual = dados?.pagina ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ifpb-dark">Trilha de Auditoria</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Consulta somente leitura dos registros imutáveis de operações realizadas no sistema
              (US 06 / TA6.1).
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 self-start">
          <Lock className="w-3.5 h-3.5 text-purple-700" />
          Registros append-only &bull; sem edição ou exclusão
        </div>
      </div>

      <form
        onSubmit={aplicarFiltros}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 items-end"
      >
        <div>
          <label htmlFor="auditoria-acao" className="block text-xs font-bold text-ifpb-dark mb-1">
            Ação
          </label>
          <input
            id="auditoria-acao"
            type="text"
            value={acao}
            onChange={(evento) => setAcao(evento.target.value)}
            placeholder="Ex.: CRIAR_ESTUDO"
            className="w-full px-3 py-2 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
          />
        </div>
        <div>
          <label htmlFor="auditoria-entidade" className="block text-xs font-bold text-ifpb-dark mb-1">
            Entidade
          </label>
          <input
            id="auditoria-entidade"
            type="text"
            value={entidade}
            onChange={(evento) => setEntidade(evento.target.value)}
            placeholder="Ex.: ESTUDO_CASO"
            className="w-full px-3 py-2 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
          />
        </div>
        <div>
          <label htmlFor="auditoria-usuario" className="block text-xs font-bold text-ifpb-dark mb-1">
            ID do usuário
          </label>
          <input
            id="auditoria-usuario"
            type="text"
            value={usuarioId}
            onChange={(evento) => setUsuarioId(evento.target.value)}
            placeholder="UUID (opcional)"
            className="w-full px-3 py-2 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
          />
        </div>
        <button
          type="submit"
          disabled={carregando}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Search className="w-3.5 h-3.5" />
          Filtrar
        </button>
        <button
          type="button"
          onClick={limparFiltros}
          disabled={carregando}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Limpar
        </button>
      </form>

      {erro && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2 text-red-800"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs break-words">{erro}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ifpb-dark">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            Eventos registrados
          </div>
          <span className="text-[11px] text-gray-500">
            {dados ? `${dados.totalElementos} registro(s) no filtro atual` : 'Carregando...'}
          </span>
        </div>

        {carregando && !dados ? (
          <div className="px-5 py-14 flex flex-col items-center gap-2 text-gray-500">
            <RotateCw className="w-5 h-5 animate-spin text-ifpb-teal" />
            <p className="text-xs">Carregando trilha de auditoria...</p>
          </div>
        ) : !dados || dados.logs.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-gray-500">
            Nenhum registro de auditoria encontrado para os filtros informados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-bold whitespace-nowrap">Data/Hora</th>
                  <th className="px-4 py-3 font-bold">Ação</th>
                  <th className="px-4 py-3 font-bold">Entidade</th>
                  <th className="px-4 py-3 font-bold">Requisição</th>
                  <th className="px-4 py-3 font-bold">Usuário</th>
                  <th className="px-5 py-3 font-bold">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dados.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 align-top">
                    <td className="px-5 py-3 whitespace-nowrap text-gray-700">
                      {formatarDataHora(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 rounded bg-purple-50 text-purple-800 font-semibold break-all">
                        {log.acao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 break-all">{log.entidade || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit px-2 py-0.5 rounded border font-bold ${corMetodo(log.metodoHttp)}`}
                        >
                          {log.metodoHttp || '—'}
                        </span>
                        <span className="text-[11px] text-gray-500 break-all" title={log.endpoint}>
                          {log.endpoint || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-gray-600" title={log.usuarioId ?? ''}>
                        {resumoId(log.usuarioId)}
                      </span>
                      <div className="text-[10px] text-gray-400 font-mono" title={log.entidadeId ?? ''}>
                        {log.entidadeId ? `alvo: ${resumoId(log.entidadeId)}` : ''}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-gray-600 max-w-xs">
                      {log.detalhes ? (
                        <details className="cursor-pointer">
                          <summary className="text-ifpb-teal font-semibold">Ver detalhes</summary>
                          <pre className="mt-2 p-2 rounded bg-gray-50 border border-gray-100 whitespace-pre-wrap break-all font-mono text-[10px]">
                            {log.detalhes}
                          </pre>
                        </details>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500">
            Página {totalPaginas === 0 ? 0 : paginaAtual + 1} de {totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.max(0, atual - 1))}
              disabled={carregando || paginaAtual <= 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina((atual) => atual + 1)}
              disabled={carregando || paginaAtual + 1 >= totalPaginas}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
