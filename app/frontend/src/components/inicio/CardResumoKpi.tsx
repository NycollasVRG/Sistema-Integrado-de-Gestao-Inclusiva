import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export type TomCardKpi = 'teal' | 'green' | 'amber' | 'red' | 'purple' | 'slate';

interface CardResumoKpiProps {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icone: LucideIcon;
  tom?: TomCardKpi;
  carregando?: boolean;
  to?: string;
}

const ESTILO_ICONE: Record<TomCardKpi, string> = {
  teal: 'bg-ifpb-tealLight text-ifpb-teal',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
  slate: 'bg-gray-100 text-gray-700',
};

const ESTILO_BORDA_HOVER: Record<TomCardKpi, string> = {
  teal: 'hover:border-ifpb-teal/50',
  green: 'hover:border-emerald-400',
  amber: 'hover:border-amber-400',
  red: 'hover:border-red-400',
  purple: 'hover:border-purple-400',
  slate: 'hover:border-gray-400',
};

export const CardResumoKpi: React.FC<CardResumoKpiProps> = ({
  titulo,
  valor,
  descricao,
  icone: Icone,
  tom = 'teal',
  carregando = false,
  to,
}) => {
  const conteudo = (
    <div
      className={`h-full bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs transition-all ${
        to ? `${ESTILO_BORDA_HOVER[tom]} hover:shadow-sm cursor-pointer` : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{titulo}</p>
          {carregando ? (
            <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse mt-2" />
          ) : (
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1.5 leading-none">
              {valor}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${ESTILO_ICONE[tom]}`}>
          <Icone className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      {descricao && (
        <p className="text-xs text-gray-500 mt-3 leading-snug">{descricao}</p>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 rounded-xl">
        {conteudo}
      </Link>
    );
  }

  return conteudo;
};
