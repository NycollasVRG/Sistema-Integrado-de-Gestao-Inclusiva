import React, { useState, useEffect } from 'react';
import { HeaderIFPB } from './components/HeaderIFPB';
import { VLibrasButton } from './components/VLibrasButton';
import { TelaAluno } from './components/TelaAluno';
import { FormularioEstudoDeCaso } from './components/FormularioEstudoDeCaso';
import { FormularioPei } from './components/FormularioPei';
import { ToastAlert, type ToastMessage } from './components/ToastAlert';
import {
  ALUNOS_PADRAO,
  INDICADORES_PADRAO,
  EstudoDeCasoService,
} from './services/estudoDeCasoService';
import { ACOMPANHAMENTO_POR_ALUNO, PeiService } from './services/peiService';
import type { PeiResponseDTO } from './types/pei';
import type {
  Aluno,
  EstudoDeCasoResponseDTO,
  IndicadorReutilizavel,
  ProblemDetailRFC9457,
} from './types/estudoDeCaso';

type Visualizacao = 'TELA_ALUNO' | 'FORMULARIO_ESTUDO' | 'FORMULARIO_PEI';

export const App: React.FC = () => {
  const [alunoSelecionado] = useState<Aluno>(ALUNOS_PADRAO[0]);
  const [indicadores] = useState<IndicadorReutilizavel[]>(INDICADORES_PADRAO);
  const [estudoAtual, setEstudoAtual] = useState<EstudoDeCasoResponseDTO | null>(null);
  const [peiAtual, setPeiAtual] = useState<PeiResponseDTO | null>(null);
  const [visualizacao, setVisualizacao] = useState<Visualizacao>('TELA_ALUNO');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [termoBusca, setTermoBusca] = useState<string>('');

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

  useEffect(() => {
    carregarEstudosDoAluno(alunoSelecionado.id);
    carregarPeiDoAluno(alunoSelecionado.id);
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
      setVisualizacao('TELA_ALUNO');
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
      setVisualizacao('TELA_ALUNO');
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
      setVisualizacao('TELA_ALUNO');
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

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between selection:bg-ifpb-teal selection:text-white">
      {/* Botão Flutuante VLibras */}
      <VLibrasButton />

      {/* Alertas Toasts flutuantes */}
      <ToastAlert toasts={toasts} onFechar={removerToast} />

      {/* Cabeçalho Oficial do IFPB */}
      <HeaderIFPB
        searchTerm={termoBusca}
        onSearch={setTermoBusca}
        subTitle={
          visualizacao === 'FORMULARIO_ESTUDO'
            ? 'Formulário de Estudo de Caso'
            : visualizacao === 'FORMULARIO_PEI'
              ? 'Plano Educacional Individualizado (PEI)'
              : 'Ficha do Estudante'
        }
      />

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {visualizacao === 'TELA_ALUNO' ? (
          <TelaAluno
            alunoSelecionado={alunoSelecionado}
            estudoAtual={estudoAtual}
            indicadores={indicadores}
            onAbrirFormularioEstudo={() => setVisualizacao('FORMULARIO_ESTUDO')}
            onCriarPlanoAcao={handleCriarPlanoAcao}
            peiAtual={peiAtual}
            onAbrirFormularioPei={() => setVisualizacao('FORMULARIO_PEI')}
          />
        ) : visualizacao === 'FORMULARIO_PEI' ? (
          <FormularioPei
            aluno={alunoSelecionado}
            peiExistente={peiAtual}
            dificuldades={dificuldadesDoEstudo}
            onSalvar={handleSalvarPei}
            onVoltar={() => setVisualizacao('TELA_ALUNO')}
            isLoading={isLoading}
          />
        ) : (
          <FormularioEstudoDeCaso
            aluno={alunoSelecionado}
            estudoExistente={estudoAtual}
            indicadoresDisponiveis={indicadores}
            onSalvarRascunho={handleSalvarRascunho}
            onConcluir={handleConcluir}
            onExcluirRascunho={estudoAtual?.status === 'RASCUNHO' ? handleExcluirRascunho : undefined}
            onVoltar={() => setVisualizacao('TELA_ALUNO')}
            isLoading={isLoading}
          />
        )}
      </main>

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
