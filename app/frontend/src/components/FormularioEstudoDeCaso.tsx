import React, { useState, useEffect } from 'react';
import type { Aluno, EstudoDeCasoResponseDTO, IndicadorReutilizavel } from '../types/estudoDeCaso';
import { ConfirmModal } from './ConfirmModal';
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
} from 'lucide-react';

interface FormularioEstudoDeCasoProps {
  aluno: Aluno;
  estudoExistente: EstudoDeCasoResponseDTO | null;
  indicadoresDisponiveis: IndicadorReutilizavel[];
  onSalvarRascunho: (diagnostico: string, indicadoresIds: string[]) => Promise<void>;
  onConcluir: (diagnostico: string, indicadoresIds: string[]) => Promise<void>;
  onExcluirRascunho?: () => Promise<void>;
  onVoltar: () => void;
  isLoading?: boolean;
}

export const FormularioEstudoDeCaso: React.FC<FormularioEstudoDeCasoProps> = ({
  aluno,
  estudoExistente,
  indicadoresDisponiveis,
  onSalvarRascunho,
  onConcluir,
  onExcluirRascunho,
  onVoltar,
  isLoading = false,
}) => {
  const [diagnostico, setDiagnostico] = useState<string>('');
  const [indicadoresSelecionados, setIndicadoresSelecionados] = useState<string[]>([]);
  
  // Estados de validação do critério TA2.3
  const [erroDiagnostico, setErroDiagnostico] = useState<string | null>(null);
  const [erroIndicadores, setErroIndicadores] = useState<string | null>(null);
  const [tentouConcluir, setTentouConcluir] = useState<boolean>(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState<boolean>(false);

  // Inicializa dados do formulário a partir do estudo existente (se houver)
  useEffect(() => {
    if (estudoExistente) {
      setDiagnostico(estudoExistente.diagnosticoInicial || '');
      setIndicadoresSelecionados(estudoExistente.indicadoresIds || []);
    } else {
      setDiagnostico('');
      setIndicadoresSelecionados([]);
    }
    setErroDiagnostico(null);
    setErroIndicadores(null);
    setTentouConcluir(false);
  }, [estudoExistente, aluno]);

  // Alterna seleção de indicador / dificuldade
  const toggleIndicador = (id: string) => {
    setIndicadoresSelecionados((prev) => {
      const novos = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (tentouConcluir) {
        if (novos.length > 0) {
          setErroIndicadores(null);
        } else {
          setErroIndicadores('Selecione pelo menos uma Dificuldade/Indicador para concluir o Estudo de Caso.');
        }
      }
      return novos;
    });
  };

  // Trata alteração no Diagnóstico Inicial
  const handleDiagnosticoChange = (valor: string) => {
    setDiagnostico(valor);
    if (tentouConcluir) {
      if (valor.trim().length > 0) {
        setErroDiagnostico(null);
      } else {
        setErroDiagnostico('O Diagnóstico Inicial é obrigatório para concluir o Estudo de Caso.');
      }
    }
  };

  // Salvar Rascunho: Não exige obrigatoriedade dos campos (permite salvamento parcial)
  const handleSalvarRascunho = async () => {
    setErroDiagnostico(null);
    setErroIndicadores(null);
    await onSalvarRascunho(diagnostico, indicadoresSelecionados);
  };

  // Concluir Estudo de Caso: Validação rigorosa no Front (Critério TA2.3)
  const handleConcluir = async () => {
    setTentouConcluir(true);

    let temErro = false;

    // TA2.3: Impedir envio se Diagnóstico estiver vazio
    if (!diagnostico || diagnostico.trim().length === 0) {
      setErroDiagnostico('O Diagnóstico Inicial é obrigatório para concluir o Estudo de Caso.');
      temErro = true;
    } else {
      setErroDiagnostico(null);
    }

    // TA2.3: Impedir envio se Dificuldades estiverem vazias
    if (!indicadoresSelecionados || indicadoresSelecionados.length === 0) {
      setErroIndicadores('Selecione pelo menos uma Dificuldade/Indicador identificada para o aluno.');
      temErro = true;
    } else {
      setErroIndicadores(null);
    }

    if (temErro) {
      // Bloqueia a requisição para a API!
      return;
    }

    // Submete como ENCERRADO/CONCLUIDO
    await onConcluir(diagnostico, indicadoresSelecionados);
  };

  const isRascunho = estudoExistente?.status === 'RASCUNHO';
  const isConcluido = estudoExistente?.status === 'ENCERRADO' || estudoExistente?.status === 'ATIVO';
  // Estudo concluído é somente leitura (proteção da regra TA2.1 no front)
  const somenteLeitura = isConcluido;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden space-y-0">
      {/* Barra Superior do Formulário */}
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onVoltar}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
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
          {isRascunho && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-amber-950">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Rascunho
            </span>
          )}
          {isConcluido && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-300 text-emerald-950">
              <Check className="w-3.5 h-3.5 mr-1" />
              Concluído
            </span>
          )}
          {!estudoExistente && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
              Novo Documento
            </span>
          )}
        </div>
      </div>

      {/* Caixa de Orientação Institucional */}
      <div className="bg-[#EEF1EC] border-b border-[#DDE5DB] px-6 py-3 text-xs text-ifpb-dark flex items-start space-x-2">
        <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ifpb-teal">Instruções para a Equipe Multidisciplinar:</span>{' '}
          Você pode salvar rascunhos preliminares a qualquer momento clicando em <strong>"Salvar Rascunho"</strong>.{' '}
          Para a finalização formal, clique em <strong>"Concluir"</strong> (requer Diagnóstico e ao menos uma Dificuldade selecionada).
        </div>
      </div>

      {/* Aviso de Somente Leitura: estudo concluído não pode ser alterado (ref. TA2.1) */}
      {somenteLeitura && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-xs text-emerald-800 flex items-start space-x-2">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold">Estudo de Caso concluído — visualização somente leitura.</span>{' '}
            O documento finalizado não pode mais ser editado ou revertido para rascunho. Para alterar o
            diagnóstico ou os indicadores, entre em contato com a coordenação.
          </p>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={(e) => e.preventDefault()} className="p-6 sm:p-8 space-y-8">
        {/* Alerta Geral se houver tentativa inválida de conclusão (Critério TA2.3) */}
        {tentouConcluir && (erroDiagnostico || erroIndicadores) && (
          <div className="bg-red-50 border-l-4 border-ifpb-red p-4 rounded-r-lg space-y-1">
            <div className="flex items-center text-sm font-bold text-red-800">
              <AlertTriangle className="w-5 h-5 text-ifpb-red mr-2" />
              Validação de Conclusão
            </div>
            <p className="text-xs text-red-700">
              O estudo não pode ser enviado como "Concluído" pois existem campos obrigatórios não preenchidos:
            </p>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5 pt-1">
              {erroDiagnostico && <li>{erroDiagnostico}</li>}
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

        {/* CAMPO 2: Dificuldades Identificadas / Indicadores */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-ifpb-dark flex items-center">
              <Tag className="w-4 h-4 mr-1.5 text-ifpb-teal" />
              <span>2. Dificuldades Identificadas / Indicadores Reutilizáveis</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório para conclusão">*</span>
            </label>
            <span className="text-xs font-semibold text-ifpb-teal">
              {indicadoresSelecionados.length} selecionada(s)
            </span>
          </div>

          <p className="text-xs text-gray-500">
            Selecione as categorias e barreiras diagnosticadas para apoiar os indicadores do Plano de Ação:
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

        {/* Barra Inferior de Ações e Botões */}
        <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Lado Esquerdo: Ações secundárias (Descartar Rascunho / Voltar) */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onVoltar}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
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

          {/* Lado Direito: Salvar Rascunho e Concluir */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Botão Salvar Rascunho (Não exige campos completos) */}
            <button
              type="button"
              onClick={handleSalvarRascunho}
              disabled={isLoading || somenteLeitura}
              title={somenteLeitura ? 'Estudo concluído é somente leitura' : undefined}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-1.5 text-gray-500" />
              Salvar Rascunho
            </button>

            {/* Botão Concluir (Valida TA2.3 e envia ENCERRADO) */}
            <button
              type="button"
              onClick={handleConcluir}
              disabled={isLoading || somenteLeitura}
              title={somenteLeitura ? 'Estudo concluído é somente leitura' : undefined}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 shadow-sm transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 mr-1.5 text-green-300" />
              Concluir Estudo de Caso
            </button>
          </div>
        </div>
      </form>

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
    </div>
  );
};
