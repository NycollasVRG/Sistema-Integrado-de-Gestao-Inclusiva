import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  FilePlus2,
  Save,
  Tag,
} from 'lucide-react';
import { ModalBase } from './ModalBase';
import { ModalAlunoHeader } from './ModalAlunoHeader';
import { ProntuarioService } from '../services/prontuarioService';
import { EstudoDeCasoService } from '../services/estudoDeCasoService';
import type {
  EstudoDeCasoResponseDTO,
  IndicadorReutilizavel,
  ProblemDetailRFC9457,
} from '../types/estudoDeCaso';
import type { AlunoModalData } from '../types/prontuarioAcoes';

export interface ModalNovoEstudoProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: AlunoModalData;
  indicadoresDisponiveis: IndicadorReutilizavel[];
  estudoExistente?: EstudoDeCasoResponseDTO | null;
  onSuccess: (
    estudo: EstudoDeCasoResponseDTO,
    modo: 'RASCUNHO' | 'ENCERRADO'
  ) => void | Promise<void>;
  onError?: (titulo: string, detalhe: string) => void;
}

export const ModalNovoEstudo: React.FC<ModalNovoEstudoProps> = ({
  isOpen,
  onClose,
  aluno,
  indicadoresDisponiveis,
  estudoExistente,
  onSuccess,
  onError,
}) => {
  const isRascunhoExistente = estudoExistente?.status === 'RASCUNHO';

  const [diagnostico, setDiagnostico] = useState<string>(
    isRascunhoExistente ? estudoExistente?.diagnosticoInicial || '' : ''
  );
  const [indicadoresSelecionados, setIndicadoresSelecionados] = useState<string[]>(
    isRascunhoExistente ? estudoExistente?.indicadoresIds || [] : []
  );

  const [erroDiagnostico, setErroDiagnostico] = useState<string | null>(null);
  const [erroIndicadores, setErroIndicadores] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFechar = () => {
    if (isSubmitting) return;
    setErroDiagnostico(null);
    setErroIndicadores(null);
    onClose();
  };

  const toggleIndicador = (id: string) => {
    setIndicadoresSelecionados((prev) => {
      const novos = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      if (novos.length > 0) {
        setErroIndicadores(null);
      }
      return novos;
    });
  };

  const enviarEstudo = async (modo: 'RASCUNHO' | 'ENCERRADO') => {
    if (modo === 'ENCERRADO') {
      let possuiErro = false;

      if (!diagnostico.trim()) {
        setErroDiagnostico(
          'O Diagnóstico Inicial é obrigatório para concluir o Estudo de Caso.'
        );
        possuiErro = true;
      } else {
        setErroDiagnostico(null);
      }

      if (indicadoresSelecionados.length === 0) {
        setErroIndicadores(
          'Selecione pelo menos uma Dificuldade/Indicador identificada para o aluno.'
        );
        possuiErro = true;
      } else {
        setErroIndicadores(null);
      }

      if (possuiErro) return;
    } else {
      setErroDiagnostico(null);
      setErroIndicadores(null);
    }

    setIsSubmitting(true);
    try {
      let resultado: EstudoDeCasoResponseDTO;

      if (isRascunhoExistente && estudoExistente) {
        resultado = await EstudoDeCasoService.atualizar(estudoExistente.id, {
          status: modo,
          diagnosticoInicial: diagnostico.trim(),
          indicadoresIds: indicadoresSelecionados,
        });
      } else {
        resultado = await ProntuarioService.criarEstudoRapido({
          alunoId: aluno.id,
          status: modo,
          diagnosticoInicial: diagnostico.trim(),
          indicadoresIds: indicadoresSelecionados,
        });
      }

      await onSuccess(resultado, modo);
      onClose();
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      if (onError) {
        onError(
          prob.title || 'Falha ao Salvar Estudo de Caso',
          prob.detail || 'Não foi possível salvar o Estudo de Caso.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleFechar}
      titulo={isRascunhoExistente ? 'Continuar Estudo de Caso' : 'Novo Estudo de Caso'}
      subtitulo="Preenchimento rápido com identificação do estudante pré-carregada"
      icone={<FilePlus2 className="w-5 h-5" />}
      isLoading={isSubmitting}
      footer={
        <>
          <button
            type="button"
            onClick={handleFechar}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => enviarEstudo('RASCUNHO')}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold border border-ifpb-teal text-ifpb-teal bg-white hover:bg-ifpb-tealLight transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Rascunho</span>
          </button>

          <button
            type="button"
            onClick={() => enviarEstudo('ENCERRADO')}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Processando...' : 'Concluir Estudo'}</span>
          </button>
        </>
      }
    >
      {/* Ref. TA9.3: Cabeçalho do Aluno Pré-carregado sem exigir digitação de matrícula */}
      <ModalAlunoHeader aluno={aluno} />

      {/* Campo 1: Diagnóstico Inicial */}
      <div>
        <label
          htmlFor="modal-estudo-diagnostico"
          className="block text-xs font-bold text-ifpb-dark mb-1"
        >
          1. Diagnóstico Inicial / Relato Multidisciplinar{' '}
          <span className="text-ifpb-red">*</span>
        </label>
        <p className="text-[11px] text-gray-500 mb-2">
          Descreva o histórico escolar, condições clínicas apresentadas e necessidades educacionais específicas identificadas.
        </p>
        <textarea
          id="modal-estudo-diagnostico"
          rows={4}
          value={diagnostico}
          onChange={(e) => {
            setDiagnostico(e.target.value);
            if (e.target.value.trim()) setErroDiagnostico(null);
          }}
          placeholder="Digite o parecer técnico e observações iniciais da equipe..."
          disabled={isSubmitting}
          className={`w-full p-3 rounded-lg text-xs border bg-white text-gray-800 focus:outline-none focus:ring-2 resize-y ${
            erroDiagnostico
              ? 'border-ifpb-red focus:ring-red-200'
              : 'border-gray-300 focus:ring-ifpb-teal/30 focus:border-ifpb-teal'
          }`}
        />
        {erroDiagnostico && (
          <p className="mt-1.5 text-xs text-ifpb-red flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
            {erroDiagnostico}
          </p>
        )}
      </div>

      {/* Campo 2: Indicadores Reutilizáveis */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-ifpb-dark flex items-center">
            <Tag className="w-3.5 h-3.5 mr-1.5 text-ifpb-teal" />
            2. Dificuldades / Indicadores Identificados{' '}
            <span className="text-ifpb-red ml-1">*</span>
          </label>
          <span className="text-[11px] font-semibold text-ifpb-teal bg-ifpb-tealLight px-2 py-0.5 rounded-full">
            {indicadoresSelecionados.length} selecionado(s)
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mb-2.5">
          Selecione ao menos um indicador de barreira ou condição para conclusão do documento:
        </p>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-lg border ${
            erroIndicadores ? 'border-ifpb-red bg-red-50/20' : 'border-gray-200 bg-gray-50/50'
          }`}
        >
          {indicadoresDisponiveis.map((ind) => {
            const selecionado = indicadoresSelecionados.includes(ind.id);
            return (
              <button
                key={ind.id}
                type="button"
                onClick={() => toggleIndicador(ind.id)}
                disabled={isSubmitting}
                className={`flex items-start space-x-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  selecionado
                    ? 'bg-ifpb-tealLight border-ifpb-teal text-ifpb-dark shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-ifpb-teal/40'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                    selecionado
                      ? 'bg-ifpb-teal border-ifpb-teal text-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {selecionado && <Check className="w-3 h-3" />}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold leading-tight">
                    {ind.nome}
                  </span>
                  {ind.descricao && (
                    <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {ind.descricao}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {erroIndicadores && (
          <p className="mt-1.5 text-xs text-ifpb-red flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
            {erroIndicadores}
          </p>
        )}
      </div>
    </ModalBase>
  );
};
