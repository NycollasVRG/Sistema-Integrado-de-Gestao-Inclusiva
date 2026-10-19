import React, { useState } from 'react';
import {
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { ModalBase } from './ModalBase';
import { ModalAlunoHeader } from './ModalAlunoHeader';
import { ProntuarioService } from '../services/prontuarioService';
import type {
  AlunoModalData,
  EmissaoDocumentoResponseDTO,
  TipoDocumentoProntuario,
} from '../types/prontuarioAcoes';
import type { ProblemDetailRFC9457 } from '../types/estudoDeCaso';

export interface ModalConfirmacaoAcaoProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: AlunoModalData;
  tipoDocumento: TipoDocumentoProntuario;
  onSuccess: (documento: EmissaoDocumentoResponseDTO) => void | Promise<void>;
  onError?: (titulo: string, detalhe: string) => void;
}

export const ModalConfirmacaoAcao: React.FC<ModalConfirmacaoAcaoProps> = ({
  isOpen,
  onClose,
  aluno,
  tipoDocumento,
  onSuccess,
  onError,
}) => {
  const [periodoReferencia, setPeriodoReferencia] = useState<string>('2026.1');
  const [incluirHistoricoCompleto, setIncluirHistoricoCompleto] =
    useState<boolean>(true);
  const [observacoesAdicionais, setObservacoesAdicionais] =
    useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isRae = tipoDocumento === 'RAE';

  const handleFechar = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const gerado = await ProntuarioService.emitirDocumento({
        alunoId: aluno.id,
        matriculaAluno: aluno.matricula,
        tipoDocumento,
        periodoReferencia: periodoReferencia.trim() || '2026.1',
        incluirHistoricoCompleto,
        observacoesAdicionais: observacoesAdicionais.trim() || undefined,
      });

      setObservacoesAdicionais('');
      await onSuccess(gerado);
      onClose();
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      if (onError) {
        onError(
          prob.title || 'Falha ao Emitir Documento',
          prob.detail || 'Não foi possível gerar o documento solicitado.'
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
      titulo={
        isRae
          ? 'Emitir RAE — Relatório de Atendimento Educacional'
          : 'Gerar Dossiê Consolidado do Prontuário'
      }
      subtitulo={
        isRae
          ? 'Emissão rápida de relatório oficial de acompanhamento do estudante'
          : 'Compilação completa de Estudos de Caso, PEI, PEA e Atendimentos'
      }
      icone={
        isRae ? (
          <FileSpreadsheet className="w-5 h-5" />
        ) : (
          <FileDown className="w-5 h-5" />
        )
      }
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
            type="submit"
            form="form-emissao-documento"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Gerando documento...'
                : isRae
                  ? 'Confirmar e Emitir RAE'
                  : 'Confirmar e Gerar Dossiê'}
            </span>
          </button>
        </>
      }
    >
      {/* Ref. TA9.3: Cabeçalho do Aluno Pré-carregado */}
      <ModalAlunoHeader aluno={aluno} />

      <form
        id="form-emissao-documento"
        onSubmit={handleConfirmar}
        className="space-y-4"
      >
        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 leading-relaxed">
            {isRae
              ? 'O RAE consolida os atendimentos realizados pela equipe multidisciplinar no período selecionado para fins de registro pedagógico institucional.'
              : 'O Dossiê reúne em documento único a Linha do Tempo completa, o Estudo de Caso, o PEI e os registros de atendimento do estudante.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="doc-periodo"
              className="block text-xs font-bold text-ifpb-dark mb-1"
            >
              Período Letivo de Referência
            </label>
            <input
              id="doc-periodo"
              type="text"
              value={periodoReferencia}
              onChange={(e) => setPeriodoReferencia(e.target.value)}
              disabled={isSubmitting}
              placeholder="Ex.: 2026.1"
              className="w-full px-3 py-2 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
            />
          </div>

          <div className="flex items-end pb-1">
            <label className="inline-flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={incluirHistoricoCompleto}
                onChange={(e) => setIncluirHistoricoCompleto(e.target.checked)}
                disabled={isSubmitting}
                className="w-4 h-4 rounded border-gray-300 text-ifpb-teal focus:ring-ifpb-teal"
              />
              <span className="text-xs font-medium text-gray-700">
                Incluir histórico completo da Linha do Tempo
              </span>
            </label>
          </div>
        </div>

        <div>
          <label
            htmlFor="doc-observacoes"
            className="block text-xs font-bold text-ifpb-dark mb-1"
          >
            Observações / Despacho Final{' '}
            <span className="text-gray-400 font-normal">(Opcional)</span>
          </label>
          <textarea
            id="doc-observacoes"
            rows={3}
            value={observacoesAdicionais}
            onChange={(e) => setObservacoesAdicionais(e.target.value)}
            disabled={isSubmitting}
            placeholder="Observações complementares a constar no rodapé do documento..."
            className="w-full p-3 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal resize-y"
          />
        </div>
      </form>
    </ModalBase>
  );
};
