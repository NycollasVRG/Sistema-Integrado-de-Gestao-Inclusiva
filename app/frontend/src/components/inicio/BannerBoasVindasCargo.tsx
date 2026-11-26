import React from 'react';
import { RotateCw, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROTULO_ROLE, type SessaoUsuario } from '../../types/auth';
import {
  DESCRICAO_CURTA_ROLE,
  obterEstiloBadgeNivel,
  ROTULO_NIVEL_RESTRICAO,
} from '../../utils/rotasPorCargo';

interface BannerBoasVindasCargoProps {
  sessao: SessaoUsuario;
  icone: LucideIcon;
  subtitulo?: string;
  carregando?: boolean;
  onAtualizar?: () => void;
  destaqueCor?: 'teal' | 'purple';
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
  destaqueCor = 'teal',
}) => {
  const corGradiente =
    destaqueCor === 'purple'
      ? 'from-purple-900 via-purple-800 to-ifpb-teal'
      : 'from-ifpb-teal via-[#11746F] to-[#1A4D3E]';

  return (
    <section
      className={`rounded-2xl bg-gradient-to-r ${corGradiente} text-white p-6 sm:p-7 shadow-sm`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="p-3 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 shrink-0">
            <Icone className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/25">
                {ROTULO_ROLE[sessao.role] ?? sessao.role}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${obterEstiloBadgeNivel(sessao.nivelRestricao)}`}
              >
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                {ROTULO_NIVEL_RESTRICAO[sessao.nivelRestricao] ?? sessao.nivelRestricao}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Olá, {primeiroNome(sessao.nome, sessao.email)}!
            </h1>
            <p className="text-sm text-white/85 mt-1 max-w-2xl">
              {subtitulo || DESCRICAO_CURTA_ROLE[sessao.role]}
            </p>
          </div>
        </div>

        {onAtualizar && (
          <button
            type="button"
            onClick={onAtualizar}
            disabled={carregando}
            className="inline-flex items-center gap-2 self-start md:self-center shrink-0 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60 cursor-pointer transition-colors"
          >
            <RotateCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar painel
          </button>
        )}
      </div>
    </section>
  );
};
