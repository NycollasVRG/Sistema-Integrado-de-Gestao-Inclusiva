import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { HeaderIFPB } from './components/HeaderIFPB';
import { VLibrasButton } from './components/VLibrasButton';
import { TelaAluno } from './components/TelaAluno';
import { FormularioEstudoDeCaso } from './components/FormularioEstudoDeCaso';
import { FormularioPei } from './components/FormularioPei';
import { ToastAlert, type ToastMessage } from './components/ToastAlert';
import { StudentHeader } from './components/StudentHeader';
import { Timeline } from './components/Timeline';
import { MenuDev } from './components/MenuDev';
import { ProntuarioQuickActions } from './components/ProntuarioQuickActions';
import { ModalNovoAtendimento } from './components/ModalNovoAtendimento';
import { ModalNovoEstudo } from './components/ModalNovoEstudo';
import { ModalConfirmacaoAcao } from './components/ModalConfirmacaoAcao';
import {
  ALUNOS_PADRAO,
  INDICADORES_PADRAO,
  EstudoDeCasoService,
} from './services/estudoDeCasoService';
import { ACOMPANHAMENTO_POR_ALUNO, PeiService } from './services/peiService';
import { getAlunoHeader } from './services/alunoService';
import { getTimeline } from './services/timelineService';
import type { PeiResponseDTO } from './types/pei';
import type { AlunoHeaderData } from './types/alunoHeader';
import type { TimelineEventDTO } from './types/timeline';
import type {
  AlunoModalData,
  ProntuarioModalTipo,
} from './types/prontuarioAcoes';
import type {
  Aluno,
  EstudoDeCasoResponseDTO,
  IndicadorReutilizavel,
  ProblemDetailRFC9457,
} from './types/estudoDeCaso';

export const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alunoSelecionado] = useState<Aluno>(ALUNOS_PADRAO[0]);
  const [indicadores] = useState<IndicadorReutilizavel[]>(INDICADORES_PADRAO);
  const [estudoAtual, setEstudoAtual] = useState<EstudoDeCasoResponseDTO | null>(null);
  const [peiAtual, setPeiAtual] = useState<PeiResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [header, setHeader] = useState<AlunoHeaderData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEventDTO[]>([]);
  const [loadingHeader, setLoadingHeader] = useState<boolean>(false);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [errorTimeline, setErrorTimeline] = useState<string | null>(null);
  const [modalAtivo, setModalAtivo] = useState<ProntuarioModalTipo>(null);

  const adicionarToast = (tipo: 'sucesso' | 'erro' | 'alerta', titulo: string, mensagem: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, tipo, titulo, mensagem }]);
    setTimeout(() => {
      removerToast(id);
    }, 5000);
  };

  const removerToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Carrega os estudos do aluno selecionado
  const carregarEstudosDoAluno = async (alunoId: string) => {
    setIsLoading(true);
    try {
      const estudos = await EstudoDeCasoService.listarPorAluno(alunoId);
      if (estudos && estudos.length > 0) {
        setEstudoAtual(estudos[0]);
      } else {
        setEstudoAtual(null);
      }
    } catch (e: any) {
      console.error('Erro ao buscar estudos do aluno:', e);
      setEstudoAtual(null);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarPeiDoAluno = async (alunoId: string) => {
    try {
      const peis = await PeiService.listarPorAluno(alunoId);
      setPeiAtual(peis.length > 0 ? peis[0] : null);
    } catch (e) {
      console.error('Erro ao buscar PEI do aluno:', e);
      setPeiAtual(null);
    }
  };

  const carregarHeader = async (alunoId: string) => {
    setLoadingHeader(true);
    setErrorHeader(null);
    try {
      const data = await getAlunoHeader(alunoId);
      setHeader(data);
    } catch (e: any) {
      console.error('Erro ao carregar header do aluno:', e);
      setErrorHeader(e?.message || 'Erro ao carregar header do aluno');
      setHeader(null);
    } finally {
      setLoadingHeader(false);
    }
  };

  const carregarTimeline = async (alunoId: string) => {
    setLoadingTimeline(true);
    setErrorTimeline(null);
    try {
      const data = await getTimeline(alunoId);
      setTimeline(data || []);
    } catch (e: any) {
      console.error('Erro ao carregar linha do tempo:', e);
      setErrorTimeline(e?.message || 'Erro ao carregar linha do tempo');
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    carregarEstudosDoAluno(alunoSelecionado.id);
    carregarPeiDoAluno(alunoSelecionado.id);
    carregarHeader(alunoSelecionado.id);
    carregarTimeline(alunoSelecionado.id);
  }, [alunoSelecionado]);

  const handleSalvarPei = async (habilidadesInteresses: string, propostasAdaptacoes: string) => {
    setIsLoading(true);
    try {
      let resultado: PeiResponseDTO;
      if (peiAtual) {
        resultado = await PeiService.atualizar(peiAtual.id, { habilidadesInteresses, propostasAdaptacoes });
      } else {
        resultado = await PeiService.criar(
          {
            acompanhamentoId: ACOMPANHAMENTO_POR_ALUNO[alunoSelecionado.id],
            habilidadesInteresses,
            propostasAdaptacoes,
          },
          alunoSelecionado.id
        );
      }
      setPeiAtual(resultado);
      navigate('/');
      adicionarToast('sucesso', 'PEI Salvo com Sucesso', 'O Plano Educacional Individualizado foi registrado.');
    } catch (err: any) {
      const prob: ProblemDetailRFC9457 = err;
      adicionarToast('erro', prob.title || 'Falha ao Salvar PEI', prob.detail || 'Não foi possível salvar o PEI.');
    } finally {
      setIsLoading(false);
    }
  };

  // Ação: Salvar Rascunho
  const handleSalvarRascunho = async (diagnostico: string, indicadoresIds: string[]) => {
    // Proteção contra edição de estudo concluído via código
    if (estudoAtual?.status === 'ENCERRADO' || estudoAtual?.status === 'ATIVO') {
      adicionarToast(
        'erro',
        'Operação Não Permitida',
        'Não é permitido reverter um Estudo de Caso concluído para Rascunho.'
      );
      return;
    }
    setIsLoading(true);
    try {
      let resultado: EstudoDeCasoResponseDTO;
      if (estudoAtual) {
        resultado = await EstudoDeCasoService.atualizar(estudoAtual.id, {
          status: 'RASCUNHO',
          diagnosticoInicial: diagnostico,
          indicadoresIds,
        });
      } else {
        resultado = await EstudoDeCasoService.criar({
          alunoId: alunoSelecionado.id,
          status: 'RASCUNHO',
          diagnosticoInicial: diagnostico,
          indicadoresIds,
        });
      }

      setEstudoAtual(resultado);
      adicionarToast(
        'sucesso',
        'Rascunho Salvo com Sucesso',
        'As informações parciais do Estudo de Caso foram armazenadas com segurança.'
      );
    } catch (err: any) {
      const prob: ProblemDetailRFC9457 = err;
      adicionarToast(
        'erro',
        prob.title || 'Falha ao Salvar Rascunho',
        prob.detail || 'Não foi possível salvar o rascunho.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Ação: Concluir Estudo de Caso (Após validação de front TA2.3)
  const handleConcluir = async (diagnostico: string, indicadoresIds: string[]) => {
    // Proteção contra alteração de estudo concluído
    if (estudoAtual?.status === 'ENCERRADO' || estudoAtual?.status === 'ATIVO') {
      adicionarToast(
        'erro',
        'Operação Não Permitida',
        'Não é permitido alterar um Estudo de Caso já concluído.'
      );
      return;
    }
    setIsLoading(true);
    try {
      let resultado: EstudoDeCasoResponseDTO;
      if (estudoAtual) {
        resultado = await EstudoDeCasoService.atualizar(estudoAtual.id, {
          status: 'ENCERRADO',
          diagnosticoInicial: diagnostico,
          indicadoresIds,
        });
      } else {
        resultado = await EstudoDeCasoService.criar({
          alunoId: alunoSelecionado.id,
          status: 'ENCERRADO',
          diagnosticoInicial: diagnostico,
          indicadoresIds,
        });
      }

      setEstudoAtual(resultado);
      navigate('/');
      adicionarToast(
        'sucesso',
        'Estudo de Caso Concluído!',
        'Documento finalizado com sucesso. O aluno agora está liberado para criação do Plano de Ação.'
      );
    } catch (err: any) {
      const prob: ProblemDetailRFC9457 = err;
      adicionarToast(
        'erro',
        prob.title || 'Falha ao Concluir',
        prob.detail || 'Ocorreu um erro ao concluir o estudo de caso.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Ação: Descartar Rascunho (DELETE)
  const handleExcluirRascunho = async () => {
    if (!estudoAtual) return;

    setIsLoading(true);
    try {
      await EstudoDeCasoService.excluir(estudoAtual.id);
      setEstudoAtual(null);
      navigate('/');
      adicionarToast(
        'sucesso',
        'Rascunho Descartado',
        'O rascunho foi removido. O status do estudo voltou para Pendente.'
      );
    } catch (err: any) {
      const prob: ProblemDetailRFC9457 = err;
      adicionarToast(
        'erro',
        prob.title || 'Falha ao Excluir',
        prob.detail || 'Não foi possível excluir o rascunho.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCriarPlanoAcao = () => {
    adicionarToast(
      'sucesso',
      'Iniciando Plano de Ação (US 03)',
      `O aluno ${alunoSelecionado.nome} possui Estudo de Caso concluído e está apto para elaboração do Plano de Ação.`
    );
  };

  const dificuldadesDoEstudo = estudoAtual
    ? indicadores.filter((ind) => estudoAtual.indicadoresIds.includes(ind.id))
    : [];

  // Dados pré-carregados do aluno em foco para os modais (Ref. TA9.3)
  const alunoEmFoco: AlunoModalData = {
    id: alunoSelecionado.id,
    nome: header?.nome || alunoSelecionado.nome,
    matricula: header?.matricula || alunoSelecionado.matricula,
    curso: header?.curso || alunoSelecionado.curso || 'Não informado',
    turma: alunoSelecionado.turma,
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between selection:bg-ifpb-teal selection:text-white">
      {/* Botão Flutuante VLibras */}
      <VLibrasButton />

      {/* Menu de desenvolvimento para testar telas */}
      <MenuDev />

      {/* Alertas Toasts flutuantes */}
      <ToastAlert toasts={toasts} onFechar={removerToast} />

      {/* Cabeçalho Oficial do IFPB */}
      <HeaderIFPB
        searchTerm={termoBusca}
        onSearch={setTermoBusca}
        subTitle={
          location.pathname === '/estudo-de-caso'
            ? 'Formulário de Estudo de Caso'
            : location.pathname === '/pei'
              ? 'Plano Educacional Individualizado (PEI)'
              : 'Ficha do Estudante'
        }
      />

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {header && <StudentHeader header={header} />}
                {!header && (loadingHeader || errorHeader) && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    {loadingHeader && (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
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
                  onNovoAtendimento={() => setModalAtivo('ATENDIMENTO')}
                  onNovoEstudo={() => setModalAtivo('ESTUDO')}
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
                  onAbrirFormularioEstudo={() => navigate('/estudo-de-caso')}
                  onCriarPlanoAcao={handleCriarPlanoAcao}
                  peiAtual={peiAtual}
                  onAbrirFormularioPei={() => navigate('/pei')}
                />
              </>
            }
          />
          <Route
            path="/pei"
            element={
              <FormularioPei
                aluno={alunoSelecionado}
                peiExistente={peiAtual}
                dificuldades={dificuldadesDoEstudo}
                onSalvar={handleSalvarPei}
                onVoltar={() => navigate('/')}
                isLoading={isLoading}
              />
            }
          />
          <Route
            path="/estudo-de-caso"
            element={
              <FormularioEstudoDeCaso
                aluno={alunoSelecionado}
                estudoExistente={estudoAtual}
                indicadoresDisponiveis={indicadores}
                onSalvarRascunho={handleSalvarRascunho}
                onConcluir={handleConcluir}
                onExcluirRascunho={estudoAtual?.status === 'RASCUNHO' ? handleExcluirRascunho : undefined}
                onVoltar={() => navigate('/')}
                isLoading={isLoading}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modais de Ações Rápidas do Prontuário com Aluno Pré-carregado (Ref. TA9.3) */}
      <ModalNovoAtendimento
        isOpen={modalAtivo === 'ATENDIMENTO'}
        onClose={() => setModalAtivo(null)}
        aluno={alunoEmFoco}
        onSuccess={async () => {
          await carregarTimeline(alunoSelecionado.id);
          adicionarToast(
            'sucesso',
            'Atendimento Registrado',
            `Novo atendimento vinculado a ${alunoEmFoco.nome} (${alunoEmFoco.matricula}) e adicionado à Linha do Tempo.`
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
          setEstudoAtual(estudo);
          await carregarTimeline(alunoSelecionado.id);
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
        onSuccess={async (doc) => {
          await carregarTimeline(alunoSelecionado.id);
          adicionarToast(
            'sucesso',
            doc.tipoDocumento === 'RAE' ? 'RAE Emitido com Sucesso' : 'Dossiê Gerado com Sucesso',
            doc.resumo
          );
        }}
        onError={(titulo, detalhe) => adicionarToast('erro', titulo, detalhe)}
      />

      {/* Rodapé Institucional */}
      <footer className="w-full bg-[#1A2E26] text-gray-300 text-xs py-6 mt-12 border-t border-gray-800">
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

export default App;
