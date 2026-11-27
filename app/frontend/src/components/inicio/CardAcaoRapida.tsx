import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface CardAcaoRapidaProps {
  titulo: string;
  descricao: string;
  to: string;
  icone: LucideIcon;
  badge?: string;
}

export const CardAcaoRapida: React.FC<CardAcaoRapidaProps> = ({
  titulo,
  descricao,
  to,
  icone: Icone,
  badge,
}) => {
  return (
    <Link
      to={to}
      className="group flex flex-col justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:border-ifpb-teal/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="p-2 rounded-lg bg-ifpb-tealLight text-ifpb-teal group-hover:bg-ifpb-teal group-hover:text-white transition-colors">
          <Icone className="w-4 h-4" aria-hidden="true" />
        </div>
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-ifpb-teal transition-colors">
          {titulo}
        </h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{descricao}</p>
      </div>

      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ifpb-teal">
        <span>Acessar</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};
