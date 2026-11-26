import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface CardAcaoRapidaProps {
  titulo: string;
  descricao: string;
  to: string;
  icone: LucideIcon;
  destaque?: 'teal' | 'purple' | 'green';
  badge?: string;
}

const ESTILO_DESTAQUE = {
  teal: {
    icone: 'bg-ifpb-tealLight text-ifpb-teal group-hover:bg-ifpb-teal group-hover:text-white',
    seta: 'text-ifpb-teal',
    borda: 'hover:border-ifpb-teal/50',
  },
  purple: {
    icone: 'bg-purple-50 text-purple-700 group-hover:bg-purple-700 group-hover:text-white',
    seta: 'text-purple-700',
    borda: 'hover:border-purple-400',
  },
  green: {
    icone: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
    seta: 'text-emerald-700',
    borda: 'hover:border-emerald-400',
  },
};

export const CardAcaoRapida: React.FC<CardAcaoRapidaProps> = ({
  titulo,
  descricao,
  to,
  icone: Icone,
  destaque = 'teal',
  badge,
}) => {
  const estilo = ESTILO_DESTAQUE[destaque];

  return (
    <Link
      to={to}
      className={`group flex flex-col justify-between bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all ${estilo.borda}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2.5 rounded-xl transition-colors ${estilo.icone}`}>
          <Icone className="w-5 h-5" aria-hidden="true" />
        </div>
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-ifpb-teal transition-colors">
          {titulo}
        </h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{descricao}</p>
      </div>

      <div className={`mt-4 inline-flex items-center gap-1.5 text-xs font-semibold ${estilo.seta}`}>
        <span>Acessar</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};
