import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Menu, Shield, Users, X } from 'lucide-react';
import ifpbLogo from '../assets/imagens/ifpb.png';
import { useAuth } from '../contexts/AuthContext';
import { ROTULO_ROLE } from '../types/auth';

interface HeaderIFPBProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  subTitle?: string;
}

export const HeaderIFPB: React.FC<HeaderIFPBProps> = ({ subTitle }) => {
  const { sessao, logout, isAdmin } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Fechamento automático ao clicar fora ou pressionar ESC
  useEffect(() => {
    function tratarCliqueFora(event: MouseEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }

    function tratarTeclaEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuAberto(false);
      }
    }

    if (menuAberto) {
      document.addEventListener('mousedown', tratarCliqueFora);
      document.addEventListener('keydown', tratarTeclaEsc);
    }

    return () => {
      document.removeEventListener('mousedown', tratarCliqueFora);
      document.removeEventListener('keydown', tratarTeclaEsc);
    };
  }, [menuAberto]);

  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Linha Principal com Logo e Menu Hambúrguer */}
        <div className="py-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-6 sm:space-x-8">
            {/* Logo Oficial IFPB */}
            <Link to="/estudantes" onClick={() => setMenuAberto(false)}>
              <img
                src={ifpbLogo}
                alt="Instituto Federal da Paraíba - Campus Cajazeiras"
                className="h-14 sm:h-16 w-auto cursor-pointer"
              />
            </Link>

            {/* Menu Hambúrguer ("Menu Pizza") com Dropdown RBAC */}
            <div ref={menuContainerRef} className="relative flex items-center border-l border-gray-200 pl-4 sm:pl-6">
              <button
                type="button"
                onClick={() => setMenuAberto((prev) => !prev)}
                className={`p-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 ${
                  menuAberto
                    ? 'bg-ifpb-tealLight text-ifpb-teal'
                    : 'text-ifpb-teal hover:text-ifpb-tealHover hover:bg-gray-100'
                }`}
                title={menuAberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                aria-expanded={menuAberto}
                aria-haspopup="true"
                aria-label="Menu principal de navegação"
              >
                {menuAberto ? (
                  <X className="w-6 h-6 sm:w-7 sm:h-7 text-ifpb-teal" strokeWidth={2.4} />
                ) : (
                  <Menu className="w-6 h-6 sm:w-7 sm:h-7 text-ifpb-teal" strokeWidth={2.6} />
                )}
              </button>

              {/* Dropdown de Navegação com Filtro de Restrição */}
              {menuAberto && (
                <div
                  className="absolute left-4 sm:left-6 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 z-50 animate-in fade-in duration-150"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Navegação do Sistema
                    </p>
                    {sessao && (
                      <p className="text-xs text-ifpb-teal font-medium mt-0.5 truncate">
                        Perfil: {ROTULO_ROLE[sessao.role] ?? sessao.role}
                      </p>
                    )}
                  </div>

                  <nav className="flex flex-col gap-1">
                    {/* Item 1: Gestão de Estudantes (Módulo Central de Catálogo e Prontuários) */}
                    <Link
                      to="/estudantes"
                      onClick={() => setMenuAberto(false)}
                      className={`flex items-start gap-3 p-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                        location.pathname === '/estudantes'
                          ? 'bg-ifpb-tealLight text-ifpb-teal font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      role="menuitem"
                    >
                      <Users className="w-5 h-5 shrink-0 mt-0.5 text-ifpb-teal" />
                      <div className="leading-tight">
                        <span className="block font-medium">Gestão de Estudantes</span>
                        <span className="block text-xs text-gray-500 font-normal mt-0.5">
                          Catálogo, busca e prontuários de discentes
                        </span>
                      </div>
                    </Link>

                    {/* Item 2: Gestão de Usuários e Acessos (exclusivo ADMIN) */}
                    {isAdmin && (
                      <Link
                        to="/admin/usuarios"
                        onClick={() => setMenuAberto(false)}
                        className={`flex items-start gap-3 p-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                          location.pathname.startsWith('/admin')
                            ? 'bg-purple-50 text-purple-900 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        role="menuitem"
                      >
                        <Shield className="w-5 h-5 shrink-0 mt-0.5 text-purple-700" />
                        <div className="leading-tight">
                          <span className="block font-medium">Gestão de Usuários</span>
                          <span className="block text-xs text-gray-500 font-normal mt-0.5">
                            Controle de acessos e perfis RBAC
                          </span>
                        </div>
                      </Link>
                    )}
                  </nav>
                </div>
              )}
            </div>
          </div>

          {/* Usuário autenticado (RBAC) */}
          {sessao && (
            <div className="flex items-center gap-3 text-sm">
              {sessao.role === 'ADMIN' && (
                <Link
                  to="/admin/usuarios"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors shadow-2xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Painel Admin
                </Link>
              )}
              <div className="text-right leading-tight hidden xs:block">
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
