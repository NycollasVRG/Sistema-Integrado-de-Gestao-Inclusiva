import React from 'react';
import { RotateCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SessaoUsuario } from '../../types/auth';
import { DESCRICAO_CURTA_ROLE } from '../../utils/rotasPorCargo';

interface BannerBoasVindasCargoProps {
  sessao: SessaoUsuario;
  icone: LucideIcon;
  subtitulo?: string;
  carregando?: boolean;
  onAtualizar?: () => void;
  acaoExtra?: React.ReactNode;
}

function primeiroNome(nome?: string | null, email?: string | null): string {
  const base = nome?.trim();
  if (base) return base.split(/\s+/)[0];
  return email?.split('@')[0] || 'Usuário';
}

export const BannerBoasVindasCargo: React.FC<BannerBoasVindasCargoProps> = ({
  sessao,
  icone: Icone,
  subtitulo,
  carregando = false,
  onAtualizar,
  acaoExtra,
}) => {
  return (
    <section className="rounded-xl bg-white border border-gray-200 px-5 py-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2.5 rounded-lg bg-ifpb-tealLight text-ifpb-teal shrink-0">
            <Icone className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight truncate">
              Olá, {primeiroNome(sessao.nome, sessao.email)}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
              {subtitulo || DESCRICAO_CURTA_ROLE[sessao.role]}
            </p>
          </div>
        </div>

        {(acaoExtra || onAtualizar) && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {acaoExtra}
            {onAtualizar && (
              <button
                type="button"
                onClick={onAtualizar}
                disabled={carregando}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60 cursor-pointer transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
