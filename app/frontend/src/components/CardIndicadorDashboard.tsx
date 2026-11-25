import React from 'react';

export type TomIndicador = 'neutro' | 'vermelho' | 'pedagogico' | 'sucesso';

const ESTILO_TOM: Record<TomIndicador, { cartao: string; valor: string; icone: string }> = {
  neutro: { cartao: 'border-gray-200 bg-white', valor: 'text-ifpb-dark', icone: 'bg-gray-100 text-gray-600' },
  vermelho: { cartao: 'border-red-200 bg-red-50', valor: 'text-ifpb-red', icone: 'bg-red-100 text-ifpb-red' },
  pedagogico: { cartao: 'border-amber-200 bg-amber-50', valor: 'text-amber-800', icone: 'bg-amber-100 text-amber-700' },
  sucesso: { cartao: 'border-ifpb-green/30 bg-ifpb-greenLight', valor: 'text-ifpb-teal', icone: 'bg-white text-ifpb-green' },
};

interface CardIndicadorDashboardProps {
  titulo: string;
  valor: number;
  descricao?: string;
  tom?: TomIndicador;
  icone: React.ReactNode;
}

/** Card de indicador do Dashboard da CLAI (US 05). */
export const CardIndicadorDashboard: React.FC<CardIndicadorDashboardProps> = ({
  titulo,
  valor,
  descricao,
  tom = 'neutro',
  icone,
}) => {
  const estilo = ESTILO_TOM[tom];
  return (
    <div className={`rounded-xl border p-4 shadow-xs ${estilo.cartao}`} role="group" aria-label={titulo}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">{titulo}</p>
        <span className={`rounded-lg p-1.5 ${estilo.icone}`} aria-hidden="true">
          {icone}
        </span>
      </div>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums ${estilo.valor}`}>{valor}</p>
      {descricao && <p className="mt-1 text-xs text-gray-500">{descricao}</p>}
    </div>
  );
};
