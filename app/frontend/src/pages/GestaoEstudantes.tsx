import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Search, UserRoundX, Pencil, Users, UserRoundPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ModalInativarEstudante } from '../components/ModalInativarEstudante';
import { GestaoEstudantesService } from '../services/gestaoEstudantesService';
import type { EstudanteResumo, PaginaEstudantes } from '../types/gestaoEstudantes';

interface Props {
  onAbrirProntuario: (estudante: EstudanteResumo) => void;
}

const TAMANHO_PAGINA = 10;
const paginaVazia: PaginaEstudantes = {
  content: [], number: 0, size: TAMANHO_PAGINA, totalElements: 0, totalPages: 0,
};

export function GestaoEstudantes({ onAbrirProntuario }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAcessoFuncional } = useAuth();
  const mensagemInicial = (location.state as { mensagemSucesso?: string } | null)?.mensagemSucesso ?? '';
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [curso, setCurso] = useState('');
  const [turma, setTurma] = useState('');
  const [tag, setTag] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState<PaginaEstudantes>(paginaVazia);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState(mensagemInicial);
  const [revisao, setRevisao] = useState(0);
  const [estudanteInativacao, setEstudanteInativacao] = useState<EstudanteResumo | null>(null);

  useEffect(() => {
    if (mensagemInicial) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [mensagemInicial, location.pathname, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => setBuscaDebounced(busca), 350);
    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    const controlador = new AbortController();
    setCarregando(true);
    setErro('');
    GestaoEstudantesService.listar(
      { termo: buscaDebounced, curso, turma, tag, ativo, page: pagina, size: TAMANHO_PAGINA },
      controlador.signal,
    )
      .then((resultado) => {
        if (controlador.signal.aborted) return;
        setDados(resultado);
        if (pagina > 0 && resultado.totalPages > 0 && pagina >= resultado.totalPages) {
          setPagina(resultado.totalPages - 1);
        }
      })
      .catch((falha: unknown) => {
        if (controlador.signal.aborted) return;
        setDados(paginaVazia);
        setErro(falha instanceof Error ? falha.message : 'Erro inesperado ao carregar estudantes.');
      })
      .finally(() => { if (!controlador.signal.aborted) setCarregando(false); });
    return () => controlador.abort();
  }, [buscaDebounced, curso, turma, tag, ativo, pagina, revisao]);

  function alterarFiltro(setter: (novoValor: string) => void, valor: string) {
    setter(valor);
    setPagina(0);
  }

  function aposInativar(mensagemSucesso: string) {
    setEstudanteInativacao(null);
    setMensagem(`${mensagemSucesso} Para consultar esse estudante, selecione “Inativos / Evadidos”.`);
    setPagina(0);
    setRevisao((valor) => valor + 1);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ifpb-teal">Gestão de Estudantes</h1>
          <p className="text-sm text-gray-600 mt-1">Consulta e manutenção dos estudantes cadastrados na CLAI.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="inline-flex items-center gap-2 text-sm text-gray-600"><Users className="w-4 h-4 text-ifpb-teal" /> {dados.totalElements} estudantes no filtro</span>
          {!isAcessoFuncional && (
            <button type="button" onClick={() => navigate('/estudantes/novo')}
              className="inline-flex items-center gap-2 rounded-lg bg-ifpb-teal hover:bg-ifpb-tealHover px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors shadow-xs">
              <UserRoundPlus className="w-4 h-4" /> Novo estudante
            </button>
          )}
        </div>
      </div>

      {mensagem && <p role="status" className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 text-sm">{mensagem}</p>}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <label htmlFor="busca-estudante" className="block text-sm font-medium text-gray-700 mb-1">Nome ou matrícula</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input id="busca-estudante" value={busca} onChange={(e) => alterarFiltro(setBusca, e.target.value)}
              placeholder="Digite o nome ou a matrícula..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-sm font-medium text-gray-700">Curso
            <input value={curso} onChange={(e) => alterarFiltro(setCurso, e.target.value)} placeholder="Filtrar curso"
              className="block w-full mt-1 rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal" />
          </label>
          <label className="text-sm font-medium text-gray-700">Turma
            <input value={turma} onChange={(e) => alterarFiltro(setTurma, e.target.value)} placeholder="Filtrar turma"
              className="block w-full mt-1 rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal" />
          </label>
          <label className="text-sm font-medium text-gray-700">Tag de deficiência
            <input value={tag} onChange={(e) => alterarFiltro(setTag, e.target.value)} placeholder="Ex.: Deficiência Visual"
              className="block w-full mt-1 rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal" />
          </label>
          <label className="text-sm font-medium text-gray-700">Situação
            <select value={ativo ? 'true' : 'false'} onChange={(e) => { setAtivo(e.target.value === 'true'); setPagina(0); }}
              className="block w-full mt-1 rounded-lg border border-gray-300 p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal">
              <option value="true">Ativos</option><option value="false">Inativos / Evadidos</option>
            </select>
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
        {erro && <p role="alert" className="p-4 text-red-700 bg-red-50 text-sm">{erro}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Matrícula', 'Nome completo', 'Curso / turma', 'Tags', 'Status', 'Ações'].map((titulo) => (
                  <th key={titulo} scope="col" className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{titulo}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-100 ${carregando && dados.content.length > 0 ? 'opacity-60 transition-opacity' : ''}`}>
              {carregando && dados.content.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ifpb-teal" />
                      <span>Buscando estudantes...</span>
                    </div>
                  </td>
                </tr>
              )}
              {dados.content.map((estudante) => (
                <tr key={estudante.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{estudante.matricula}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate" title={estudante.nomeCompleto}>
                    <button
                      type="button"
                      onClick={() => onAbrirProntuario(estudante)}
                      className="font-medium text-gray-900 hover:text-ifpb-teal hover:underline text-left cursor-pointer transition-colors truncate block max-w-full"
                      title={`Abrir prontuário e detalhes de ${estudante.nomeCompleto}`}
                    >
                      {estudante.nomeCompleto}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{estudante.curso || '—'} / {estudante.turma || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap min-w-32">
                      {estudante.tagsDificuldade.length === 0 ? <span className="text-gray-400">—</span> :
                        estudante.tagsDificuldade.map((item) => (
                          <span key={item.id ?? item.nome} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">{item.nome}</span>
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estudante.status === 'EVADIDO' ? 'bg-red-100 text-red-800' : estudante.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                      {estudante.status === 'EVADIDO' ? 'Evadido' : estudante.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onAbrirProntuario(estudante)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer shadow-xs shrink-0"
                        title={`Abrir prontuário e detalhes de ${estudante.nomeCompleto}`}
                        aria-label={`Ver detalhes de ${estudante.nomeCompleto}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detalhes</span>
                      </button>
                      {!isAcessoFuncional && (
                        <>
                          <button
                            type="button"
                            onClick={() => navigate(`/estudantes/${estudante.id}/editar`)}
                            title="Editar estudante"
                            aria-label={`Editar ${estudante.nomeCompleto}`}
                            className="rounded p-1.5 text-gray-500 hover:text-ifpb-teal hover:bg-emerald-50 cursor-pointer transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEstudanteInativacao(estudante)}
                            disabled={!estudante.ativo}
                            title={estudante.ativo ? 'Inativar estudante' : 'Estudante já inativo'}
                            aria-label={`Inativar ${estudante.nomeCompleto}`}
                            className="rounded p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 cursor-pointer transition-colors"
                          >
                            <UserRoundX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!carregando && !erro && dados.content.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 px-4 py-10">Nenhum estudante encontrado com esses filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
          <span className="text-sm text-gray-600" aria-live="polite">
            {carregando ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-ifpb-teal inline-block" />
                Atualizando lista...
              </span>
            ) : (
              `Página ${dados.totalPages === 0 ? 0 : pagina + 1} de ${dados.totalPages} • ${dados.totalElements} registros`
            )}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={carregando || pagina === 0} className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Anterior</button>
            <button type="button" onClick={() => setPagina((p) => p + 1)}
              disabled={carregando || pagina + 1 >= dados.totalPages} className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Próxima</button>
          </div>
        </div>
      </div>

      {estudanteInativacao && (
        <ModalInativarEstudante estudante={estudanteInativacao}
          aoFechar={() => setEstudanteInativacao(null)} aoConfirmar={aposInativar} />
      )}
    </section>
  );
}
