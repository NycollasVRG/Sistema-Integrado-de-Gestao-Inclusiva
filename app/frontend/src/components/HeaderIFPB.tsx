import React from 'react';
import { Home, Menu, Search } from 'lucide-react';
import ifpbLogo from '../assets/imagens/ifpb.png';

interface HeaderIFPBProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  subTitle?: string;
}

export const HeaderIFPB: React.FC<HeaderIFPBProps> = ({
  onSearch,
  searchTerm = '',
  subTitle = 'Estudo de Caso'
}) => {
  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm">
      {/* Barra de Links Superiores */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center py-2 text-xs font-medium text-ifpb-green space-x-6 border-b border-gray-50">
          <a href="#transparencia" className="hover:text-ifpb-greenHover hover:underline transition-colors">
            Transparência
          </a>
          <a href="#concursos" className="hover:text-ifpb-greenHover hover:underline transition-colors">
            Concursos
          </a>
          <a href="#acesso-sistemas" className="hover:text-ifpb-greenHover hover:underline transition-colors">
            Acesso a Sistemas
          </a>
          <a href="#portal-ti" className="hover:text-ifpb-greenHover hover:underline transition-colors">
            Portal da TI
          </a>
          <a href="#contatos" className="hover:text-ifpb-greenHover hover:underline transition-colors">
            Contatos
          </a>
        </div>

        {/* Linha Principal com Logo e Pesquisa */}
        <div className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-8">
            {/* Logo Oficial IFPB */}
            <img
              src={ifpbLogo}
              alt="Instituto Federal da Paraíba - Campus Cajazeiras"
              className="h-16 w-auto cursor-pointer"
            />

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

          {/* Campo de Busca "Pesquisar no site" */}
          <div className="w-full md:w-72 relative">
            <input
              type="text"
              placeholder="Pesquisar no site"
              value={searchTerm}
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="w-full py-1.5 pl-3 pr-9 border-b border-gray-300 focus:border-ifpb-teal text-sm text-ifpb-dark placeholder-gray-400 bg-transparent focus:outline-none transition-colors"
            />
            <Search className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Faixa Breadcrumb Oficial (Fundo #EEF1EC) */}
      <nav aria-label="Breadcrumb" className="w-full bg-ifpb-breadcrumb border-y border-[#E2E8DE] py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center text-xs text-gray-600 space-x-1.5 flex-wrap">
          <a
            href="#home"
            className="text-ifpb-green hover:underline flex items-center"
            title="Página Inicial"
          >
            <Home className="w-3.5 h-3.5 mr-1 text-ifpb-green" />
          </a>
          <span className="text-gray-400">&gt;</span>
          <a href="#assistencia" className="text-ifpb-green hover:underline">
            Assistência Estudantil
          </a>
          <span className="text-gray-400">&gt;</span>
          <span className="font-semibold text-gray-700">
            Coordenação Local de Acessibilidade e Inclusão - CLAI
          </span>
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
