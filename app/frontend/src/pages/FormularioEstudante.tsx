import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Info,
  RotateCw,
  Save,
  ShieldAlert,
  Tag,
  UserCog,
  UserRoundPlus,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import { ErroApiAlunos, GestaoEstudantesService } from '../services/gestaoEstudantesService';
import type {
  DadosEstudanteFormulario,
  EstudanteResumo,
  TagDificuldadeDTO,
} from '../types/gestaoEstudantes';

export interface FormularioEstudanteProps {
  onNotificar?: (tipo: 'sucesso' | 'erro' | 'alerta', titulo: string, mensagem: string) => void;
  onEstudanteSalvo?: (estudante: EstudanteResumo) => void;
}

function resolverIdTag(tag: TagDificuldadeDTO, catalogo: TagDificuldadeDTO[]): string | undefined {
  if (tag.id) return tag.id;
  // Compatibilidade com APIs antigas que retornavam somente o nome.
  return catalogo.find(
    (item) =>
      item.id &&
      item.nome.trim().toLocaleLowerCase('pt-BR') === tag.nome.trim().toLocaleLowerCase('pt-BR'),
  )?.id;
}

function obterEstadoInicial(
  estudante: EstudanteResumo | null,
  catalogo: TagDificuldadeDTO[],
): DadosEstudanteFormulario {
  return {
    nomeCompleto: estudante?.nomeCompleto ?? '',
    matricula: estudante?.matricula ?? '',
    curso: estudante?.curso ?? '',
    turma: estudante?.turma ?? '',
    status:
      estudante?.status === 'EVADIDO'
        ? 'EVADIDO'
        : estudante?.status === 'INATIVO'
          ? 'INATIVO'
          : 'ATIVO',
    tagsDificuldadeIds:
      estudante?.tagsDificuldade
        .map((tag) => resolverIdTag(tag, catalogo))
        .filter((id): id is string => Boolean(id)) ?? [],
  };
}

function mesmoConjuntoIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const conjuntoB = new Set(b);
  return a.every((id) => conjuntoB.has(id));
}

interface ConteudoFormularioProps extends FormularioEstudanteProps {
  estudante: EstudanteResumo | null;
  tagsDisponiveis: TagDificuldadeDTO[];
}

function ConteudoFormularioEstudante({
  estudante,
  tagsDisponiveis,
  onNotificar,
  onEstudanteSalvo,
}: ConteudoFormularioProps) {
  const navigate = useNavigate();
  const estadoInicial = useMemo(
    () => obterEstadoInicial(estudante, tagsDisponiveis),
    [estudante, tagsDisponiveis],
  );
  const [dados, setDados] = useState<DadosEstudanteFormulario>(estadoInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  const ehEdicao = estudante !== null;
  const tagsValidas = useMemo(
    () =>
      Array.from(
        new Map(tagsDisponiveis.filter((tag) => Boolean(tag.id)).map((tag) => [tag.id, tag])).values(),
      ),
    [tagsDisponiveis],
  );
  const idsSelecionados = new Set(dados.tagsDificuldadeIds);
  const tagsSemId =
    estudante?.tagsDificuldade.some((tag) => !resolverIdTag(tag, tagsDisponiveis)) ?? false;

  const isDirty =
    dados.nomeCompleto !== estadoInicial.nomeCompleto ||
    dados.matricula !== estadoInicial.matricula ||
    dados.curso !== estadoInicial.curso ||
    dados.turma !== estadoInicial.turma ||
    dados.status !== estadoInicial.status ||
    !mesmoConjuntoIds(dados.tagsDificuldadeIds, estadoInicial.tagsDificuldadeIds);

  function alterarCampo(campo: 'nomeCompleto' | 'matricula' | 'curso' | 'turma', valor: string) {
    setDados((anterior) => ({ ...anterior, [campo]: valor }));
    if (erro) setErro('');
  }

  function alterarTag(id: string, selecionada: boolean) {
    setDados((anterior) => ({
      ...anterior,
      tagsDificuldadeIds: selecionada
        ? Array.from(new Set([...anterior.tagsDificuldadeIds, id]))
        : anterior.tagsDificuldadeIds.filter((atual) => atual !== id),
    }));
    if (erro) setErro('');
  }

  function handleVoltar() {
    if (salvando) return;
    if (isDirty) {
      setConfirmarSaida(true);
      return;
    }
    navigate('/estudantes');
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const campos: DadosEstudanteFormulario = {
      ...dados,
      nomeCompleto: dados.nomeCompleto.trim(),
      matricula: dados.matricula.trim(),
      curso: dados.curso.trim(),
      turma: dados.turma.trim(),
    };

    if (!campos.nomeCompleto || !campos.matricula || !campos.curso || !campos.turma) {
      setErro('Preencha nome completo, matrícula, curso e turma.');
      return;
    }
    if (campos.tagsDificuldadeIds.length === 0) {
      setErro('Selecione pelo menos uma tag de deficiência para salvar o estudante.');
      return;
    }
    if (tagsSemId) {
      setErro(
        'Não foi possível identificar uma ou mais tags atuais. Atualize a página e confira se o catálogo de tags carregou corretamente.',
      );
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      const salvo = estudante
        ? await GestaoEstudantesService.atualizar(estudante.id, campos)
        : await GestaoEstudantesService.criar(campos);
      const mensagemSucesso = ehEdicao
        ? 'Estudante atualizado com sucesso.'
        : 'Estudante cadastrado com sucesso.';

      onEstudanteSalvo?.(salvo);
      onNotificar?.(
        'sucesso',
        ehEdicao ? 'Estudante Atualizado' : 'Estudante Cadastrado',
        mensagemSucesso,
      );
      navigate('/estudantes', { state: { mensagemSucesso } });
    } catch (falha: unknown) {
      if (falha instanceof ErroApiAlunos && falha.status === 409) {
        setErro('Já existe um estudante cadastrado com essa matrícula. Informe outra matrícula.');
      } else {
        setErro(falha instanceof Error ? falha.message : 'Erro inesperado ao salvar estudante.');
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleVoltar}
            disabled={salvando}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Voltar para Gestão de Estudantes"
            aria-label="Voltar para Gestão de Estudantes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              {ehEdicao ? (
                <UserCog className="w-5 h-5 text-green-300" />
              ) : (
                <UserRoundPlus className="w-5 h-5 text-green-300" />
              )}
              <h2 className="text-xl font-bold tracking-tight">
                {ehEdicao ? 'Editar Estudante' : 'Novo Estudante'}
              </h2>
            </div>
            <p className="text-xs text-green-100 mt-0.5">
              {ehEdicao && estudante ? (
                <>
                  Registro: <span className="font-semibold text-white">{estudante.nomeCompleto}</span> (
                  <span className="font-mono">{estudante.matricula}</span>)
                </>
              ) : (
                'Cadastro discente para acompanhamento na CLAI'
              )}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white self-start sm:self-auto">
          {ehEdicao ? 'Edição Cadastral' : 'Novo Cadastro'}
        </span>
      </div>

      <div className="bg-[#EEF1EC] border-b border-[#DDE5DB] px-6 py-3 text-xs text-ifpb-dark flex items-start space-x-2">
        <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ifpb-teal">Orientações de Preenchimento:</span>{' '}
          Campos marcados com <span className="text-ifpb-red font-semibold">*</span> são obrigatórios.
          Selecione ao menos uma tag de deficiência para vincular o estudante aos fluxos da equipe multidisciplinar.
        </div>
      </div>

      <form className="p-6 sm:p-8 space-y-6" onSubmit={salvar} noValidate>
        {erro && (
          <div
            role="alert"
            className="bg-red-50 border-l-4 border-ifpb-red p-4 rounded-r-lg flex items-start gap-2.5 text-sm text-red-800"
          >
            <AlertTriangle className="w-5 h-5 text-ifpb-red shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <section className="space-y-4" aria-labelledby="titulo-dados-estudante">
          <h3 id="titulo-dados-estudante" className="text-sm font-bold text-ifpb-dark border-b border-gray-100 pb-2">
            Dados Cadastrais e Acadêmicos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block text-sm font-medium text-gray-700 md:col-span-2">
              Nome completo <span className="text-ifpb-red">*</span>
              <input
                value={dados.nomeCompleto}
                required
                maxLength={255}
                onChange={(e) => alterarCampo('nomeCompleto', e.target.value)}
                className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                placeholder="Nome completo do estudante"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Matrícula <span className="text-ifpb-red">*</span>
              <input
                value={dados.matricula}
                required
                maxLength={50}
                onChange={(e) => alterarCampo('matricula', e.target.value)}
                className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                placeholder="Ex.: 20260001"
              />
            </label>
          </div>

          <div className={`grid grid-cols-1 gap-4 ${ehEdicao ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <label className="block text-sm font-medium text-gray-700">
              Curso <span className="text-ifpb-red">*</span>
              <input
                value={dados.curso}
                required
                maxLength={100}
                onChange={(e) => alterarCampo('curso', e.target.value)}
                className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                placeholder="Ex.: Informática"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Turma <span className="text-ifpb-red">*</span>
              <input
                value={dados.turma}
                required
                maxLength={50}
                onChange={(e) => alterarCampo('turma', e.target.value)}
                className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                placeholder="Ex.: 2026.1"
              />
            </label>

            {ehEdicao && (
              <label className="block text-sm font-medium text-gray-700">
                Situação do estudante
                <select
                  value={dados.status}
                  onChange={(e) => {
                    setDados((anterior) => ({
                      ...anterior,
                      status: e.target.value as DadosEstudanteFormulario['status'],
                    }));
                    if (erro) setErro('');
                  }}
                  className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                  <option value="EVADIDO">Evadido</option>
                </select>
                {estudante && !estudante.ativo && dados.status === 'ATIVO' && (
                  <span className="block mt-1 text-xs text-emerald-700">
                    Ao salvar, o estudante será reativado e aparecerá no filtro Ativos.
                  </span>
                )}
              </label>
            )}
          </div>
        </section>

        <fieldset className="border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3">
          <legend className="text-sm font-bold text-ifpb-dark px-1.5 inline-flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-ifpb-teal" />
            <span>
              Tags de deficiência (seleção múltipla) <span className="text-ifpb-red">*</span>
            </span>
          </legend>

          {tagsValidas.length === 0 ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Não há tags cadastradas ou disponíveis. Cadastre indicadores no banco e recarregue esta página antes de salvar.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {tagsValidas.map((tag) => {
                const selecionada = idsSelecionados.has(tag.id as string);
                return (
                  <label
                    key={tag.id}
                    className={`flex items-center gap-2.5 rounded-lg border p-3 text-sm cursor-pointer transition-colors ${
                      selecionada
                        ? 'border-ifpb-teal bg-ifpb-tealLight/60 text-ifpb-teal font-semibold'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selecionada}
                      onChange={(e) => alterarTag(tag.id as string, e.target.checked)}
                      className="rounded border-gray-300 accent-[#0F6460]"
                    />
                    <span>{tag.nome}</span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <div className="pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            onClick={handleVoltar}
            disabled={salvando}
            className="px-4 py-2.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={salvando || tagsValidas.length === 0}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? (
              <RotateCw className="w-4 h-4 mr-1.5 text-green-300 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5 text-green-300" />
            )}
            {salvando ? 'Salvando...' : ehEdicao ? 'Salvar alterações' : 'Cadastrar estudante'}
          </button>
        </div>
      </form>

      {confirmarSaida && (
        <ConfirmModal
          titulo="Descartar alterações?"
          mensagem={
            ehEdicao
              ? 'Existem alterações não salvas no cadastro deste estudante. Deseja realmente sair e descartar as alterações?'
              : 'Os dados preenchidos para o novo estudante ainda não foram salvos. Deseja realmente sair e descartar o preenchimento?'
          }
          textoConfirmar="Descartar e Sair"
          textoCancelar="Continuar Editando"
          variante="perigo"
          onConfirmar={() => {
            setConfirmarSaida(false);
            navigate('/estudantes');
          }}
          onCancelar={() => setConfirmarSaida(false)}
        />
      )}
    </div>
  );
}

interface PaginaInternaProps extends FormularioEstudanteProps {
  estudanteId?: string;
}

function FormularioEstudantePagina({
  estudanteId,
  onNotificar,
  onEstudanteSalvo,
}: PaginaInternaProps) {
  const navigate = useNavigate();
  const { isAcessoFuncional } = useAuth();
  const [tagsDisponiveis, setTagsDisponiveis] = useState<TagDificuldadeDTO[]>([]);
  const [estudante, setEstudante] = useState<EstudanteResumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (isAcessoFuncional) return;

    const controlador = new AbortController();
    Promise.all([
      GestaoEstudantesService.listarTags(controlador.signal),
      estudanteId
        ? GestaoEstudantesService.buscarPorId(estudanteId, controlador.signal)
        : Promise.resolve(null),
    ])
      .then(([tags, aluno]) => {
        if (controlador.signal.aborted) return;
        setTagsDisponiveis(tags);
        setEstudante(aluno);
      })
      .catch((falha: unknown) => {
        if (controlador.signal.aborted) return;
        setErroCarregamento(
          falha instanceof Error ? falha.message : 'Não foi possível carregar os dados do formulário.',
        );
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });

    return () => controlador.abort();
  }, [estudanteId, isAcessoFuncional, tentativa]);

  if (isAcessoFuncional) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-bold text-amber-900">Acesso Restrito</h2>
        <p className="text-sm text-amber-800">
          Seu perfil possui acesso funcional e não tem permissão para cadastrar ou editar estudantes.
        </p>
        <button
          type="button"
          onClick={() => navigate('/estudantes')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Gestão de Estudantes
        </button>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ifpb-teal mb-3" />
        <p className="text-sm font-medium text-gray-600">
          {estudanteId ? 'Carregando dados do estudante...' : 'Carregando formulário de cadastro...'}
        </p>
      </div>
    );
  }

  if (erroCarregamento) {
    return (
      <div className="bg-white border border-red-200 rounded-xl shadow-sm p-8 text-center max-w-2xl mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-ifpb-red mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">
          Não foi possível abrir o formulário
        </h2>
        <p className="text-sm text-red-700">{erroCarregamento}</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/estudantes')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Gestão de Estudantes
          </button>
          <button
            type="button"
            onClick={() => {
              setCarregando(true);
              setErroCarregamento('');
              setTentativa((atual) => atual + 1);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <ConteudoFormularioEstudante
      key={`${estudante?.id ?? 'novo'}-${tagsDisponiveis.length}`}
      estudante={estudante}
      tagsDisponiveis={tagsDisponiveis}
      onNotificar={onNotificar}
      onEstudanteSalvo={onEstudanteSalvo}
    />
  );
}

export function FormularioEstudante({ onNotificar, onEstudanteSalvo }: FormularioEstudanteProps) {
  const { id } = useParams<{ id?: string }>();
  return (
    <FormularioEstudantePagina
      key={id ?? 'novo'}
      estudanteId={id}
      onNotificar={onNotificar}
      onEstudanteSalvo={onEstudanteSalvo}
    />
  );
}
