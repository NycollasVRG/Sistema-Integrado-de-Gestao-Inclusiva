import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import ifpbLogo from '../assets/imagens/ifpb.png';

interface HeaderIFPBProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  subTitle?: string;
}

export const HeaderIFPB: React.FC<HeaderIFPBProps> = ({ subTitle }) => {
  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Linha Principal com Logo e Menu Hambúrguer */}
        <div className="py-4 flex items-center">
          <div className="flex items-center space-x-8">
            {/* Logo Oficial IFPB */}
            <Link to="/">
              <img
                src={ifpbLogo}
                alt="Instituto Federal da Paraíba - Campus Cajazeiras"
                className="h-16 w-auto cursor-pointer"
              />
            </Link>

            {/* Menu Hambúrguer */}
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
              <button
                type="button"
                className="text-ifpb-teal hover:text-ifpb-tealHover focus:outline-none p-1 rounded transition-colors"
                title="Menu de Navegação"
              >
                <Menu className="w-7 h-7 text-[#0F6460]" strokeWidth={2.6} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Título Principal em Destaque (#0F6460) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ifpb-teal tracking-tight">
          Coordenação Local de Acessibilidade e Inclusão - CLAI
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sistema Integrado de Gestão Inclusiva (SIGI) &bull; Estudo de Caso e Acompanhamento Individualizado
        </p>
        
        {subTitle && (
          <p className="text-sm font-semibold text-ifpb-teal mt-2">
            {subTitle}
          </p>
        )}

      </div>
    </header>
  );
};
