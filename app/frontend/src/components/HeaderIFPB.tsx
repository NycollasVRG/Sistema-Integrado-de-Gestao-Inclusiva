import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Menu } from 'lucide-react';
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

      {/* Faixa Breadcrumb Oficial (Fundo #EEF1EC) */}
      <nav aria-label="Breadcrumb" className="w-full bg-ifpb-breadcrumb border-y border-[#E2E8DE] py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center text-xs text-gray-600 space-x-1.5 flex-wrap">
          <Link
            to="/"
            className="text-ifpb-green hover:underline flex items-center"
            title="Página Inicial"
          >
            <Home className="w-3.5 h-3.5 mr-1 text-ifpb-green" />
          </Link>
          <span className="text-gray-400">&gt;</span>
          <a href="#assistencia" className="text-ifpb-green hover:underline">
            Assistência Estudantil
          </a>
          <span className="text-gray-400">&gt;</span>
          <Link to="/" className="font-semibold text-gray-700 hover:underline">
            Coordenação Local de Acessibilidade e Inclusão - CLAI
          </Link>
          {subTitle && (
            <>
              <span className="text-gray-400">&gt;</span>
              <span className="text-ifpb-teal font-medium">{subTitle}</span>
            </>
          )}
        </div>
      </nav>

      {/* Título Principal em Destaque (#0F6460) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ifpb-teal tracking-tight">
          Coordenação Local de Acessibilidade e Inclusão - CLAI
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sistema Integrado de Gestão Inclusiva (SIGI) &bull; Estudo de Caso e Acompanhamento Individualizado
        </p>
      </div>
    </header>
  );
};
