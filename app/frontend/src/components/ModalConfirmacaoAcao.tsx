import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  Info,
  RotateCw,
} from 'lucide-react';
import { toProblem } from '../services/apiClient';
import { ProntuarioService } from '../services/prontuarioService';
import { RaiService } from '../services/raiService';
import type { RaiResponseDTO, TipoRelatorio } from '../types/rai';
import type {
  AlunoModalData,
  EmissaoDocumentoResponseDTO,
  TipoDocumentoProntuario,
} from '../types/prontuarioAcoes';
import { ModalBase } from './ModalBase';
import { ModalAlunoHeader } from './ModalAlunoHeader';

export interface ModalConfirmacaoAcaoProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: AlunoModalData;
  tipoDocumento: TipoDocumentoProntuario;
  /** Vínculos do estudante enviados ao back-end para validação e rastreabilidade. */
  peiId?: string | null;
  acompanhamentoId?: string | null;
  onSuccess: (
    documento: EmissaoDocumentoResponseDTO | RaiResponseDTO
  ) => void | Promise<void>;
  onError?: (titulo: string, detalhe: string) => void;
}

function bimestreAtual(): number {
  return Math.floor(new Date().getMonth() / 3) + 1;
}

function periodoAtual(): string {
  return `${new Date().getFullYear()}.1`;
}

export const ModalConfirmacaoAcao: React.FC<ModalConfirmacaoAcaoProps> = ({
  isOpen,
  onClose,
  aluno,
  tipoDocumento,
  peiId,
  acompanhamentoId,
  onSuccess,
  onError,
}) => {
  // RAI/RAE: campos do POST /api/rais.
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('RAE');
  const [bimestre, setBimestre] = useState<number>(bimestreAtual);
  const [indicativoRegressao, setIndicativoRegressao] = useState<boolean>(false);
  const [descricao, setDescricao] = useState<string>('');

  // Dossiê: campos do gerador local, preservados sem alteração de contrato.
  const [periodoReferencia, setPeriodoReferencia] = useState<string>(periodoAtual);
  const [incluirHistoricoCompleto, setIncluirHistoricoCompleto] =
    useState<boolean>(true);
  const [observacoesAdicionais, setObservacoesAdicionais] =
    useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const isRae = tipoDocumento === 'RAE';

  // O componente permanece montado no App: limpa o formulário a cada abertura/troca.
  useEffect(() => {
    if (!isOpen) return;
    setTipoRelatorio('RAE');
    setBimestre(bimestreAtual());
    setIndicativoRegressao(false);
    setDescricao('');
    setPeriodoReferencia(periodoAtual());
    setIncluirHistoricoCompleto(true);
    setObservacoesAdicionais('');
    setErroLocal(null);
  }, [isOpen, tipoDocumento, aluno.id]);

  const handleFechar = () => {
    if (isSubmitting) return;
    onClose();
  };

  const falhar = (titulo: string, detalhe: string) => {
    setErroLocal(detalhe);
    onError?.(titulo, detalhe);
  };

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLocal(null);

    if (!aluno.id) {
      falhar(
        'Dados do Aluno Ausentes',
        'É necessário selecionar um estudante antes de emitir o documento.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRae) {
        // TA9.2 / TA9.3: emissão real persistida no back-end.
        const relatorio = await RaiService.emitir({
          alunoId: aluno.id,
          peiId: peiId || undefined,
          acompanhamentoId: acompanhamentoId || undefined,
          tipoRelatorio,
          bimestre,
          indicativoRegressao,
          descricao: descricao.trim() || undefined,
        });
        setDescricao('');
        await onSuccess(relatorio);
      } else {
        const gerado = await ProntuarioService.emitirDocumento({
          alunoId: aluno.id,
          matriculaAluno: aluno.matricula,
          tipoDocumento,
          periodoReferencia: periodoReferencia.trim() || `${new Date().getFullYear()}.1`,
          incluirHistoricoCompleto,
          observacoesAdicionais: observacoesAdicionais.trim() || undefined,
        });
        setObservacoesAdicionais('');
        await onSuccess(gerado);
      }
      onClose();
    } catch (err: unknown) {
      const prob = toProblem(err);
      falhar(
        prob.title || 'Falha ao Emitir Documento',
        prob.detail || 'Não foi possível gerar o documento solicitado.'
      );
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
          ? tipoRelatorio === 'RAI'
            ? 'Emitir RAI — Relatório de Acompanhamento Individualizado'
            : 'Emitir RAE — Relatório de Atendimento Educacional'
          : 'Gerar Dossiê Consolidado do Prontuário'
      }
      subtitulo={
        isRae
          ? 'Registro bimestral oficial, vinculado à Linha do Tempo do estudante'
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
            {isSubmitting ? (
              <RotateCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? isRae
                  ? 'Registrando relatório...'
                  : 'Gerando documento...'
                : isRae
                  ? `Confirmar e Emitir ${tipoRelatorio}`
                  : 'Confirmar e Gerar Dossiê'}
            </span>
          </button>
        </>
      }
    >
      {/* Ref. TA9.3: Cabeçalho do Aluno Pré-carregado */}
      <ModalAlunoHeader aluno={aluno} />

      {erroLocal && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 break-words">{erroLocal}</p>
        </div>
      )}

      <form
        id="form-emissao-documento"
        onSubmit={handleConfirmar}
        className="space-y-4"
      >
        <div className="bg-ifpb-tealLight/60 border border-ifpb-teal/20 rounded-lg p-3.5 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
          <p className="text-xs text-ifpb-dark leading-relaxed">
            {isRae
              ? `O ${tipoRelatorio} fica registrado na Linha do Tempo do estudante. Ao marcar indicativo de regressão, o Coordenador recebe uma notificação para revisar o PEI (TA3.3).`
              : 'O Dossiê reúne em documento único a Linha do Tempo completa, o Estudo de Caso, o PEI e os registros de atendimento do estudante.'}
          </p>
        </div>

        {isRae ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rae-tipo"
                  className="block text-xs font-bold text-ifpb-dark mb-1"
                >
                  Tipo de Relatório <span className="text-ifpb-red">*</span>
                </label>
                <select
                  id="rae-tipo"
                  value={tipoRelatorio}
                  onChange={(e) => setTipoRelatorio(e.target.value as TipoRelatorio)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                >
                  <option value="RAE">RAE — Relatório de Atendimento Educacional</option>
                  <option value="RAI">RAI — Relatório de Acompanhamento Individualizado</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="rae-bimestre"
                  className="block text-xs font-bold text-ifpb-dark mb-1"
                >
                  Bimestre de Referência <span className="text-ifpb-red">*</span>
                </label>
                <select
                  id="rae-bimestre"
                  value={bimestre}
                  onChange={(e) => setBimestre(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                >
                  <option value={1}>1º bimestre</option>
                  <option value={2}>2º bimestre</option>
                  <option value={3}>3º bimestre</option>
                  <option value={4}>4º bimestre</option>
                </select>
              </div>

              <div className="flex items-end pb-1">
                <label className="inline-flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={indicativoRegressao}
                    onChange={(e) => setIndicativoRegressao(e.target.checked)}
                    disabled={isSubmitting}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-ifpb-teal focus:ring-ifpb-teal"
                  />
                  <span>
                    <span className="block text-xs font-medium text-gray-700">
                      Indicativo de regressão
                    </span>
                    <span className="block text-[10px] text-gray-500 leading-tight mt-0.5">
                      Notifica o Coordenador para revisar o PEI
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="rae-descricao"
                className="block text-xs font-bold text-ifpb-dark mb-1"
              >
                Descrição / Evidências{' '}
                <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <textarea
                id="rae-descricao"
                rows={4}
                maxLength={5000}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={isSubmitting}
                placeholder="Registre a evolução do estudante, os indicadores observados e os encaminhamentos do bimestre..."
                className="w-full p-3 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal resize-y"
              />
              <p className="mt-1 text-[10px] text-gray-400 text-right">
                {descricao.length}/5000
              </p>
            </div>
          </>
        ) : (
          <>
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
                maxLength={5000}
                value={observacoesAdicionais}
                onChange={(e) => setObservacoesAdicionais(e.target.value)}
                disabled={isSubmitting}
                placeholder="Observações complementares a constar no rodapé do documento..."
                className="w-full p-3 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal resize-y"
              />
            </div>
          </>
        )}
      </form>
    </ModalBase>
  );
};
