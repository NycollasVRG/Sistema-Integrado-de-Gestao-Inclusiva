import { useEffect, useState } from 'react';
import { Eye, Search, UserRoundX, Pencil, Users, UserRoundPlus } from 'lucide-react';
import { ModalEstudante } from '../components/ModalEstudante';
import { ModalInativarEstudante } from '../components/ModalInativarEstudante';
import { GestaoEstudantesService } from '../services/gestaoEstudantesService';
import type { EstudanteResumo, PaginaEstudantes, TagDificuldadeDTO } from '../types/gestaoEstudantes';

interface Props {
  onAbrirProntuario: (estudante: EstudanteResumo) => void;
}

const TAMANHO_PAGINA = 10;
const paginaVazia: PaginaEstudantes = {
  content: [], number: 0, size: TAMANHO_PAGINA, totalElements: 0, totalPages: 0,
};

export function GestaoEstudantes({ onAbrirProntuario }: Props) {
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
  const [mensagem, setMensagem] = useState('');
  const [revisao, setRevisao] = useState(0);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [estudanteEdicao, setEstudanteEdicao] = useState<EstudanteResumo | null>(null);
  const [estudanteInativacao, setEstudanteInativacao] = useState<EstudanteResumo | null>(null);
  const [abrindoEdicao, setAbrindoEdicao] = useState(false);
  const [tagsDisponiveis, setTagsDisponiveis] = useState<TagDificuldadeDTO[]>([]);
  const [erroTags, setErroTags] = useState('');
  const [carregandoTags, setCarregandoTags] = useState(true);

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

  // Busca o catálogo de todas as tags após o login JWT, sem depender
  // das tags dos estudantes já carregados na página.
  useEffect(() => {
    const controlador = new AbortController();
    setCarregandoTags(true);
    setErroTags('');
    GestaoEstudantesService.listarTags(controlador.signal)
      .then((tags) => {
        if (!controlador.signal.aborted) setTagsDisponiveis(tags);
      })
      .catch((falha: unknown) => {
        if (controlador.signal.aborted) return;
        setErroTags(falha instanceof Error ? falha.message : 'Erro ao carregar as tags.');
        setTagsDisponiveis([]);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregandoTags(false);
      });
    return () => controlador.abort();
  }, []);

  function alterarFiltro(setter: (novoValor: string) => void, valor: string) {
    setter(valor);
    setPagina(0);
  }

  function aposSalvar(mensagemSucesso: string) {
    setModalCadastroAberto(false);
    setEstudanteEdicao(null);
    setMensagem(mensagemSucesso);
    setPagina(0);
    setRevisao((valor) => valor + 1);
  }

  async function editar(estudante: EstudanteResumo) {
    setMensagem('');
    setAbrindoEdicao(true);
    try {
      const registroAtualizado = await GestaoEstudantesService.buscarPorId(estudante.id);
      setEstudanteEdicao(registroAtualizado);
    } catch (falha: unknown) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível abrir a edição.');
    } finally {
      setAbrindoEdicao(false);
    }
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
          <h1 className="text-2xl font-bold text-[#0F6460]">Gestão de Estudantes</h1>
          <p className="text-sm text-gray-600 mt-1">Consulta e manutenção dos estudantes cadastrados na CLAI.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="inline-flex items-center gap-2 text-sm text-gray-600"><Users className="w-4 h-4" /> {dados.totalElements} estudantes no filtro</span>
          <button type="button" onClick={() => { setModalCadastroAberto(true); setMensagem(''); }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F6460] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B514D]">
            <UserRoundPlus className="w-4 h-4" /> Novo estudante
          </button>
        </div>
      </div>

      {mensagem && <p role="status" className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 text-sm">{mensagem}</p>}
      {erroTags && (
        <p role="alert" className="rounded-lg bg-amber-50 text-amber-900 border border-amber-200 p-3 text-sm">
          Não foi possível carregar as tags de dificuldade: {erroTags}
        </p>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
        <div className="relative">
          <label htmlFor="busca-estudante" className="block text-sm font-medium text-gray-700 mb-1">Nome ou matrícula</label>
          <Search className="absolute left-3 bottom-3 w-4 h-4 text-gray-400" />
          <input id="busca-estudante" value={busca} onChange={(e) => alterarFiltro(setBusca, e.target.value)}
            placeholder="Digite o nome ou a matrícula"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6460]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-sm font-medium text-gray-700">Curso
            <input value={curso} onChange={(e) => alterarFiltro(setCurso, e.target.value)} placeholder="Filtrar curso"
              className="block w-full mt-1 rounded-lg border border-gray-300 p-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-gray-700">Turma
            <input value={turma} onChange={(e) => alterarFiltro(setTurma, e.target.value)} placeholder="Filtrar turma"
              className="block w-full mt-1 rounded-lg border border-gray-300 p-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-gray-700">Tag de dificuldade
            <input value={tag} onChange={(e) => alterarFiltro(setTag, e.target.value)} placeholder="Ex.: Dislexia"
              className="block w-full mt-1 rounded-lg border border-gray-300 p-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-gray-700">Situação
            <select value={ativo ? 'true' : 'false'} onChange={(e) => { setAtivo(e.target.value === 'true'); setPagina(0); }}
              className="block w-full mt-1 rounded-lg border border-gray-300 p-2.5 text-sm bg-white">
              <option value="true">Ativos</option><option value="false">Inativos / Evadidos</option>
            </select>
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
            <tbody className="divide-y divide-gray-100">
              {dados.content.map((estudante) => (
                <tr key={estudante.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{estudante.matricula}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{estudante.nomeCompleto}</td>
                  <td className="px-4 py-3 text-gray-600">{estudante.curso || '—'} / {estudante.turma || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap min-w-32">
                      {estudante.tagsDificuldade.length === 0 ? <span className="text-gray-400">—</span> :
                        estudante.tagsDificuldade.map((item) => (
                          <span key={item.id ?? item.nome} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">{item.nome}</span>
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estudante.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                      {estudante.status === 'EVADIDO' ? 'Evadido' : estudante.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onAbrirProntuario(estudante)} title="Ver prontuário"
                        aria-label={`Ver prontuário de ${estudante.nomeCompleto}`} className="rounded p-2 text-[#0F6460] hover:bg-emerald-50">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => { void editar(estudante); }} disabled={abrindoEdicao}
                        title="Editar estudante" aria-label={`Editar ${estudante.nomeCompleto}`}
                        className="rounded p-2 text-[#0F6460] hover:bg-emerald-50 disabled:opacity-40">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setEstudanteInativacao(estudante)} disabled={!estudante.ativo}
                        title={estudante.ativo ? 'Inativar estudante' : 'Estudante já inativo'}
                        aria-label={`Inativar ${estudante.nomeCompleto}`}
                        className="rounded p-2 text-red-700 hover:bg-red-50 disabled:opacity-30">
                        <UserRoundX className="w-4 h-4" />
                      </button>
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
            {carregando ? 'Carregando...' : `Página ${dados.totalPages === 0 ? 0 : pagina + 1} de ${dados.totalPages} • ${dados.totalElements} registros`}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={carregando || pagina === 0} className="px-3 py-2 border rounded-lg text-sm disabled:opacity-40">Anterior</button>
            <button type="button" onClick={() => setPagina((p) => p + 1)}
              disabled={carregando || pagina + 1 >= dados.totalPages} className="px-3 py-2 border rounded-lg text-sm disabled:opacity-40">Próxima</button>
          </div>
        </div>
      </div>

      {modalCadastroAberto && (
        <ModalEstudante aberto estudante={null} tagsDisponiveis={tagsDisponiveis} carregandoTags={carregandoTags}
          aoFechar={() => setModalCadastroAberto(false)} aoSalvar={aposSalvar} />
      )}
      {estudanteEdicao && (
        <ModalEstudante aberto estudante={estudanteEdicao} tagsDisponiveis={tagsDisponiveis} carregandoTags={carregandoTags}
          aoFechar={() => setEstudanteEdicao(null)} aoSalvar={aposSalvar} />
      )}
      {estudanteInativacao && (
        <ModalInativarEstudante estudante={estudanteInativacao}
          aoFechar={() => setEstudanteInativacao(null)} aoConfirmar={aposInativar} />
      )}
    </section>
  );
}
