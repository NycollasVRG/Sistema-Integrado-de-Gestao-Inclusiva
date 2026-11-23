import React, { useId, useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCw, XCircle } from 'lucide-react';
import { ModalBase } from './ModalBase';
import { IndicacaoService } from '../services/indicacaoService';
import { toProblem } from '../services/apiClient';
import type { IndicacaoResponseDTO } from '../types/indicacao';
import { MSG_JUSTIFICATIVA_REJEICAO_OBRIGATORIA } from '../utils/indicacao';

export type ModoDecisaoIndicacao = 'APROVAR' | 'REJEITAR';

interface ModalDecisaoIndicacaoProps {
  indicacao: IndicacaoResponseDTO;
  modo: ModoDecisaoIndicacao;
  onClose: () => void;
  onConcluida: (indicacao: IndicacaoResponseDTO, modo: ModoDecisaoIndicacao) => void;
  /** Chamado quando a API recusa a decisão (ex.: outra pessoa já decidiu), para atualizar a lista. */
  onFalha?: () => void;
}

/**
 * TA10.3: rejeição exige justificativa (obrigatória e validada antes de qualquer requisição);
 * a aprovação aceita uma observação opcional e inicia o Estudo de Caso.
 */
export const ModalDecisaoIndicacao: React.FC<ModalDecisaoIndicacaoProps> = ({
  indicacao,
  modo,
  onClose,
  onConcluida,
  onFalha,
}) => {
  const idCampo = useId();
  const rejeitando = modo === 'REJEITAR';
  const [texto, setTexto] = useState('');
  const [erroCampo, setErroCampo] = useState('');
  const [erroApi, setErroApi] = useState('');
  const [processando, setProcessando] = useState(false);

  async function confirmar() {
    if (processando) return;
    if (rejeitando && !texto.trim()) {
      setErroCampo(MSG_JUSTIFICATIVA_REJEICAO_OBRIGATORIA);
      return;
    }
    setErroCampo('');
    setErroApi('');
    setProcessando(true);
    try {
      const atualizada = rejeitando
        ? await IndicacaoService.rejeitar(indicacao.id, texto)
        : await IndicacaoService.aprovar(indicacao.id, texto);
      onConcluida(atualizada, modo);
    } catch (falha: unknown) {
      const problema = toProblem(
        falha,
        rejeitando ? 'Falha ao rejeitar' : 'Falha ao aprovar',
        'Não foi possível concluir a decisão.',
      );
      setErroApi(problema.detail || problema.title);
      onFalha?.();
    } finally {
      setProcessando(false);
    }
  }

  const rodape = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={processando}
        className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={confirmar}
        disabled={processando}
        className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
          rejeitando ? 'bg-ifpb-red hover:brightness-110' : 'bg-ifpb-teal hover:bg-ifpb-tealHover'
        }`}
      >
        {processando && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
        {processando
          ? 'Processando...'
          : rejeitando
            ? 'Confirmar rejeição'
            : 'Aprovar e Iniciar Estudo de Caso'}
      </button>
    </>
  );

  return (
    <ModalBase
      isOpen
      onClose={onClose}
      isLoading={processando}
      titulo={rejeitando ? 'Rejeitar indicação' : 'Aprovar e iniciar Estudo de Caso'}
      subtitulo={`${indicacao.nomeEstudante} • ${indicacao.matriculaAluno}`}
      icone={rejeitando ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
      maxWidthClass="max-w-xl"
      footer={rodape}
    >
      <div className="rounded-lg border border-gray-200 bg-ifpb-breadcrumb/50 px-4 py-3 text-xs text-gray-700 space-y-1">
        <p>
          <span className="font-semibold">Disciplinas:</span> {indicacao.disciplinasObservadas.join(', ')}
        </p>
        <p className="whitespace-pre-wrap break-words line-clamp-4">
          <span className="font-semibold">Justificativa do solicitante:</span> {indicacao.justificativaPedagogica}
        </p>
      </div>

      <p className="text-sm text-gray-600">
        {rejeitando
          ? 'A justificativa ficará registrada no histórico da indicação e o estudante deixará a triagem.'
          : 'O estudante voltará a constar como Ativo e um Estudo de Caso em rascunho será criado com base nesta indicação.'}
      </p>

      {erroApi && (
        <div
          role="alert"
          className="bg-red-50 border-l-4 border-ifpb-red p-3 rounded-r-lg flex items-start gap-2.5 text-sm text-red-800"
        >
          <AlertTriangle className="w-5 h-5 text-ifpb-red shrink-0 mt-0.5" />
          <span>{erroApi}</span>
        </div>
      )}

      <div>
        <label htmlFor={idCampo} className="block text-sm font-medium text-gray-700">
          {rejeitando ? (
            <>
              Justificativa da rejeição <span className="text-ifpb-red">*</span>
            </>
          ) : (
            <>
              Observação <span className="text-xs font-normal text-gray-400">(opcional)</span>
            </>
          )}
        </label>
        <textarea
          id={idCampo}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            if (erroCampo) setErroCampo('');
          }}
          rows={4}
          autoFocus
          aria-invalid={Boolean(erroCampo)}
          placeholder={
            rejeitando
              ? 'Explique por que a indicação não seguirá para Estudo de Caso.'
              : 'Registre orientações para quem conduzirá o Estudo de Caso.'
          }
          className={`block mt-1 w-full border rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal ${
            erroCampo ? 'border-ifpb-red' : 'border-gray-300'
          }`}
        />
        {erroCampo && (
          <p role="alert" className="mt-1 text-xs font-medium text-ifpb-red">
            {erroCampo}
          </p>
        )}
      </div>
    </ModalBase>
  );
};
