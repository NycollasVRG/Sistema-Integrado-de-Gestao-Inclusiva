import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, Shield } from 'lucide-react';
import ifpbLogo from '../assets/imagens/ifpb.png';
import { useAuth } from '../contexts/AuthContext';
import { ROTULO_ROLE } from '../types/auth';

interface HeaderIFPBProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  subTitle?: string;
}

export const HeaderIFPB: React.FC<HeaderIFPBProps> = ({ subTitle }) => {
  const { sessao, logout } = useAuth();
  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Linha Principal com Logo e Menu Hambúrguer */}
        <div className="py-4 flex items-center justify-between gap-4">
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
      clear
          </div>

          {/* Usuário autenticado (RBAC) */}
          {sessao && (
            <div className="flex items-center gap-3 text-sm">
              {sessao.role === 'ADMIN' && (
                <Link
                  to="/admin/usuarios"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors shadow-2xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Painel Admin
                </Link>
              )}
              <div className="text-right leading-tight">
                <p className="font-semibold text-gray-800">{sessao.nome || sessao.email}</p>
                <p className="text-xs text-ifpb-teal font-medium">{ROTULO_ROLE[sessao.role] ?? sessao.role}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}

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
