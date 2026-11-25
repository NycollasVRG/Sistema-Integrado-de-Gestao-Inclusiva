import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { AlertaPedagogicoDTO, SeveridadeAlerta } from '../types/alertaDashboard';
import { formatarDataHora } from '../utils/indicacao';
import { ROTULO_SEVERIDADE, ROTULO_TIPO_ALERTA } from '../utils/dashboardAlertas';

const ESTILO_ATIVO: Record<SeveridadeAlerta, { cartao: string; selo: string; icone: string }> = {
  VERMELHO: {
    cartao: 'border-red-300 border-l-4 border-l-ifpb-red bg-red-50',
    selo: 'bg-ifpb-red text-white',
    icone: 'text-ifpb-red',
  },
  PEDAGOGICO: {
    cartao: 'border-amber-300 border-l-4 border-l-amber-500 bg-amber-50',
    selo: 'bg-amber-100 text-amber-900 border border-amber-300',
    icone: 'text-amber-600',
  },
};

interface ItemAlertaDashboardProps {
  alerta: AlertaPedagogicoDTO;
  /** Quando informado, exibe a ação "Marcar como Ciente / Tratado" (alertas ativos). */
  onTratar?: (alerta: AlertaPedagogicoDTO) => void;
  onAbrirProntuario: (alunoId: string) => void;
  /** Id do usuário logado, para indicar "por você" no histórico. */
  usuarioId?: string;
}

/** Item do painel de alertas (ativo, com destaque por severidade) ou do histórico (tratado, neutro). */
export const ItemAlertaDashboard: React.FC<ItemAlertaDashboardProps> = ({
  alerta,
  onTratar,
  onAbrirProntuario,
  usuarioId,
}) => {
  const tratado = alerta.tratado;
  const estilo = ESTILO_ATIVO[alerta.severidade];
  const Icone = alerta.severidade === 'VERMELHO' ? ShieldAlert : AlertTriangle;
  const local = [alerta.unidade, alerta.curso, alerta.turma].filter(Boolean).join(' › ');

  return (
    <li
      className={`rounded-xl border p-4 shadow-xs ${tratado ? 'border-gray-200 bg-white' : estilo.cartao}`}
      data-severidade={alerta.severidade}
      data-tratado={tratado}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Icone
            className={`w-5 h-5 shrink-0 mt-0.5 ${tratado ? 'text-gray-400' : estilo.icone}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                  tratado ? 'bg-gray-100 text-gray-600' : estilo.selo
                }`}
              >
                {ROTULO_SEVERIDADE[alerta.severidade]}
              </span>
              <span className="text-sm font-bold text-gray-900">{ROTULO_TIPO_ALERTA[alerta.tipoAlerta]}</span>
            </div>
            <button
              type="button"
              onClick={() => onAbrirProntuario(alerta.alunoId)}
              className="mt-1 text-sm font-semibold text-gray-900 hover:text-ifpb-teal hover:underline text-left cursor-pointer transition-colors"
              title={`Abrir prontuário de ${alerta.alunoNome}`}
            >
              {alerta.alunoNome}
            </button>
            <p className="text-xs text-gray-500">
              Matrícula <span className="font-mono">{alerta.alunoMatricula}</span>
              {local && <> • {local}</>}
            </p>
            <p className="mt-2 text-sm text-gray-800 break-words">{alerta.descricao}</p>
            <p className="mt-2 text-xs text-gray-500">
              Gerado em {formatarDataHora(alerta.criadoEm)}
              {tratado && (
                <>
                  {' • '}
                  <span className="font-medium text-gray-700">
                    Tratado em {formatarDataHora(alerta.tratadoEm)}
                    {usuarioId && alerta.tratadoPor === usuarioId ? ' por você' : ''}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {!tratado && onTratar && (
          <button
            type="button"
            onClick={() => onTratar(alerta)}
            className="inline-flex items-center justify-center gap-1.5 self-start shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar como Ciente / Tratado
          </button>
        )}
      </div>
    </li>
  );
};
