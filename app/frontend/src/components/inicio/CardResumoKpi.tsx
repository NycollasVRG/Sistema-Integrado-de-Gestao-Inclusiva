import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface CardResumoKpiProps {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icone: LucideIcon;
  carregando?: boolean;
  to?: string;
}

export const CardResumoKpi: React.FC<CardResumoKpiProps> = ({
  titulo,
  valor,
  descricao,
  icone: Icone,
  carregando = false,
  to,
}) => {
  const conteudo = (
    <div
      className={`h-full bg-white rounded-xl border border-gray-200 p-4 shadow-2xs transition-colors ${
        to ? 'hover:border-ifpb-teal/50 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{titulo}</p>
          {carregando ? (
            <div className="h-7 w-14 bg-gray-200 rounded-md animate-pulse mt-1.5" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1 leading-none">{valor}</p>
          )}
        </div>
        <div className="p-2.5 rounded-lg shrink-0 bg-ifpb-tealLight text-ifpb-teal">
          <Icone className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>

      {descricao && <p className="text-xs text-gray-500 mt-2.5 truncate">{descricao}</p>}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="block h-full focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 rounded-xl"
      >
        {conteudo}
      </Link>
    );
  }

  return conteudo;
};
