import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useMatch,
  useParams,
} from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Users } from 'lucide-react';
import { HeaderIFPB } from './components/HeaderIFPB';
import { TelaAluno } from './components/TelaAluno';
import { FormularioEstudoDeCaso } from './components/FormularioEstudoDeCaso';
import { FormularioPei } from './components/FormularioPei';
import { ToastAlert, type ToastMessage } from './components/ToastAlert';
import { StudentHeader } from './components/StudentHeader';
import { Timeline } from './components/Timeline';
import { ProntuarioQuickActions } from './components/ProntuarioQuickActions';
import { ModalNovoAtendimento } from './components/ModalNovoAtendimento';
import { ModalNovoEstudo } from './components/ModalNovoEstudo';
import { ModalConfirmacaoAcao } from './components/ModalConfirmacaoAcao';
import { EstudoDeCasoService } from './services/estudoDeCasoService';
import { PeiService } from './services/peiService';
import { GestaoEstudantesService } from './services/gestaoEstudantesService';
import { estudanteParaHeader } from './services/alunoService';
import type { EstudanteResumo } from './types/gestaoEstudantes';
import { getTimeline } from './services/timelineService';
import { FormularioPea } from './components/FormularioPea';
import { PeaService } from './services/peaService';
import { FormularioPlanoAcao } from './components/FormularioPlanoAcao';
import { PlanoAcaoService } from './services/planoAcaoService';
import type { DadosFormularioPei, PeiResponseDTO } from './types/pei';
import type { AlunoHeaderData } from './types/alunoHeader';
import type { TimelineEventDTO } from './types/timeline';
import type { DadosFormularioPea, PeaResponseDTO } from './types/pea';
import type { DadosFormularioPlanoAcao, PlanoAcaoResponseDTO } from './types/planoAcao';
import type {
  AlunoModalData,
  ProntuarioModalTipo,
} from './types/prontuarioAcoes';
import type {
  Aluno,
  DadosFormularioEstudo,
  EstudoDeCasoResponseDTO,
  EstudoDeCasoUpdateDTO,
  IndicadorReutilizavel,
  ProblemDetailRFC9457,
} from './types/estudoDeCaso';
import { AreaGestaoEstudantes } from './components/AreaGestaoEstudantes';
import { Login } from './pages/Login';
import { RotaProtegida } from './components/RotaProtegida';
import { ModalAcessoNegadoLGPD } from './components/ModalAcessoNegadoLGPD';
import { useAuth } from './contexts/AuthContext';
import { PainelAdminUsuarios } from './pages/PainelAdminUsuarios';
import { SecaoProntuarioRbac } from './components/SecaoProntuarioRbac';
import { FormularioEstudante } from './pages/FormularioEstudante';

function resumoParaAluno(estudante: EstudanteResumo): Aluno {
  return {
    id: estudante.id,
    nome: estudante.nomeCompleto,
    matricula: estudante.matricula,
    curso: estudante.curso,
    turma: estudante.turma,
  };
}

function ehEstudoConcluido(estudo: EstudoDeCasoResponseDTO): boolean {
  return estudo.status === 'ATIVO' || estudo.status === 'ENCERRADO';
}

function ordenarPorVersaoDesc(estudos: EstudoDeCasoResponseDTO[]): EstudoDeCasoResponseDTO[] {
  return [...estudos].sort((a, b) => (b.versao ?? 1) - (a.versao ?? 1));
}

const RedirecionarParaProntuario: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/estudantes/${id}/prontuario` : '/estudantes'} replace />;
};

const CardCarregamento: React.FC<{ mensagem: string }> = ({ mensagem }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center my-6">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ifpb-teal mb-4"></div>
    <p className="text-sm font-medium text-gray-600">{mensagem}</p>
  </div>
);

const CardErroEstudante: React.FC<{ mensagem: string; onVoltar: () => void }> = ({
  mensagem,
  onVoltar,
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-red-200 p-10 text-center max-w-lg mx-auto my-6 space-y-4">
    <div className="p-3 bg-red-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-red-600">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-gray-900">Não foi possível abrir o prontuário</h3>
    <p className="text-sm text-gray-600">{mensagem}</p>
    <button
      type="button"
      onClick={onVoltar}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover rounded-md shadow-sm transition-colors cursor-pointer"
    >
      <Users className="w-4 h-4" />
      Voltar para Gestão de Estudantes
    </button>
  </div>
);

const AppConteudo: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { autenticado } = useAuth();

  const matchProntuario = useMatch('/estudantes/:id/prontuario');
  const matchEstudo = useMatch('/estudantes/:id/estudo-de-caso');
  const matchPei = useMatch('/estudantes/:id/pei');
  const matchPea = useMatch('/estudantes/:id/pea');
  const matchPlanoAcao = useMatch('/estudantes/:id/plano-de-acao');
  const routeAlunoId =
    matchProntuario?.params?.id ??
    matchEstudo?.params?.id ??
    matchPei?.params?.id ??
    matchPea?.params?.id ??
    matchPlanoAcao?.params?.id ??
    null;

  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [indicadores, setIndicadores] = useState<IndicadorReutilizavel[]>([]);
  const [estudoAtual, setEstudoAtual] = useState<EstudoDeCasoResponseDTO | null>(null);
  const [estudosDoAluno, setEstudosDoAluno] = useState<EstudoDeCasoResponseDTO[]>([]);
  const [estudoEmFocoId, setEstudoEmFocoId] = useState<string | null>(null);
  const [iniciandoNovaVersao, setIniciandoNovaVersao] = useState<boolean>(false);
  const [peiAtual, setPeiAtual] = useState<PeiResponseDTO | null>(null);
  const [peaAtual, setPeaAtual] = useState<PeaResponseDTO | null>(null);
  const [peasDoAluno, setPeasDoAluno] = useState<PeaResponseDTO[]>([]);
  const [planosAcaoDoAluno, setPlanosAcaoDoAluno] = useState<PlanoAcaoResponseDTO[]>([]);
  const [planoAcaoEmFocoId, setPlanoAcaoEmFocoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [carregandoEstudo, setCarregandoEstudo] = useState<boolean>(false);
  const [loadingPei, setLoadingPei] = useState<boolean>(false);
  const [loadingPea, setLoadingPea] = useState<boolean>(false);
  const [loadingPlanoAcao, setLoadingPlanoAcao] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [header, setHeader] = useState<AlunoHeaderData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEventDTO[]>([]);
  const [loadingHeader, setLoadingHeader] = useState<boolean>(false);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [errorTimeline, setErrorTimeline] = useState<string | null>(null);
  const [erroAlunoRota, setErroAlunoRota] = useState<string | null>(null);
  const [revisaoProntuario, setRevisaoProntuario] = useState<number>(0);
  const [modalAtivo, setModalAtivo] = useState<ProntuarioModalTipo>(null);

  // Evita toasts duplicados decorrentes do StrictMode em desenvolvimento
  const ultimosToastsRef = useRef<Map<string, number>>(new Map());
  const ultimoAlunoCarregadoRef = useRef<string | null>(null);
  const alunoSelecionadoRef = useRef<Aluno | null>(null);
  const pathnameRef = useRef<string>(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  const removerToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const adicionarToast = useCallback((tipo: 'sucesso' | 'erro' | 'alerta', titulo: string, mensagem: string) => {
    const chave = `${tipo}|${titulo}|${mensagem}`;
    const agora = Date.now();
    const ultimo = ultimosToastsRef.current.get(chave);
    if (ultimo && agora - ultimo < 1000) {
      return;
    }
    ultimosToastsRef.current.set(chave, agora);

    const id = `toast-${agora}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, tipo, titulo, mensagem }]);
    setTimeout(() => {
      removerToast(id);
    }, 5000);
  }, [removerToast]);

  // Aplica a lista de estudos: versões (mais recente primeiro) e estudo vigente segundo o backend
  const aplicarEstudos = useCallback((estudos: EstudoDeCasoResponseDTO[]) => {
    setEstudosDoAluno(ordenarPorVersaoDesc(estudos));
    setEstudoAtual(estudos.length > 0 ? estudos[0] : null);
  }, []);

  const carregarEstudosDoAluno = useCallback(async (alunoId: string, signal?: AbortSignal) => {
    setCarregandoEstudo(true);
    try {
      const estudos = await EstudoDeCasoService.listarPorAluno(alunoId, signal);
      if (signal?.aborted) return;
      aplicarEstudos(estudos ?? []);
    } catch (e: unknown) {
      if (signal?.aborted) return;
      console.error('Erro ao buscar estudos do aluno:', e);
      setEstudoAtual(null);
      setEstudosDoAluno([]);
    } finally {
      if (!signal?.aborted) setCarregandoEstudo(false);
    }
  }, [aplicarEstudos]);

  // Recarrega as versões sem exibir o loading de tela (preserva o formulário montado).
  // Garante que o backend (que encerra a versão ATIVO anterior) seja a fonte da verdade (TA2.4).
  const sincronizarEstudos = useCallback(
    async (alunoId: string, focar?: EstudoDeCasoResponseDTO) => {
      if (focar) {
        setEstudoEmFocoId(focar.id);
        setIniciandoNovaVersao(false);
      }
      try {
        aplicarEstudos(await EstudoDeCasoService.listarPorAluno(alunoId));
      } catch (e: unknown) {
        console.error('Erro ao sincronizar versões do estudo:', e);
        if (focar) {
          setEstudoAtual(focar);
          setEstudosDoAluno((prev) =>
            ordenarPorVersaoDesc([...prev.filter((estudo) => estudo.id !== focar.id), focar])
          );
        }
      }
    },
    [aplicarEstudos]
  );

  const carregarPeiDoAluno = useCallback(async (alunoId: string, signal?: AbortSignal) => {
    setLoadingPei(true);
    try {
      const peis = await PeiService.listarPorAluno(alunoId, signal);
      if (signal?.aborted) return;
      setPeiAtual(peis.length > 0 ? peis[0] : null);
    } catch (e: unknown) {
      if (signal?.aborted) return;
      console.error('Erro ao buscar PEI do aluno:', e);
      setPeiAtual(null);
    } finally {
      if (!signal?.aborted) setLoadingPei(false);
    }
  }, []);

  const carregarPeaDoAluno = useCallback(async (alunoId: string, signal?: AbortSignal) => {
    setLoadingPea(true);
    try {
      const peas = await PeaService.listarPorAluno(alunoId, signal);
      if (signal?.aborted) return;
      setPeasDoAluno(peas);
      setPeaAtual(peas.length > 0 ? peas[0] : null);
    } catch (erro: unknown) {
      if (signal?.aborted) return;
      console.error('Erro ao buscar PEA do aluno:', erro);
      setPeasDoAluno([]);
      setPeaAtual(null);
      if (pathnameRef.current.endsWith('/pea')) {
        const prob = erro as Partial<ProblemDetailRFC9457>;
        adicionarToast(
          'erro',
          prob?.title || 'Erro ao carregar PEA',
          prob?.detail || 'Não foi possível consultar os planos do aluno.'
        );
      }
    } finally {
      if (!signal?.aborted) setLoadingPea(false);
    }
  }, [adicionarToast]);

  const carregarPlanosAcaoDoAluno = useCallback(async (alunoId: string, signal?: AbortSignal) => {
    setLoadingPlanoAcao(true);
    try {
      const planos = await PlanoAcaoService.listarPorAluno(alunoId, signal);
      if (signal?.aborted) return;
      setPlanosAcaoDoAluno(planos);
      setPlanoAcaoEmFocoId((prev) =>
        prev === '__novo__' || (prev && planos.some((p) => p.id === prev))
          ? prev
          : (planos[0]?.id ?? null)
      );
    } catch (erro: unknown) {
      if (signal?.aborted) return;
      console.error('Erro ao buscar Planos de Ação do aluno:', erro);
      setPlanosAcaoDoAluno([]);
      setPlanoAcaoEmFocoId(null);
      if (pathnameRef.current.endsWith('/plano-de-acao')) {
        const prob = erro as Partial<ProblemDetailRFC9457>;
        adicionarToast(
          'erro',
          prob?.title || 'Erro ao carregar Plano de Ação',
          prob?.detail || 'Não foi possível consultar os planos de ação do aluno.'
        );
      }
    } finally {
      if (!signal?.aborted) setLoadingPlanoAcao(false);
    }
  }, [adicionarToast]);

  const carregarHeader = useCallback(async (alunoId: string, signal?: AbortSignal) => {
    setLoadingHeader(true);
    setErrorHeader(null);
    setErroAlunoRota(null);
    try {
      const estudante = await GestaoEstudantesService.buscarPorId(alunoId, signal);
      if (signal?.aborted) return;
      const resumo = resumoParaAluno(estudante);
      alunoSelecionadoRef.current = resumo;
      ultimoAlunoCarregadoRef.current = estudante.id;
      setAlunoSelecionado(resumo);
      setHeader(estudanteParaHeader(estudante));
    } catch (e: unknown) {
      if (signal?.aborted) return;
      console.error('Erro ao carregar header do aluno:', e);
      const err = e as { message?: string; status?: number };
      const msg = err?.message || 'Erro ao carregar dados do estudante.';
      setErrorHeader(msg);
      setHeader(null);
      if (err?.status === 404 || alunoSelecionadoRef.current?.id !== alunoId) {
        alunoSelecionadoRef.current = null;
        ultimoAlunoCarregadoRef.current = null;
        setErroAlunoRota(msg);
        setAlunoSelecionado(null);
      }
    } finally {
      if (!signal?.aborted) setLoadingHeader(false);
    }
  }, []);

  const carregarTimeline = useCallback(async (alunoId: string, signal?: AbortSignal) => {
    setLoadingTimeline(true);
    setErrorTimeline(null);
    try {
      const data = await getTimeline(alunoId, signal);
      if (signal?.aborted) return;
      setTimeline(data || []);
    } catch (e: unknown) {
      if (signal?.aborted) return;
      console.error('Erro ao carregar linha do tempo:', e);
      const prob = e as Partial<ProblemDetailRFC9457> & { message?: string };
      setErrorTimeline(
        prob?.detail ||
          prob?.title ||
          (typeof prob?.message === 'string' ? prob.message : null) ||
          'Erro ao carregar linha do tempo'
      );
      setTimeline([]);
    } finally {
      if (!signal?.aborted) setLoadingTimeline(false);
    }
  }, []);

  // Carrega catálogo de indicadores ao autenticar
  useEffect(() => {
    if (!autenticado) return;

    const controlador = new AbortController();
    GestaoEstudantesService.listarTags(controlador.signal)
      .then((tags) => {
        if (controlador.signal.aborted) return;
        setIndicadores(
          tags.map((t) => ({
            id: t.id ?? '',
            nome: t.nome,
            descricao: t.descricao ?? '',
          }))
        );
      })
      .catch((e) => {
        if (controlador.signal.aborted) return;
        console.error('Erro ao listar tags de indicadores do banco:', e);
      });

    return () => {
      controlador.abort();
    };
  }, [autenticado]);

  // Carrega ou recarrega o prontuário sempre que entrar em uma rota de estudante (inclusive mesmo ID ou F5)
  useEffect(() => {
    if (!autenticado || !routeAlunoId) return;

    const controlador = new AbortController();
    const { signal } = controlador;
    const mudouAluno = ultimoAlunoCarregadoRef.current !== routeAlunoId;
    ultimoAlunoCarregadoRef.current = routeAlunoId;

    const carregarProntuario = async () => {
      // Recarga completa: volta o foco para a versão mais recente do Estudo de Caso
      setEstudoEmFocoId(null);
      setIniciandoNovaVersao(false);

      if (mudouAluno) {
        alunoSelecionadoRef.current = null;
        setAlunoSelecionado(null);
        setEstudoAtual(null);
        setEstudosDoAluno([]);
        setPeiAtual(null);
        setPeaAtual(null);
        setPeasDoAluno([]);
        setPlanosAcaoDoAluno([]);
        setPlanoAcaoEmFocoId(null);
        setHeader(null);
        setTimeline([]);
      }

      await Promise.all([
        carregarHeader(routeAlunoId, signal),
        carregarEstudosDoAluno(routeAlunoId, signal),
        carregarPeiDoAluno(routeAlunoId, signal),
        carregarPeaDoAluno(routeAlunoId, signal),
        carregarPlanosAcaoDoAluno(routeAlunoId, signal),
        carregarTimeline(routeAlunoId, signal),
      ]);
    };

    void carregarProntuario();

    return () => {
      controlador.abort();
    };
  }, [
    autenticado,
    routeAlunoId,
    revisaoProntuario,
    carregarHeader,
    carregarEstudosDoAluno,
    carregarPeiDoAluno,
    carregarPeaDoAluno,
    carregarPlanosAcaoDoAluno,
    carregarTimeline,
  ]);

  const irParaProntuario = useCallback(
    (alunoId: string) => navigate(`/estudantes/${alunoId}/prontuario`),
    [navigate]
  );

  const handleSalvarPei = async (dados: DadosFormularioPei) => {
    if (!alunoSelecionado) return;
    setIsLoading(true);
    try {
      const payload = {
        semestreAno: dados.semestreAno.trim(),
        historicoEstudante: dados.historicoEstudante.trim(),
        necessidadesEspecificas: dados.necessidadesEspecificas.trim(),
        habilidadesInteresses: dados.habilidadesInteresses.trim(),
        dificuldadesApresentadas: dados.dificuldadesApresentadas.trim(),
        propostasAdaptacoes: dados.propostasAdaptacoes.trim(),
      };
      let resultado: PeiResponseDTO;
      if (peiAtual) {
        resultado = await PeiService.atualizar(peiAtual.id, payload);
      } else {
        const acomp = await PeiService.buscarAcompanhamentoPorAluno(alunoSelecionado.id);
        resultado = await PeiService.criar({
          acompanhamentoId: acomp.id,
          ...payload,
        });
      }
      setPeiAtual(resultado);
      await carregarTimeline(alunoSelecionado.id);
      irParaProntuario(alunoSelecionado.id);
      adicionarToast('sucesso', 'PEI Salvo com Sucesso', 'O Plano Educacional Individualizado foi registrado.');
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      adicionarToast('erro', prob?.title || 'Falha ao Salvar PEI', prob?.detail || 'Não foi possível salvar o PEI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvarPea = async (dados: DadosFormularioPea) => {
    if (!alunoSelecionado) return;
    setIsLoading(true);

    try {
      const peiId = dados.peiId || peiAtual?.id || null;
      const disciplinaId = dados.disciplinaId ? dados.disciplinaId.trim() : null;
      const componenteCurricular = dados.componenteCurricular.trim();
      const semestreAno = dados.semestreAno.trim();
      const docente = dados.docente.trim();
      const objetivoGeral = dados.objetivoGeral.trim();
      const objetivosEspecificos = dados.objetivosEspecificos.trim();
      const conteudosProgramaticos = dados.conteudosProgramaticos.trim();
      const metodologia = dados.metodologia.trim();
      const avaliacao = dados.avaliacao.trim();
      const bibliografiaBasica = dados.bibliografiaBasica.trim();
      const bibliografiaComplementar = dados.bibliografiaComplementar.trim();

      let resultado: PeaResponseDTO;

      if (peaAtual) {
        resultado = await PeaService.atualizar(
          peaAtual.id,
          {
            peiId,
            disciplinaId,
            componenteCurricular,
            semestreAno,
            docente,
            objetivoGeral,
            objetivosEspecificos,
            conteudosProgramaticos,
            metodologia,
            avaliacao,
            bibliografiaBasica,
            bibliografiaComplementar,
          }
        );
      } else {
        let acompanhamentoId = peiAtual?.acompanhamentoId || peasDoAluno[0]?.acompanhamentoId;
        if (!acompanhamentoId) {
          const acomp = await PeiService.buscarAcompanhamentoPorAluno(alunoSelecionado.id);
          acompanhamentoId = acomp.id;
        }

        if (!acompanhamentoId) {
          adicionarToast(
            'erro',
            'Acompanhamento não encontrado',
            'Não foi identificado um acompanhamento para este aluno no banco de dados.'
          );
          return;
        }

        resultado = await PeaService.criar({
          acompanhamentoId,
          peiId,
          disciplinaId,
          componenteCurricular,
          semestreAno,
          docente,
          objetivoGeral,
          objetivosEspecificos,
          conteudosProgramaticos,
          metodologia,
          avaliacao,
          bibliografiaBasica,
          bibliografiaComplementar,
        });
      }

      setPeaAtual(resultado);
      await carregarTimeline(alunoSelecionado.id);
      await carregarPeaDoAluno(alunoSelecionado.id);

      irParaProntuario(alunoSelecionado.id);

      adicionarToast(
        'sucesso',
        'PEA salvo com sucesso',
        'O Plano de Ensino Adaptado foi registrado.'
      );
    } catch (erro: unknown) {
      const prob = erro as Partial<ProblemDetailRFC9457>;
      const titulo =
        prob?.status === 409 || prob?.title === 'Conflito de Recursos'
          ? 'Conflito no PEA'
          : (prob?.title || 'Erro ao salvar PEA');
      adicionarToast(
        'erro',
        titulo,
        prob?.detail || 'Não foi possível salvar o PEA.'
      );
      throw erro;
    } finally {
      setIsLoading(false);
    }
  };

  // Persiste o formulário: atualiza a versão em foco ou cria o primeiro estudo / uma nova versão (TA2.4)
  const persistirEstudo = (
    alunoId: string,
    payload: EstudoDeCasoUpdateDTO
  ): Promise<EstudoDeCasoResponseDTO> => {
    if (estudoEmFoco) return EstudoDeCasoService.atualizar(estudoEmFoco.id, payload);
    const novo = { alunoId, ...payload };
    return iniciandoNovaVersao
      ? EstudoDeCasoService.criarNovaAvaliacao(novo)
      : EstudoDeCasoService.criar(novo);
  };

  // Ação: Salvar Rascunho
  const handleSalvarRascunho = async (dados: DadosFormularioEstudo) => {
    if (!alunoSelecionado) return;
    if (estudoEmFoco && ehEstudoConcluido(estudoEmFoco)) {
      adicionarToast(
        'erro',
        'Operação Não Permitida',
        'Não é permitido reverter um Estudo de Caso concluído para Rascunho. Utilize "Reabrir Estudo de Caso".'
      );
      return;
    }
    setIsLoading(true);
    try {
      const resultado = await persistirEstudo(alunoSelecionado.id, {
        status: 'RASCUNHO',
        diagnosticoInicial: dados.diagnostico.trim(),
        historico: dados.historico.trim(),
        indicadoresIds: dados.indicadoresIds,
      });

      await sincronizarEstudos(alunoSelecionado.id, resultado);
      await carregarTimeline(alunoSelecionado.id);
      adicionarToast(
        'sucesso',
        'Rascunho Salvo com Sucesso',
        'As informações parciais do Estudo de Caso foram armazenadas com segurança.'
      );
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      adicionarToast(
        'erro',
        prob?.title || 'Falha ao Salvar Rascunho',
        prob?.detail || 'Não foi possível salvar o rascunho.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Ação: Concluir Estudo de Caso (Após validação de front TA2.3)
  const handleConcluir = async (dados: DadosFormularioEstudo) => {
    if (!alunoSelecionado) return;
    if (estudoEmFoco && ehEstudoConcluido(estudoEmFoco)) {
      adicionarToast(
        'erro',
        'Operação Não Permitida',
        'Não é permitido alterar um Estudo de Caso já concluído. Utilize "Reabrir Estudo de Caso".'
      );
      return;
    }
    setIsLoading(true);
    try {
      // A versão vigente concluída é ATIVO; versões substituídas são encerradas pelo backend (TA2.4).
      const resultado = await persistirEstudo(alunoSelecionado.id, {
        status: 'ATIVO',
        diagnosticoInicial: dados.diagnostico.trim(),
        historico: dados.historico.trim(),
        indicadoresIds: dados.indicadoresIds,
      });

      await sincronizarEstudos(alunoSelecionado.id, resultado);
      await carregarTimeline(alunoSelecionado.id);
      irParaProntuario(alunoSelecionado.id);
      adicionarToast(
        'sucesso',
        'Estudo de Caso Concluído!',
        'Documento finalizado com sucesso. O aluno agora está liberado para criação do Plano de Ação.'
      );
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      adicionarToast(
        'erro',
        prob?.title || 'Falha ao Concluir',
        prob?.detail || 'Ocorreu um erro ao concluir o estudo de caso.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Ação: Reabrir Estudo de Caso concluído (TA2.2) - volta para RASCUNHO com auditoria
  const handleReabrirEstudo = async (estudoId: string) => {
    if (!alunoSelecionado) return;
    setIsLoading(true);
    try {
      const resultado = await EstudoDeCasoService.reabrir(estudoId);
      await sincronizarEstudos(alunoSelecionado.id, resultado);
      await carregarTimeline(alunoSelecionado.id);
      adicionarToast(
        'sucesso',
        'Estudo de Caso Reaberto',
        'O estudo voltou para Rascunho e a reabertura foi registrada na auditoria.'
      );
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      adicionarToast(
        'erro',
        prob?.title || 'Falha ao Reabrir',
        prob?.detail || 'Não foi possível reabrir o Estudo de Caso.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Ação: Descartar Rascunho (DELETE)
  const handleExcluirRascunho = async () => {
    if (!estudoEmFoco || !alunoSelecionado) return;

    setIsLoading(true);
    try {
      await EstudoDeCasoService.excluir(estudoEmFoco.id);
      setEstudoEmFocoId(null);
      await sincronizarEstudos(alunoSelecionado.id);
      await carregarTimeline(alunoSelecionado.id);
      irParaProntuario(alunoSelecionado.id);
      adicionarToast(
        'sucesso',
        'Rascunho Descartado',
        'O rascunho foi removido. As versões anteriores do estudo foram preservadas.'
      );
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      adicionarToast(
        'erro',
        prob?.title || 'Falha ao Excluir',
        prob?.detail || 'Não foi possível excluir o rascunho.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const estudoConcluidoParaPlanoAcao =
    estudosDoAluno.some(ehEstudoConcluido) || (!!estudoAtual && ehEstudoConcluido(estudoAtual));

  const planoAcaoEmFoco: PlanoAcaoResponseDTO | null =
    planoAcaoEmFocoId === '__novo__'
      ? null
      : (planosAcaoDoAluno.find((p) => p.id === planoAcaoEmFocoId) ?? planosAcaoDoAluno[0] ?? null);

  const handleCriarPlanoAcao = () => {
    if (!alunoSelecionado) return;
    if (!estudoConcluidoParaPlanoAcao) {
      adicionarToast(
        'alerta',
        'Plano de Ação Bloqueado',
        'É necessário concluir o Estudo de Caso antes de criar ou editar o Plano de Ação.'
      );
      return;
    }
    setPlanoAcaoEmFocoId(planosAcaoDoAluno[0]?.id ?? '__novo__');
    navigate(`/estudantes/${alunoSelecionado.id}/plano-de-acao`);
  };

  const handleSalvarPlanoAcao = async (dados: DadosFormularioPlanoAcao) => {
    if (!alunoSelecionado) return;
    setIsLoading(true);
    try {
      const payload = {
        demandasIdentificadas: dados.demandasIdentificadas.trim(),
        propostasIntervencao: dados.propostasIntervencao.trim(),
        componenteCurricular: dados.componenteCurricular.trim() || null,
        semestreAno: dados.semestreAno.trim() || null,
        docente: dados.docente.trim() || null,
        objetivoGeral: dados.objetivoGeral.trim() || null,
        objetivosEspecificos: dados.objetivosEspecificos.trim() || null,
        conteudosProgramaticos: dados.conteudosProgramaticos.trim() || null,
        metodologia: dados.metodologia.trim() || null,
        avaliacao: dados.avaliacao.trim() || null,
        bibliografiaBasica: dados.bibliografiaBasica.trim() || null,
        bibliografiaComplementar: dados.bibliografiaComplementar.trim() || null,
      };

      let resultado: PlanoAcaoResponseDTO;
      if (planoAcaoEmFoco) {
        resultado = await PlanoAcaoService.atualizar(planoAcaoEmFoco.id, payload);
        setPlanosAcaoDoAluno((prev) =>
          prev.map((item) => (item.id === resultado.id ? resultado : item))
        );
      } else {
        let acompanhamentoId =
          peiAtual?.acompanhamentoId ||
          peasDoAluno[0]?.acompanhamentoId ||
          planosAcaoDoAluno[0]?.acompanhamentoId;
        if (!acompanhamentoId) {
          const acomp = await PlanoAcaoService.buscarAcompanhamentoPorAluno(alunoSelecionado.id);
          acompanhamentoId = acomp.id;
        }
        resultado = await PlanoAcaoService.criar({
          acompanhamentoId,
          ...payload,
        });
        setPlanosAcaoDoAluno((prev) => [resultado, ...prev]);
      }

      setPlanoAcaoEmFocoId(resultado.id);
      await carregarTimeline(alunoSelecionado.id);
      const referencia =
        resultado.componenteCurricular || resultado.semestreAno || 'Anexo III';
      adicionarToast(
        'sucesso',
        planoAcaoEmFoco ? 'Plano de Ação Atualizado' : 'Plano de Ação Criado',
        `Plano de Ação (${referencia}) salvo com sucesso.`
      );
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      adicionarToast(
        'erro',
        prob?.title || 'Falha ao Salvar Plano de Ação',
        prob?.detail || 'Não foi possível salvar o Plano de Ação.'
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcluirPlanoAcao = async (planoId: string) => {
    if (!alunoSelecionado) return;
    setIsLoading(true);
    try {
      await PlanoAcaoService.excluir(planoId);
      const restantes = planosAcaoDoAluno.filter((item) => item.id !== planoId);
      setPlanosAcaoDoAluno(restantes);
      setPlanoAcaoEmFocoId(restantes[0]?.id ?? '__novo__');
      await carregarTimeline(alunoSelecionado.id);
      adicionarToast(
        'sucesso',
        'Plano de Ação Excluído',
        'O registro foi removido com sucesso.'
      );
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      adicionarToast(
        'erro',
        prob?.title || 'Falha ao Excluir Plano de Ação',
        prob?.detail || 'Não foi possível excluir o Plano de Ação.'
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // TA2.4: versões do Estudo de Caso (mais recente primeiro) e versão em foco no formulário
  const estudoMaisRecente = estudosDoAluno[0] ?? null;
  const estudoEmFoco: EstudoDeCasoResponseDTO | null = iniciandoNovaVersao
    ? null
    : (estudosDoAluno.find((e) => e.id === estudoEmFocoId) ?? estudoMaisRecente);
  const estudoMaisRecenteConcluido = !!estudoMaisRecente && ehEstudoConcluido(estudoMaisRecente);
  // Só a versão mais recente pode ser reaberta; versões anteriores ficam como histórico somente leitura
  const podeReabrirEstudoEmFoco =
    !!estudoEmFoco && ehEstudoConcluido(estudoEmFoco) && estudoEmFoco.id === estudoMaisRecente?.id;
  const podeIniciarNovaAvaliacao = !iniciandoNovaVersao && estudoMaisRecenteConcluido;

  const handleSelecionarVersao = (estudoId: string) => {
    setIniciandoNovaVersao(false);
    setEstudoEmFocoId(estudoId);
  };

  const handleIniciarNovaAvaliacao = () => {
    if (!estudoMaisRecenteConcluido) {
      adicionarToast(
        'alerta',
        'Nova Avaliação Indisponível',
        'Conclua o Estudo de Caso em andamento antes de iniciar uma nova avaliação.'
      );
      return;
    }
    setIniciandoNovaVersao(true);
  };

  const handleCancelarNovaAvaliacao = () => {
    setIniciandoNovaVersao(false);
    setEstudoEmFocoId(estudoMaisRecente?.id ?? null);
  };

  const dificuldadesDoEstudo = estudoAtual
    ? indicadores.filter((ind) => (estudoAtual.indicadoresIds ?? []).includes(ind.id))
    : [];

  // Dados pré-carregados do aluno em foco para os modais (Ref. TA9.3)
  const alunoEmFoco: AlunoModalData = {
    id: alunoSelecionado?.id || '',
    nome: header?.nome || alunoSelecionado?.nome || 'Estudante',
    matricula: header?.matricula || alunoSelecionado?.matricula || '',
    curso: header?.curso || alunoSelecionado?.curso || 'Não informado',
    turma: alunoSelecionado?.turma || '',
  };

  // US12: seleciona o aluno na listagem, força recarga completa e navega para rota parametrizada.
  const abrirProntuarioDaListagem = (estudante: EstudanteResumo) => {
    if (alunoSelecionado?.id !== estudante.id) {
      setEstudoAtual(null);
      setEstudosDoAluno([]);
      setEstudoEmFocoId(null);
      setIniciandoNovaVersao(false);
      setPeiAtual(null);
      setPeaAtual(null);
      setPeasDoAluno([]);
      setPlanosAcaoDoAluno([]);
      setPlanoAcaoEmFocoId(null);
      setTimeline([]);
    }
    setErroAlunoRota(null);
    setErrorHeader(null);
    setErrorTimeline(null);
    setLoadingHeader(true);
    setLoadingTimeline(true);
    setCarregandoEstudo(true);
    setLoadingPei(true);
    setLoadingPea(true);
    setLoadingPlanoAcao(true);
    const resumo = resumoParaAluno(estudante);
    alunoSelecionadoRef.current = resumo;
    ultimoAlunoCarregadoRef.current = estudante.id;
    setAlunoSelecionado(resumo);
    setHeader(estudanteParaHeader(estudante));
    setRevisaoProntuario((v) => v + 1);
    navigate(`/estudantes/${estudante.id}/prontuario`);
  };

  const handleEstudanteSalvo = (estudante: EstudanteResumo) => {
    if (alunoSelecionado?.id === estudante.id) {
      const resumo = resumoParaAluno(estudante);
      alunoSelecionadoRef.current = resumo;
      setAlunoSelecionado(resumo);
      setHeader(estudanteParaHeader(estudante));
    }
  };

  const isLogin = location.pathname === '/login';

  return (
    <div
      className={`${
        isLogin ? 'h-screen overflow-hidden' : 'min-h-screen'
      } bg-[#F8FAF8] flex flex-col justify-between selection:bg-ifpb-teal selection:text-white`}
    >
      {/* Alertas Toasts flutuantes */}
      <ToastAlert toasts={toasts} onFechar={removerToast} />

      {/* Modal global de sigilo clínico/LGPD (403) */}
      <ModalAcessoNegadoLGPD />

      {/* Cabeçalho Oficial do IFPB (totalmente ocultado na tela de login) */}
      {!isLogin && (
        <HeaderIFPB
          searchTerm={termoBusca}
          onSearch={setTermoBusca}
          subTitle={
            location.pathname.startsWith('/admin')
              ? 'Gestão de Acessos e Usuários (RBAC)'
              : location.pathname === '/estudantes/novo'
              ? 'Cadastro de Estudante'
              : location.pathname.startsWith('/estudantes/') && location.pathname.endsWith('/editar')
              ? 'Edição de Estudante'
              : location.pathname === '/estudantes'
              ? 'Gestão de Estudantes'
              : matchEstudo || location.pathname === '/estudo-de-caso'
              ? 'Formulário de Estudo de Caso'
              : matchPei || location.pathname === '/pei'
                ? 'Plano Educacional Individualizado (PEI)'
                : matchPea || location.pathname === '/pea'
                  ? 'Plano de Ensino Adaptado (PEA)'
                  : matchPlanoAcao || location.pathname === '/plano-de-acao'
                    ? 'Plano de Ação (Anexo III)'
                    : 'Ficha do Estudante'
          }
        />
      )}

      {/* Conteúdo Principal */}
      <main
        className={`w-full flex-1 ${
          isLogin
            ? 'flex items-center justify-center p-4 overflow-y-auto'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
        }`}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RotaProtegida />}>
            <Route
              path="/admin/usuarios"
              element={<PainelAdminUsuarios onNotificar={adicionarToast} />}
            />
            <Route path="/admin" element={<Navigate to="/admin/usuarios" replace />} />
            <Route
              path="/estudantes"
              element={<AreaGestaoEstudantes onAbrirProntuario={abrirProntuarioDaListagem} />}
            />
            <Route
              path="/estudantes/novo"
              element={
                <FormularioEstudante
                  onNotificar={adicionarToast}
                  onEstudanteSalvo={handleEstudanteSalvo}
                />
              }
            />
            <Route
              path="/estudantes/:id/editar"
              element={
                <FormularioEstudante
                  onNotificar={adicionarToast}
                  onEstudanteSalvo={handleEstudanteSalvo}
                />
              }
            />
            <Route path="/estudantes/:id" element={<RedirecionarParaProntuario />} />

            <Route path="/" element={<Navigate to="/estudantes" replace />} />
            <Route
              path="/estudo-de-caso"
              element={
                <Navigate
                  to={alunoSelecionado ? `/estudantes/${alunoSelecionado.id}/estudo-de-caso` : '/estudantes'}
                  replace
                />
              }
            />
            <Route
              path="/pei"
              element={
                <Navigate
                  to={alunoSelecionado ? `/estudantes/${alunoSelecionado.id}/pei` : '/estudantes'}
                  replace
                />
              }
            />
            <Route
              path="/pea"
              element={
                <Navigate
                  to={alunoSelecionado ? `/estudantes/${alunoSelecionado.id}/pea` : '/estudantes'}
                  replace
                />
              }
            />
            <Route
              path="/plano-de-acao"
              element={
                <Navigate
                  to={
                    alunoSelecionado
                      ? `/estudantes/${alunoSelecionado.id}/plano-de-acao`
                      : '/estudantes'
                  }
                  replace
                />
              }
            />

            <Route
              path="/estudantes/:id/prontuario"
              element={
                erroAlunoRota ? (
                  <CardErroEstudante
                    mensagem={erroAlunoRota}
                    onVoltar={() => navigate('/estudantes')}
                  />
                ) : !alunoSelecionado ? (
                  <CardCarregamento mensagem="Carregando dados do estudante..." />
                ) : (
                  <>
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => navigate('/estudantes')}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover cursor-pointer transition-colors px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 shadow-2xs"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Gestão de Estudantes
                      </button>
                    </div>

                    {header && <StudentHeader header={header} />}
                    {!header && (loadingHeader || errorHeader) && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        {loadingHeader && (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ifpb-teal"></div>
                            <span className="ml-3 text-sm text-gray-600">Carregando cabeçalho...</span>
                          </div>
                        )}
                        {errorHeader && !loadingHeader && (
                          <p className="text-sm text-red-700">Erro ao carregar cabeçalho: {errorHeader}</p>
                        )}
                      </div>
                    )}

                    {/* Barra de Atalhos Rápidos do Prontuário (Task #13 / US 09) */}
                    <ProntuarioQuickActions
                      alunoNome={alunoEmFoco.nome}
                      estudoStatus={estudoAtual?.status ?? null}
                      carregandoEstudo={carregandoEstudo}
                      onNovoAtendimento={() => setModalAtivo('ATENDIMENTO')}
                      onNovoEstudo={() => {
                        if (estudoAtual?.status === 'ENCERRADO' || estudoAtual?.status === 'ATIVO') {
                          adicionarToast(
                            'alerta',
                            'Estudo de Caso Já Concluído',
                            'Este estudante já possui um Estudo de Caso concluído. Exibindo o registro em modo visualização.'
                          );
                          navigate(`/estudantes/${alunoSelecionado.id}/estudo-de-caso`);
                          return;
                        }
                        setModalAtivo('ESTUDO');
                      }}
                      onEmitirRae={() => setModalAtivo('EMITIR_RAE')}
                      onGerarDossie={() => setModalAtivo('GERAR_DOSSIE')}
                    />

                    <div className="mb-6">
                      <Timeline events={timeline} loading={loadingTimeline} error={errorTimeline} />
                    </div>

                    <TelaAluno
                      alunoSelecionado={alunoSelecionado}
                      estudoAtual={estudoAtual}
                      indicadores={indicadores}
                      onAbrirFormularioEstudo={() => navigate(`/estudantes/${alunoSelecionado.id}/estudo-de-caso`)}
                      onCriarPlanoAcao={handleCriarPlanoAcao}
                      quantidadePlanosAcao={planosAcaoDoAluno.length}
                      peiAtual={peiAtual}
                      onAbrirFormularioPei={() => navigate(`/estudantes/${alunoSelecionado.id}/pei`)}
                      onAbrirFormularioPea={() => navigate(`/estudantes/${alunoSelecionado.id}/pea`)}
                    />

                    {/* US 09 / TA11.2 e TA11.3: históricos sensíveis e anexos com RBAC visual */}
                    <div className="mt-6">
                      <SecaoProntuarioRbac key={alunoSelecionado.id} alunoId={alunoSelecionado.id} />
                    </div>
                  </>
                )
              }
            />
            <Route
              path="/estudantes/:id/pei"
              element={
                erroAlunoRota ? (
                  <CardErroEstudante
                    mensagem={erroAlunoRota}
                    onVoltar={() => navigate('/estudantes')}
                  />
                ) : !alunoSelecionado || loadingPei ? (
                  <CardCarregamento mensagem="Carregando Plano Educacional Individualizado (PEI)..." />
                ) : (
                  <FormularioPei
                    aluno={alunoSelecionado}
                    peiExistente={peiAtual}
                    dificuldades={dificuldadesDoEstudo}
                    peasVinculados={peasDoAluno}
                    onAbrirPea={(pea) => {
                      setPeaAtual(pea ?? null);
                      navigate(`/estudantes/${alunoSelecionado.id}/pea`);
                    }}
                    onSalvar={handleSalvarPei}
                    onVoltar={() => irParaProntuario(alunoSelecionado.id)}
                    isLoading={isLoading}
                  />
                )
              }
            />
            <Route
              path="/estudantes/:id/pea"
              element={
                erroAlunoRota ? (
                  <CardErroEstudante
                    mensagem={erroAlunoRota}
                    onVoltar={() => navigate('/estudantes')}
                  />
                ) : !alunoSelecionado || loadingPea ? (
                  <CardCarregamento mensagem="Carregando Plano de Ensino Adaptado (PEA)..." />
                ) : (
                  <FormularioPea
                    aluno={alunoSelecionado}
                    peaExistente={peaAtual}
                    peasExistentes={peasDoAluno}
                    onSelecionarPea={(pea) => setPeaAtual(pea)}
                    onNovoPea={() => setPeaAtual(null)}
                    peiId={peiAtual?.id}
                    peiSemestreAno={peiAtual?.semestreAno}
                    onSalvar={handleSalvarPea}
                    onVoltar={() => irParaProntuario(alunoSelecionado.id)}
                    isLoading={isLoading}
                  />
                )
              }
            />
            <Route
              path="/estudantes/:id/plano-de-acao"
              element={
                erroAlunoRota ? (
                  <CardErroEstudante
                    mensagem={erroAlunoRota}
                    onVoltar={() => navigate('/estudantes')}
                  />
                ) : !alunoSelecionado || loadingPlanoAcao || carregandoEstudo ? (
                  <CardCarregamento mensagem="Carregando Plano de Ação..." />
                ) : !estudoConcluidoParaPlanoAcao && planosAcaoDoAluno.length === 0 ? (
                  <CardErroEstudante
                    mensagem="O Plano de Ação só pode ser elaborado após a conclusão do Estudo de Caso (TA2.1)."
                    onVoltar={() => irParaProntuario(alunoSelecionado.id)}
                  />
                ) : (
                  <FormularioPlanoAcao
                    key={planoAcaoEmFoco?.id ?? 'novo'}
                    aluno={alunoSelecionado}
                    planoExistente={planoAcaoEmFoco}
                    planosExistentes={planosAcaoDoAluno}
                    onSelecionarPlano={(planoId) => setPlanoAcaoEmFocoId(planoId)}
                    onNovoPlano={() => setPlanoAcaoEmFocoId('__novo__')}
                    onSalvar={handleSalvarPlanoAcao}
                    onExcluir={handleExcluirPlanoAcao}
                    onVoltar={() => irParaProntuario(alunoSelecionado.id)}
                    isLoading={isLoading}
                  />
                )
              }
            />
            <Route
              path="/estudantes/:id/estudo-de-caso"
              element={
                erroAlunoRota ? (
                  <CardErroEstudante
                    mensagem={erroAlunoRota}
                    onVoltar={() => navigate('/estudantes')}
                  />
                ) : !alunoSelecionado || carregandoEstudo ? (
                  <CardCarregamento mensagem="Carregando Estudo de Caso..." />
                ) : (
                  <FormularioEstudoDeCaso
                    aluno={alunoSelecionado}
                    estudoExistente={estudoEmFoco}
                    versoes={estudosDoAluno}
                    novaAvaliacaoEmAndamento={iniciandoNovaVersao}
                    indicadoresDisponiveis={indicadores}
                    onSalvarRascunho={handleSalvarRascunho}
                    onConcluir={handleConcluir}
                    onExcluirRascunho={estudoEmFoco?.status === 'RASCUNHO' ? handleExcluirRascunho : undefined}
                    onReabrir={podeReabrirEstudoEmFoco ? handleReabrirEstudo : undefined}
                    onSelecionarVersao={handleSelecionarVersao}
                    onNovaAvaliacao={podeIniciarNovaAvaliacao ? handleIniciarNovaAvaliacao : undefined}
                    onCancelarNovaAvaliacao={handleCancelarNovaAvaliacao}
                    onVoltar={() => irParaProntuario(alunoSelecionado.id)}
                    isLoading={isLoading}
                  />
                )
              }
            />
            <Route path="*" element={<Navigate to="/estudantes" replace />} />
          </Route>
        </Routes>
      </main>

      {/* Modais de Ações Rápidas do Prontuário com Aluno Pré-carregado (Ref. TA9.3) */}
      <ModalNovoAtendimento
        isOpen={modalAtivo === 'ATENDIMENTO'}
        onClose={() => setModalAtivo(null)}
        aluno={alunoEmFoco}
        onSuccess={() => {
          adicionarToast(
            'sucesso',
            'Atendimento Registrado Localmente',
            `Novo atendimento registrado localmente para ${alunoEmFoco.nome} (${alunoEmFoco.matricula}). A integração com a Linha do Tempo será habilitada em etapa futura.`
          );
        }}
        onError={(titulo, detalhe) => adicionarToast('erro', titulo, detalhe)}
      />

      <ModalNovoEstudo
        key={`modal-estudo-${estudoAtual?.id || 'novo'}-${estudoAtual?.status || 'pendente'}`}
        isOpen={modalAtivo === 'ESTUDO'}
        onClose={() => setModalAtivo(null)}
        aluno={alunoEmFoco}
        indicadoresDisponiveis={indicadores}
        estudoExistente={estudoAtual}
        onSuccess={async (estudo, modo) => {
          if (alunoSelecionado) {
            await sincronizarEstudos(alunoSelecionado.id, estudo);
            await carregarTimeline(alunoSelecionado.id);
          } else {
            setEstudoAtual(estudo);
          }
          adicionarToast(
            'sucesso',
            modo === 'RASCUNHO' ? 'Rascunho de Estudo Salvo' : 'Estudo de Caso Concluído!',
            modo === 'RASCUNHO'
              ? `O rascunho de ${alunoEmFoco.nome} foi salvo e registrado na Linha do Tempo.`
              : `Estudo de Caso de ${alunoEmFoco.nome} finalizado e Linha do Tempo atualizada.`
          );
        }}
        onError={(titulo, detalhe) => adicionarToast('erro', titulo, detalhe)}
      />

      <ModalConfirmacaoAcao
        isOpen={modalAtivo === 'EMITIR_RAE' || modalAtivo === 'GERAR_DOSSIE'}
        onClose={() => setModalAtivo(null)}
        aluno={alunoEmFoco}
        tipoDocumento={modalAtivo === 'EMITIR_RAE' ? 'RAE' : 'DOSSIE'}
        onSuccess={(doc) => {
          adicionarToast(
            'sucesso',
            doc.tipoDocumento === 'RAE' ? 'RAE Emitido com Sucesso' : 'Dossiê Gerado com Sucesso',
            doc.resumo
          );
        }}
        onError={(titulo, detalhe) => adicionarToast('erro', titulo, detalhe)}
      />

      {/* Rodapé Institucional */}
      <footer
        className={`w-full bg-[#1A2E26] text-gray-300 text-xs border-t border-gray-800 ${
          isLogin ? 'py-3 sm:py-4 mt-0' : 'py-6 mt-12'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-ifpb-green"></div>
            <p className="font-medium text-white">
              Instituto Federal de Educação, Ciência e Tecnologia da Paraíba &bull; Campus Cajazeiras
            </p>
          </div>
          <p className="text-gray-400">
            CLAI - Coordenação Local de Acessibilidade e Inclusão &bull; Sistema SIGI
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  const { autenticado, sessao } = useAuth();
  return <AppConteudo key={autenticado ? (sessao?.userId || 'auth') : 'anon'} />;
};

export default App;
