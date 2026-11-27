import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { obterSecoesMenuLateral, type ItemMenuLateral } from '../config/menuPorCargo';

interface SidebarMenuProps {
  abertoMobile: boolean;
  onFecharMobile: () => void;
}

function itemEstaAtivo(item: ItemMenuLateral, pathname: string): boolean {
  if (item.correspondenciaExata) {
    return pathname === item.to;
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ abertoMobile, onFecharMobile }) => {
  const {
    sessao,
    isAdmin,
    podeIndicarEstudante,
    podeGerirTriagem,
    podeVerDashboard,
    podeAdaptarDua,
  } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!abertoMobile) return;
    function aoPressionarEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') onFecharMobile();
    }
    document.addEventListener('keydown', aoPressionarEsc);
    return () => document.removeEventListener('keydown', aoPressionarEsc);
  }, [abertoMobile, onFecharMobile]);

  const secoes = obterSecoesMenuLateral({
    role: sessao?.role,
    isAdmin,
    podeIndicarEstudante,
    podeGerirTriagem,
    podeVerDashboard,
    podeAdaptarDua,
  });

  const conteudoNavegacao = (emDrawer: boolean) => (
    <div className="flex flex-col h-full">
      {emDrawer && (
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Menu</p>
          <button
            type="button"
            onClick={onFecharMobile}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
            aria-label="Fechar menu lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {secoes.map((secao) => (
          <div key={secao.id}>
            <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {secao.titulo}
            </p>
            <ul className="space-y-1">
              {secao.itens.map((item) => {
                const Icone = item.icone;
                const ativo = itemEstaAtivo(item, location.pathname);

                return (
                  <li key={item.id}>
                    <Link
                      to={item.to}
                      onClick={emDrawer ? onFecharMobile : undefined}
                      aria-current={ativo ? 'page' : undefined}
                      className={`group flex items-center gap-3 px-2.5 py-2 rounded-lg border-l-[3px] text-sm transition-colors ${
                        ativo
                          ? 'bg-ifpb-tealLight text-ifpb-teal border-ifpb-teal font-semibold'
                          : 'text-gray-700 border-transparent hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icone
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          ativo ? 'text-ifpb-teal' : 'text-gray-500 group-hover:text-ifpb-teal'
                        }`}
                      />
                      <span className="truncate">{item.rotulo}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside
        aria-label="Menu lateral"
        className="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 shrink-0 bg-white border-r border-gray-200"
      >
        <div className="sticky top-[73px] max-h-[calc(100vh-73px)] flex flex-col flex-1">
          {conteudoNavegacao(false)}
        </div>
      </aside>

      {abertoMobile && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={onFecharMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[85vw] bg-white h-full shadow-2xl border-r border-gray-200 flex flex-col">
            {conteudoNavegacao(true)}
          </aside>
        </div>
      )}
    </>
  );
};
