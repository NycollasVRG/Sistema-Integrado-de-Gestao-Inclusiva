import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROTULO_ROLE } from '../types/auth';
import { obterSecoesMenuLateral, type ItemMenuLateral } from '../config/menuPorCargo';
import { obterEstiloBadgeNivel, ROTULO_NIVEL_RESTRICAO } from '../utils/rotasPorCargo';

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
      {/* Cabeçalho do Menu com Cargo e Nível LGPD */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Menu do Sistema
          </p>
          {emDrawer && (
            <button
              type="button"
              onClick={onFecharMobile}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              aria-label="Fechar menu lateral"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {sessao && (
          <div className="mt-2.5 rounded-lg bg-[#F8FAF8] border border-gray-200/80 p-2.5">
            <p className="text-xs font-bold text-ifpb-teal truncate">
              {ROTULO_ROLE[sessao.role] ?? sessao.role}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${obterEstiloBadgeNivel(sessao.nivelRestricao)}`}
              >
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                {ROTULO_NIVEL_RESTRICAO[sessao.nivelRestricao] ?? sessao.nivelRestricao}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Seções de links por cargo */}
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {secoes.map((secao) => (
          <div key={secao.id}>
            <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {secao.titulo}
            </p>
            <ul className="space-y-1">
              {secao.itens.map((item) => {
                const Icone = item.icone;
                const ativo = itemEstaAtivo(item, location.pathname);
                const ehAdmin = item.destaque === 'admin';

                const classesAtivo = ehAdmin
                  ? 'bg-purple-50 text-purple-900 border-purple-600 font-semibold'
                  : 'bg-ifpb-tealLight text-ifpb-teal border-ifpb-teal font-semibold';

                const classesInativo =
                  'text-gray-700 border-transparent hover:bg-gray-50 hover:text-gray-900';

                const corIcone = ehAdmin
                  ? ativo
                    ? 'text-purple-700'
                    : 'text-purple-600'
                  : ativo
                    ? 'text-ifpb-teal'
                    : 'text-gray-500 group-hover:text-ifpb-teal';

                return (
                  <li key={item.id}>
                    <Link
                      to={item.to}
                      onClick={emDrawer ? onFecharMobile : undefined}
                      aria-current={ativo ? 'page' : undefined}
                      className={`group flex items-start gap-3 px-2.5 py-2.5 rounded-lg border-l-[3px] text-sm transition-colors ${
                        ativo ? classesAtivo : classesInativo
                      }`}
                    >
                      <Icone className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${corIcone}`} />
                      <div className="min-w-0 leading-tight">
                        <span className="block truncate">{item.rotulo}</span>
                        <span className="block text-[11px] text-gray-500 font-normal mt-0.5 truncate">
                          {item.descricao}
                        </span>
                      </div>
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
      {/* Sidebar fixa no desktop (lg+) */}
      <aside
        aria-label="Menu lateral"
        className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 shrink-0 bg-white border-r border-gray-200"
      >
        <div className="sticky top-[73px] max-h-[calc(100vh-73px)] flex flex-col flex-1">
          {conteudoNavegacao(false)}
        </div>
      </aside>

      {/* Drawer deslizante no mobile/tablet (< lg) */}
      {abertoMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={onFecharMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white h-full shadow-2xl border-r border-gray-200 flex flex-col">
            {conteudoNavegacao(true)}
          </aside>
        </div>
      )}
    </>
  );
};
