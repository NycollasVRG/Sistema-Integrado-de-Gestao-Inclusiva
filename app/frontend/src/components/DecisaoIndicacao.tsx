import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { IndicacaoResponseDTO } from '../types/indicacao';
import { formatarDataHora } from '../utils/indicacao';

interface DecisaoIndicacaoProps {
  indicacao: IndicacaoResponseDTO;
  /** Ação opcional para abrir o Estudo de Caso gerado pela aprovação. */
  onAbrirEstudo?: () => void;
}

/**
 * Registro da decisão da CLAI no histórico da indicação (TA10.3): a justificativa
 * da rejeição fica sempre visível, junto da data da decisão.
 */
export const DecisaoIndicacao: React.FC<DecisaoIndicacaoProps> = ({ indicacao, onAbrirEstudo }) => {
  if (indicacao.status === 'PENDENTE') return null;

  const rejeitada = indicacao.status === 'REJEITADA';
  const Icone = rejeitada ? XCircle : CheckCircle2;

  return (
    <div
      className={`rounded-lg border px-3.5 py-3 text-sm ${
        rejeitada ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
        <Icone className="w-4 h-4" aria-hidden="true" />
        {rejeitada ? 'Indicação rejeitada' : 'Indicação aprovada'}
        <span className="font-medium normal-case tracking-normal opacity-80">
          &bull; {formatarDataHora(indicacao.decididoEm)}
        </span>
      </p>

      {indicacao.justificativaDecisao ? (
        <p className="mt-1.5 whitespace-pre-wrap break-words">
          <span className="font-semibold">{rejeitada ? 'Justificativa: ' : 'Observação: '}</span>
          {indicacao.justificativaDecisao}
        </p>
      ) : (
        !rejeitada && <p className="mt-1.5 opacity-80">Estudo de Caso iniciado a partir desta indicação.</p>
      )}

      {!rejeitada && indicacao.estudoDeCasoId && onAbrirEstudo && (
        <button
          type="button"
          onClick={onAbrirEstudo}
          className="mt-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 underline underline-offset-2 cursor-pointer"
        >
          Abrir Estudo de Caso
        </button>
      )}
    </div>
  );
};
