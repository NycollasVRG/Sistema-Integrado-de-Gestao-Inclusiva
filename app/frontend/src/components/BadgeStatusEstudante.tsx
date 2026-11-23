import React from 'react';
import { Hourglass } from 'lucide-react';

interface BadgeStatusEstudanteProps {
  status: string;
  ativo?: boolean;
}

/** Situação do estudante na listagem. TA10.2: indicação pendente => badge "Em Triagem". */
export const BadgeStatusEstudante: React.FC<BadgeStatusEstudanteProps> = ({ status, ativo = true }) => {
  if (status === 'EM_TRIAGEM') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300"
        title="Há uma indicação aguardando análise da equipe CLAI"
      >
        <Hourglass className="w-3 h-3" aria-hidden="true" />
        Em Triagem
      </span>
    );
  }

  const classes =
    status === 'EVADIDO'
      ? 'bg-red-100 text-red-800'
      : ativo
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-gray-200 text-gray-700';
  const rotulo = status === 'EVADIDO' ? 'Evadido' : ativo ? 'Ativo' : 'Inativo';

  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes}`}>{rotulo}</span>;
};
