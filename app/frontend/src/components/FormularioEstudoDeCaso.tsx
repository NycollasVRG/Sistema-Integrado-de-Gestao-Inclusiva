import React, { useState, useEffect } from 'react';
import type {
  Aluno,
  DadosFormularioEstudo,
  EstudoDeCasoResponseDTO,
  IndicadorReutilizavel,
  StatusEstudoCaso,
} from '../types/estudoDeCaso';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import {
  Save,
  CheckCircle,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  Info,
  Check,
  Tag,
  FileEdit,
  Clock,
  Lock,
  RotateCw,
  Unlock,
  History,
  User,
  GitBranch,
  FilePlus2,
} from 'lucide-react';

const MSG_DIAGNOSTICO_OBRIGATORIO =
  'O Diagnóstico Inicial é obrigatório para concluir o Estudo de Caso.';
const MSG_HISTORICO_OBRIGATORIO =
  'O Histórico é obrigatório para concluir o Estudo de Caso.';
const MSG_INDICADORES_OBRIGATORIO =
  'Selecione pelo menos uma Deficiência/Indicador identificada para o aluno.';

const VALOR_NOVA_AVALIACAO = '__NOVA_AVALIACAO__';

const ROTULO_STATUS: Record<StatusEstudoCaso, string> = {
  ATIVO: 'Ativo',
  ENCERRADO: 'Encerrado',
  RASCUNHO: 'Rascunho',
};

function formatarDataHora(valor?: string): string | null {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toLocaleString('pt-BR');
}

function rotuloVersao(estudo: EstudoDeCasoResponseDTO): string {
  const data = formatarDataHora(estudo.atualizadoEm ?? estudo.criadoEm);
  return `v${estudo.versao ?? 1} — ${ROTULO_STATUS[estudo.status]}${data ? ` — ${data}` : ''}`;
}

interface FormularioEstudoDeCasoProps {
  aluno: Aluno;
  /** Versão em foco; null em estudo inédito ou durante uma nova avaliação ainda não salva. */
  estudoExistente: EstudoDeCasoResponseDTO | null;
  /** Todas as versões do aluno, da mais recente para a mais antiga. */
  versoes?: EstudoDeCasoResponseDTO[];
  novaAvaliacaoEmAndamento?: boolean;
  indicadoresDisponiveis: IndicadorReutilizavel[];
  onSalvarRascunho: (dados: DadosFormularioEstudo) => Promise<void>;
  onConcluir: (dados: DadosFormularioEstudo) => Promise<void>;
  onExcluirRascunho?: () => Promise<void>;
  onReabrir?: (estudoId: string) => Promise<void>;
  onSelecionarVersao?: (estudoId: string) => void;
  onNovaAvaliacao?: () => void;
  onCancelarNovaAvaliacao?: () => void;
  onVoltar: () => void;
  isLoading?: boolean;
}

export const FormularioEstudoDeCaso: React.FC<FormularioEstudoDeCasoProps> = ({
  aluno,
  estudoExistente,
  versoes = [],
  novaAvaliacaoEmAndamento = false,
  indicadoresDisponiveis,
  onSalvarRascunho,
  onConcluir,
  onExcluirRascunho,
  onReabrir,
  onSelecionarVersao,
  onNovaAvaliacao,
  onCancelarNovaAvaliacao,
  onVoltar,
  isLoading = false,
}) => {
  const [diagnostico, setDiagnostico] = useState<string>('');
  const [historico, setHistorico] = useState<string>('');
  const [indicadoresSelecionados, setIndicadoresSelecionados] = useState<string[]>([]);
  
  // Estados de validação do critério TA2.3
  const [erroDiagnostico, setErroDiagnostico] = useState<string | null>(null);
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);
  const [erroIndicadores, setErroIndicadores] = useState<string | null>(null);
  const [tentouConcluir, setTentouConcluir] = useState<boolean>(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState<boolean>(false);
  const [acaoPendente, setAcaoPendente] = useState<(() => void) | null>(null);
  const [confirmarReabertura, setConfirmarReabertura] = useState<boolean>(false);

  // TA11.3: só Restrição Moderada ou superior E campos presentes no JSON.
  const { podeAcessarDadosSensiveis } = useAuth();
  const mostrarHistoricos =
    podeAcessarDadosSensiveis &&
    !!(estudoExistente?.historicoFamiliar || estudoExistente?.historicoSocioemocional);

  // Inicializa dados do formulário a partir do estudo existente (se houver)
  useEffect(() => {
    if (estudoExistente) {
      setDiagnostico(estudoExistente.diagnosticoInicial || '');
      setHistorico(estudoExistente.historico || '');
      setIndicadoresSelecionados(estudoExistente.indicadoresIds || []);
    } else {
      setDiagnostico('');
      setHistorico('');
      setIndicadoresSelecionados([]);
    }
    setErroDiagnostico(null);
    setErroHistorico(null);
    setErroIndicadores(null);
    setTentouConcluir(false);
  }, [estudoExistente, aluno]);

  // Alterna seleção de indicador / dificuldade
  const toggleIndicador = (id: string) => {
    setIndicadoresSelecionados((prev) => {
      const novos = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (tentouConcluir) {
        setErroIndicadores(novos.length > 0 ? null : MSG_INDICADORES_OBRIGATORIO);
      }
      return novos;
    });
  };

  // Trata alteração no Diagnóstico Inicial
  const handleDiagnosticoChange = (valor: string) => {
    setDiagnostico(valor);
    if (tentouConcluir) {
      setErroDiagnostico(valor.trim().length > 0 ? null : MSG_DIAGNOSTICO_OBRIGATORIO);
    }
  };

  // Trata alteração no Histórico
  const handleHistoricoChange = (valor: string) => {
    setHistorico(valor);
    if (tentouConcluir) {
      setErroHistorico(valor.trim().length > 0 ? null : MSG_HISTORICO_OBRIGATORIO);
    }
  };

  const montarDados = (): DadosFormularioEstudo => ({
    diagnostico,
    historico,
    indicadoresIds: indicadoresSelecionados,
  });

  // Salvar Rascunho: Não exige obrigatoriedade dos campos (permite salvamento parcial)
  const handleSalvarRascunho = async () => {
    setErroDiagnostico(null);
    setErroHistorico(null);
    setErroIndicadores(null);
    await onSalvarRascunho(montarDados());
  };

  // Concluir Estudo de Caso: Validação rigorosa no Front (Critério TA2.3)
  const handleConcluir = async () => {
    setTentouConcluir(true);

    const diagnosticoInvalido = diagnostico.trim().length === 0;
    const historicoInvalido = historico.trim().length === 0;
    const indicadoresInvalidos = indicadoresSelecionados.length === 0;

    setErroDiagnostico(diagnosticoInvalido ? MSG_DIAGNOSTICO_OBRIGATORIO : null);
    setErroHistorico(historicoInvalido ? MSG_HISTORICO_OBRIGATORIO : null);
    setErroIndicadores(indicadoresInvalidos ? MSG_INDICADORES_OBRIGATORIO : null);

    if (diagnosticoInvalido || historicoInvalido || indicadoresInvalidos) {
      // Bloqueia a requisição para a API!
      return;
    }

    await onConcluir(montarDados());
  };

  const isRascunho = estudoExistente?.status === 'RASCUNHO';
  const isConcluido = estudoExistente?.status === 'ENCERRADO' || estudoExistente?.status === 'ATIVO';
  // Estudo concluído é somente leitura até ser reaberto (TA2.2)
  const somenteLeitura = isConcluido;

  // TA2.4: versão em foco que não é a mais recente fica preservada como histórico (read-only)
  const versaoHistorica =
    !!estudoExistente && versoes.length > 0 && estudoExistente.id !== versoes[0].id;
  const proximaVersao = (versoes[0]?.versao ?? 0) + 1;

  const dataUltimaAlteracao = formatarDataHora(estudoExistente?.atualizadoEm);

  const isDirty =
    !somenteLeitura &&
    (diagnostico !== (estudoExistente?.diagnosticoInicial || '') ||
      historico !== (estudoExistente?.historico || '') ||
      JSON.stringify(indicadoresSelecionados) !==
        JSON.stringify(estudoExistente?.indicadoresIds || []));

  // Exige confirmação antes de qualquer ação que descarte alterações não salvas
  const comConfirmacaoDeDescarte = (acao: () => void) => {
    if (isDirty) {
      setAcaoPendente(() => acao);
      return;
    }
    acao();
  };

  const handleVoltar = () => comConfirmacaoDeDescarte(onVoltar);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden space-y-0">
      {/* Barra Superior do Formulário */}
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleVoltar}
            disabled={isLoading}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Voltar para a ficha do aluno"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <FileEdit className="w-5 h-5 text-green-300" />
              <h2 className="text-xl font-bold tracking-tight">
                {estudoExistente
                  ? somenteLeitura
                    ? 'Visualização de Estudo de Caso'
                    : 'Edição de Estudo de Caso'
                  : novaAvaliacaoEmAndamento
                    ? 'Nova Avaliação do Estudo de Caso'
                    : 'Novo Estudo de Caso'}
              </h2>
            </div>
            <p className="text-xs text-green-100 mt-0.5">
              Aluno:{' '}
              <span className="font-semibold text-white">{aluno.nome}</span> &bull; Matrícula:{' '}
              <span className="font-mono text-white">{aluno.matricula}</span>
            </p>
          </div>
        </div>

        {/* Status Atual do Documento */}
        <div className="flex items-center space-x-2">
          {(estudoExistente || novaAvaliacaoEmAndamento) && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
              v{novaAvaliacaoEmAndamento ? proximaVersao : (estudoExistente?.versao ?? 1)}
            </span>
          )}
          {isRascunho && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-amber-950">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Rascunho
            </span>
          )}
          {isConcluido && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-300 text-emerald-950">
              <Check className="w-3.5 h-3.5 mr-1" />
              {versaoHistorica ? 'Histórico' : 'Concluído'}
            </span>
          )}
          {!estudoExistente && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
              {novaAvaliacaoEmAndamento ? 'Nova Avaliação' : 'Novo Documento'}
            </span>
          )}
        </div>
      </div>

      {/* TA2.4: Seletor de versões do Estudo de Caso e Nova Avaliação */}
      {(versoes.length > 0 || novaAvaliacaoEmAndamento) && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <GitBranch className="w-4 h-4 text-ifpb-teal shrink-0" />
            <label
              htmlFor="seletor-versao-estudo"
              className="text-xs font-bold text-gray-700 uppercase"
            >
              Versões do Estudo de Caso ({versoes.length}):
            </label>
            <select
              id="seletor-versao-estudo"
              value={novaAvaliacaoEmAndamento ? VALOR_NOVA_AVALIACAO : (estudoExistente?.id ?? '')}
              disabled={isLoading || !onSelecionarVersao}
              onChange={(e) => {
                const valor = e.target.value;
                if (valor === VALOR_NOVA_AVALIACAO || valor === estudoExistente?.id) return;
                comConfirmacaoDeDescarte(() => onSelecionarVersao?.(valor));
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg shadow-2xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-ifpb-tealLight disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {novaAvaliacaoEmAndamento && (
                <option value={VALOR_NOVA_AVALIACAO}>
                  v{proximaVersao} — Nova avaliação (não salva)
                </option>
              )}
              {versoes.map((versao) => (
                <option key={versao.id} value={versao.id}>
                  {rotuloVersao(versao)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {novaAvaliacaoEmAndamento && onCancelarNovaAvaliacao && (
              <button
                type="button"
                onClick={() => comConfirmacaoDeDescarte(onCancelarNovaAvaliacao)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar Nova Avaliação
              </button>
            )}
            {onNovaAvaliacao && !novaAvaliacaoEmAndamento && (
              <button
                type="button"
                onClick={() => comConfirmacaoDeDescarte(onNovaAvaliacao)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Preserva a versão atual como histórico e inicia uma nova versão para edição"
              >
                <FilePlus2 className="w-3.5 h-3.5 mr-1.5" />
                Nova Avaliação (Nova Versão)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Caixa de Orientação Institucional */}
      <div className="bg-[#EEF1EC] border-b border-[#DDE5DB] px-6 py-3 text-xs text-ifpb-dark flex items-start space-x-2">
        <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ifpb-teal">Instruções para a Equipe Multidisciplinar:</span>{' '}
          Você pode salvar rascunhos preliminares a qualquer momento clicando em <strong>"Salvar Rascunho"</strong>.{' '}
          Para a finalização formal, clique em <strong>"Concluir"</strong> (requer Diagnóstico Inicial, Histórico e ao menos uma Deficiência selecionada).
        </div>
      </div>

      {/* Aviso de Somente Leitura: versão histórica (TA2.4) ou estudo concluído (TA2.2) */}
      {somenteLeitura && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-xs text-emerald-800 flex items-start space-x-2">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>
            {versaoHistorica ? (
              <>
                <span className="font-semibold">
                  Versão {estudoExistente?.versao ?? 1} preservada como histórico — somente leitura.
                </span>{' '}
                Selecione a versão mais recente para continuar a edição.
              </>
            ) : (
              <>
                <span className="font-semibold">Estudo de Caso concluído — visualização somente leitura.</span>{' '}
                {onReabrir
                  ? 'Para alterar o documento, utilize "Reabrir Estudo de Caso". A reabertura é registrada na auditoria.'
                  : 'O documento finalizado não pode mais ser editado. Para alterá-lo, entre em contato com a coordenação.'}
              </>
            )}
          </p>
        </div>
      )}

      {/* TA2.2: Metadados de auditoria da última alteração */}
      {estudoExistente && (dataUltimaAlteracao || estudoExistente.atualizadoPor) && (
        <div
          className="bg-gray-50 border-b border-gray-200 px-6 py-2.5 text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1"
          aria-label="Metadados da última alteração"
        >
          <span className="inline-flex items-center font-semibold text-gray-500 uppercase">
            <History className="w-3.5 h-3.5 mr-1 text-ifpb-teal" />
            Última alteração
          </span>
          {dataUltimaAlteracao && (
            <span className="inline-flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
              {dataUltimaAlteracao}
            </span>
          )}
          <span className="inline-flex items-center">
            <User className="w-3.5 h-3.5 mr-1 text-gray-400" />
            {estudoExistente.atualizadoPor?.nome || 'Usuário não identificado'}
          </span>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={(e) => e.preventDefault()} className="p-6 sm:p-8 space-y-8">
        {/* Alerta Geral se houver tentativa inválida de conclusão (Critério TA2.3) */}
        {tentouConcluir && (erroDiagnostico || erroHistorico || erroIndicadores) && (
          <div className="bg-red-50 border-l-4 border-ifpb-red p-4 rounded-r-lg space-y-1" role="alert">
            <div className="flex items-center text-sm font-bold text-red-800">
              <AlertTriangle className="w-5 h-5 text-ifpb-red mr-2" />
              Validação de Conclusão
            </div>
            <p className="text-xs text-red-700">
              O estudo não pode ser enviado como "Concluído" pois existem campos obrigatórios não preenchidos:
            </p>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5 pt-1">
              {erroDiagnostico && <li>{erroDiagnostico}</li>}
              {erroHistorico && <li>{erroHistorico}</li>}
              {erroIndicadores && <li>{erroIndicadores}</li>}
            </ul>
          </div>
        )}

        {/* CAMPO 1: Diagnóstico Inicial */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="diagnostico-inicial"
              className="text-sm font-bold text-ifpb-dark flex items-center"
            >
              <span>1. Diagnóstico Inicial</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório para conclusão">*</span>
            </label>
            <span className="text-xs text-gray-400">
              {diagnostico.length} caracteres
            </span>
          </div>

          <p className="text-xs text-gray-500">
            Descreva detalhadamente o contexto pedagógico, histórico escolar, pareceres da equipe multidisciplinar e observações iniciais sobre as necessidades inclusivas do estudante.
          </p>

          <textarea
            id="diagnostico-inicial"
            rows={5}
            value={diagnostico}
            onChange={(e) => handleDiagnosticoChange(e.target.value)}
            disabled={somenteLeitura}
            placeholder="Exemplo: Aluno apresenta barreiras significativas no processo de decodificação leitora e interpretação textual em ambiente de sala regular, demandando tempo adicional para avaliações e suporte pedagógico adaptado..."
            className={`w-full p-3.5 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
              somenteLeitura
                ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                : erroDiagnostico
                  ? 'border-ifpb-red focus:ring-red-200 bg-red-50/30'
                  : 'border-gray-300 focus:border-ifpb-teal focus:ring-ifpb-tealLight'
            }`}
          />

          {erroDiagnostico && (
            <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {erroDiagnostico}
            </p>
          )}
        </div>

        {/* CAMPO 2: Histórico (obrigatório para conclusão - TA2.3) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="historico-estudo"
              className="text-sm font-bold text-ifpb-dark flex items-center"
            >
              <span>2. Histórico</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório para conclusão">*</span>
            </label>
            <span className="text-xs text-gray-400">{historico.length} caracteres</span>
          </div>

          <p className="text-xs text-gray-500">
            Registre o histórico escolar e de acompanhamento do estudante antes e durante a permanência na instituição.
          </p>

          <textarea
            id="historico-estudo"
            rows={5}
            value={historico}
            onChange={(e) => handleHistoricoChange(e.target.value)}
            disabled={somenteLeitura}
            placeholder="Exemplo: Aluno ingressou em 2025.1, com acompanhamento prévio na rede básica de ensino e relatórios de apoio pedagógico..."
            className={`w-full p-3.5 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
              somenteLeitura
                ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                : erroHistorico
                  ? 'border-ifpb-red focus:ring-red-200 bg-red-50/30'
                  : 'border-gray-300 focus:border-ifpb-teal focus:ring-ifpb-tealLight'
            }`}
          />

          {erroHistorico && (
            <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {erroHistorico}
            </p>
          )}
        </div>

        {/* CAMPO 3: Deficiências Identificadas / Indicadores */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-ifpb-dark flex items-center">
              <Tag className="w-4 h-4 mr-1.5 text-ifpb-teal" />
              <span>3. Deficiências Identificadas / Indicadores Reutilizáveis</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório para conclusão">*</span>
            </label>
            <span className="text-xs font-semibold text-ifpb-teal">
              {indicadoresSelecionados.length} selecionada(s)
            </span>
          </div>

          <p className="text-xs text-gray-500">
            Selecione as deficiências e condições identificadas para apoiar os indicadores do Plano de Ação:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {indicadoresDisponiveis.map((ind) => {
              const selecionado = indicadoresSelecionados.includes(ind.id);
              return (
                <button
                  type="button"
                  key={ind.id}
                  onClick={() => toggleIndicador(ind.id)}
                  disabled={somenteLeitura}
                  className={`flex flex-col text-left p-3 rounded-lg border text-xs transition-all ${
                    somenteLeitura
                      ? 'cursor-not-allowed bg-gray-50 border-gray-200 text-gray-500'
                      : selecionado
                        ? 'cursor-pointer border-ifpb-teal bg-ifpb-tealLight text-ifpb-teal font-semibold shadow-xs'
                        : 'cursor-pointer border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold">{ind.nome}</span>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                        selecionado
                          ? 'bg-ifpb-teal border-ifpb-teal text-white'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      {selecionado ? '✓' : ''}
                    </span>
                  </div>
                  {ind.descricao && (
                    <span className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                      {ind.descricao}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {erroIndicadores && (
            <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {erroIndicadores}
            </p>
          )}
        </div>

        {/* TA11.3: Históricos sensíveis. Ocultos por completo para ACESSO_FUNCIONAL
            (perfil sem permissão OU chaves ausentes no JSON). */}
        {mostrarHistoricos && (
          <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50/60">
            <div className="flex items-center text-sm font-bold text-ifpb-dark">
              <Lock className="w-4 h-4 mr-1.5 text-ifpb-teal" />
              Dados Sensíveis (acesso restrito)
            </div>
            {estudoExistente?.historicoFamiliar && (
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase">Histórico Familiar</span>
                <p className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg p-3 mt-1 whitespace-pre-line">
                  {estudoExistente.historicoFamiliar}
                </p>
              </div>
            )}
            {estudoExistente?.historicoSocioemocional && (
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase">Histórico Socioemocional</span>
                <p className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg p-3 mt-1 whitespace-pre-line">
                  {estudoExistente.historicoSocioemocional}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Barra Inferior de Ações e Botões */}
        <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Lado Esquerdo: Ações secundárias (Descartar Rascunho / Voltar) */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleVoltar}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Voltar
            </button>

            {isRascunho && onExcluirRascunho && (
              <button
                type="button"
                onClick={() => setConfirmarDescarte(true)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 text-xs font-semibold text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Excluir este rascunho permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 text-red-600" />
                Descartar Rascunho
              </button>
            )}
          </div>

          {/* Lado Direito: Reabrir (concluído) ou Salvar Rascunho e Concluir */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* TA2.2: Reabertura de estudo concluído */}
            {somenteLeitura && onReabrir && (
              <button
                type="button"
                onClick={() => setConfirmarReabertura(true)}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-xs font-bold border border-ifpb-teal text-ifpb-teal bg-white hover:bg-ifpb-tealLight focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <RotateCw className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4 mr-1.5" />
                )}
                Reabrir Estudo de Caso
              </button>
            )}

            {/* Botão Salvar Rascunho (Não exige campos completos) */}
            <button
              type="button"
              onClick={handleSalvarRascunho}
              disabled={isLoading || somenteLeitura}
              title={somenteLeitura ? 'Estudo concluído é somente leitura' : undefined}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <RotateCw className="w-4 h-4 mr-1.5 text-gray-500 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1.5 text-gray-500" />
              )}
              {isLoading ? 'Salvando...' : 'Salvar Rascunho'}
            </button>

            {/* Botão Concluir (Valida TA2.3 e envia ENCERRADO) */}
            <button
              type="button"
              onClick={handleConcluir}
              disabled={isLoading || somenteLeitura}
              title={somenteLeitura ? 'Estudo concluído é somente leitura' : undefined}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 shadow-sm transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <RotateCw className="w-4 h-4 mr-1.5 text-green-300 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1.5 text-green-300" />
              )}
              {isLoading ? 'Concluindo...' : 'Concluir Estudo de Caso'}
            </button>
          </div>
        </div>
      </form>

      {acaoPendente && (
        <ConfirmModal
          titulo="Descartar alterações?"
          mensagem="Existem alterações não salvas no Estudo de Caso. Deseja realmente continuar e descartar as alterações?"
          textoConfirmar="Descartar e Continuar"
          textoCancelar="Continuar Editando"
          variante="perigo"
          onConfirmar={() => {
            const acao = acaoPendente;
            setAcaoPendente(null);
            acao();
          }}
          onCancelar={() => setAcaoPendente(null)}
        />
      )}

      {confirmarDescarte && onExcluirRascunho && (
        <ConfirmModal
          titulo="Descartar Rascunho?"
          mensagem="Tem certeza de que deseja descartar este rascunho? Esta ação não pode ser desfeita."
          textoConfirmar="Descartar Rascunho"
          textoCancelar="Cancelar"
          variante="perigo"
          isLoading={isLoading}
          onConfirmar={async () => {
            setConfirmarDescarte(false);
            await onExcluirRascunho?.();
          }}
          onCancelar={() => setConfirmarDescarte(false)}
        />
      )}

      {confirmarReabertura && estudoExistente && onReabrir && (
        <ConfirmModal
          titulo="Reabrir Estudo de Caso?"
          mensagem="O estudo voltará ao status Rascunho e poderá ser editado novamente. A reabertura será registrada na auditoria com seu usuário e a data/hora atuais."
          textoConfirmar="Reabrir Estudo"
          textoCancelar="Cancelar"
          variante="primario"
          isLoading={isLoading}
          onConfirmar={async () => {
            setConfirmarReabertura(false);
            await onReabrir(estudoExistente.id);
          }}
          onCancelar={() => setConfirmarReabertura(false)}
        />
      )}
    </div>
  );
};
