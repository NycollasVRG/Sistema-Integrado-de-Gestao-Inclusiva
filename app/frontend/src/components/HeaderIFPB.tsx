import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import ifpbLogo from '../assets/imagens/ifpb.png';
import { useAuth } from '../contexts/AuthContext';
import { ROTULO_ROLE } from '../types/auth';
import { obterRotaInicialPorRole } from '../utils/rotasPorCargo';
import { DropdownNotificacoes } from './DropdownNotificacoes';

interface HeaderIFPBProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  subTitle?: string;
  menuMobileAberto?: boolean;
  onToggleMenuMobile?: () => void;
}

export const HeaderIFPB: React.FC<HeaderIFPBProps> = ({
  subTitle,
  menuMobileAberto = false,
  onToggleMenuMobile,
}) => {
  const { sessao, logout, isCoordenador } = useAuth();
  const rotaInicio = obterRotaInicialPorRole(sessao?.role);

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-2xs sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="min-h-[72px] py-2.5 flex items-center justify-between gap-4">
          {/* Esquerda: Botão Drawer Mobile + Logo IFPB + Identidade SIGI-CLAI */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {onToggleMenuMobile && (
              <button
                type="button"
                onClick={onToggleMenuMobile}
                className={`lg:hidden p-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 ${
                  menuMobileAberto
                    ? 'bg-ifpb-tealLight text-ifpb-teal'
                    : 'text-ifpb-teal hover:text-ifpb-tealHover hover:bg-gray-100'
                }`}
                title={menuMobileAberto ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={menuMobileAberto}
                aria-label="Alternar menu lateral"
              >
                {menuMobileAberto ? (
                  <X className="w-6 h-6 text-ifpb-teal" strokeWidth={2.4} />
                ) : (
                  <Menu className="w-6 h-6 text-ifpb-teal" strokeWidth={2.4} />
                )}
              </button>
            )}

            <Link to={rotaInicio} className="shrink-0" title="Ir para a tela inicial">
              <img
                src={ifpbLogo}
                alt="Instituto Federal da Paraíba - Campus Cajazeiras"
                className="h-10 sm:h-12 w-auto cursor-pointer"
              />
            </Link>

            <div className="hidden md:block border-l border-gray-200 pl-4 min-w-0">
              <p className="text-sm lg:text-base font-extrabold text-ifpb-teal tracking-tight truncate">
                SIGI-CLAI &bull; Coordenação Local de Acessibilidade e Inclusão
              </p>
              <p className="text-xs text-gray-500 truncate">
                {subTitle || 'Sistema Integrado de Gestão Inclusiva'}
              </p>
            </div>
          </div>

          {/* Direita: Notificações + Usuário + Sair */}
          {sessao && (
            <div className="flex items-center gap-2.5 sm:gap-3 text-sm shrink-0">
              {/* TA3.3: central de notificações com atalho para revisão do PEI */}
              {isCoordenador && <DropdownNotificacoes />}

              <div className="text-right leading-tight hidden sm:block max-w-[190px]">
                <p className="font-semibold text-gray-800 truncate">
                  {sessao.nome || sessao.email}
                </p>
                <p className="text-xs text-ifpb-teal font-medium truncate">
                  {ROTULO_ROLE[sessao.role] ?? sessao.role}
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Sair</span>
              </button>
            </div>
          )}
        </div>

        {/* Faixa compacta de subtítulo em telas menores */}
        {subTitle && (
          <div className="md:hidden pb-2.5 -mt-1 border-t border-gray-100 pt-2">
            <p className="text-xs font-semibold text-ifpb-teal truncate">{subTitle}</p>
          </div>
        )}
      </div>
    </header>
  );
};
