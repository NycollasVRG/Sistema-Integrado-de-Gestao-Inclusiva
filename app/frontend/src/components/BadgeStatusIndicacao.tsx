import React from 'react';
import { CheckCircle2, Hourglass, XCircle } from 'lucide-react';
import type { StatusIndicacao } from '../types/indicacao';
import { ROTULO_STATUS_INDICACAO } from '../utils/indicacao';

const ESTILOS: Record<StatusIndicacao, { classes: string; Icone: React.ElementType }> = {
  PENDENTE: { classes: 'bg-amber-100 text-amber-900 border-amber-300', Icone: Hourglass },
  APROVADA: { classes: 'bg-emerald-100 text-emerald-800 border-emerald-300', Icone: CheckCircle2 },
  REJEITADA: { classes: 'bg-red-100 text-red-800 border-red-300', Icone: XCircle },
};

export const BadgeStatusIndicacao: React.FC<{ status: StatusIndicacao }> = ({ status }) => {
  const { classes, Icone } = ESTILOS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${classes}`}
    >
      <Icone className="w-3 h-3" aria-hidden="true" />
      {ROTULO_STATUS_INDICACAO[status]}
    </span>
  );
};
