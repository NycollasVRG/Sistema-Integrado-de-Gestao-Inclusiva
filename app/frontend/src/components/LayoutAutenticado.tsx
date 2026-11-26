import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HeaderIFPB } from './HeaderIFPB';
import { SidebarMenu } from './SidebarMenu';

interface LayoutAutenticadoProps {
  subTitle?: string;
  searchTerm?: string;
  onSearch?: (term: string) => void;
  children: React.ReactNode;
}

/**
 * Shell unificado de todas as telas autenticadas:
 * NAV superior (HeaderIFPB) + Menu lateral esquerdo (SidebarMenu) + conteúdo + footer institucional.
 */
export const LayoutAutenticado: React.FC<LayoutAutenticadoProps> = ({
  subTitle,
  searchTerm,
  onSearch,
  children,
}) => {
  const location = useLocation();
  const [rotaMenuAberto, setRotaMenuAberto] = useState<string | null>(null);
  const menuMobileAberto = rotaMenuAberto === location.pathname;

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col selection:bg-ifpb-teal selection:text-white">
      {/* NAV */}
      <HeaderIFPB
        subTitle={subTitle}
        searchTerm={searchTerm}
        onSearch={onSearch}
        menuMobileAberto={menuMobileAberto}
        onToggleMenuMobile={() =>
          setRotaMenuAberto((atual) => (atual === location.pathname ? null : location.pathname))
        }
      />

      {/* Corpo: Menu lateral esquerdo + área de conteúdo */}
      <div className="flex flex-1 w-full">
        <SidebarMenu
          abertoMobile={menuMobileAberto}
          onFecharMobile={() => setRotaMenuAberto(null)}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Footer Institucional */}
      <footer className="w-full bg-[#1A2E26] text-gray-300 text-xs border-t border-gray-800 py-5">
        <div className="px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-ifpb-green shrink-0" />
            <p className="font-medium text-white text-center sm:text-left">
              Instituto Federal de Educação, Ciência e Tecnologia da Paraíba &bull; Campus Cajazeiras
            </p>
          </div>
          <p className="text-gray-400 text-center sm:text-right">
            CLAI - Coordenação Local de Acessibilidade e Inclusão &bull; Sistema SIGI
          </p>
        </div>
      </footer>
    </div>
  );
};
