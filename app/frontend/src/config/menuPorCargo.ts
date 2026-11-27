import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  ClipboardPlus,
  FileText,
  History,
  Home,
  LayoutDashboard,
  Shield,
  Users,
} from 'lucide-react';
import type { Role } from '../types/auth';
import { obterRotaInicialPorRole } from '../utils/rotasPorCargo';

export interface ItemMenuLateral {
  id: string;
  rotulo: string;
  to: string;
  icone: LucideIcon;
  /** Quando true, apenas correspondência exata ativa o item (ex.: rota inicial). */
  correspondenciaExata?: boolean;
}

export interface SecaoMenuLateral {
  id: string;
  titulo: string;
  itens: ItemMenuLateral[];
}

export interface PermissoesMenu {
  role?: Role | null;
  isAdmin: boolean;
  podeIndicarEstudante: boolean;
  podeGerirTriagem: boolean;
  podeVerDashboard: boolean;
  podeAdaptarDua: boolean;
}

/** Constrói as seções e itens do menu lateral esquerdo de acordo com o cargo autenticado. */
export function obterSecoesMenuLateral(permissoes: PermissoesMenu): SecaoMenuLateral[] {
  const { role, isAdmin, podeIndicarEstudante, podeGerirTriagem, podeVerDashboard, podeAdaptarDua } =
    permissoes;

  const principal: ItemMenuLateral[] = [
    {
      id: 'inicio',
      rotulo: 'Início',
      to: obterRotaInicialPorRole(role),
      icone: Home,
      correspondenciaExata: true,
    },
  ];

  if (podeVerDashboard) {
    principal.push({
      id: 'dashboard',
      rotulo: 'Dashboard de Alertas',
      to: '/dashboard',
      icone: LayoutDashboard,
    });
  }

  const acompanhamento: ItemMenuLateral[] = [
    {
      id: 'estudantes',
      rotulo: role === 'ALUNO_APOIADOR' ? 'Estudantes Acompanhados' : 'Estudantes',
      to: '/estudantes',
      icone: Users,
    },
  ];

  if (podeGerirTriagem) {
    acompanhamento.push({
      id: 'triagem',
      rotulo: 'Triagem e Indicações',
      to: '/triagem',
      icone: ClipboardList,
    });
  }

  if (podeIndicarEstudante) {
    acompanhamento.push({
      id: 'indicar-estudante',
      rotulo: 'Indicar Estudante',
      to: '/indicacoes/nova',
      icone: ClipboardPlus,
    });
  }

  if (podeAdaptarDua) {
    acompanhamento.push({
      id: 'adaptacao-dua',
      rotulo: 'Adaptação DUA',
      to: '/adaptacao-dua',
      icone: FileText,
    });
  }

  const secoes: SecaoMenuLateral[] = [
    { id: 'principal', titulo: 'Principal', itens: principal },
    {
      id: 'acompanhamento',
      titulo: role === 'ALUNO_APOIADOR' ? 'Apoio Inclusivo' : 'Acompanhamento',
      itens: acompanhamento,
    },
  ];

  if (isAdmin) {
    secoes.push({
      id: 'administracao',
      titulo: 'Administração',
      itens: [
        {
          id: 'admin-usuarios',
          rotulo: 'Gestão de Usuários',
          to: '/admin/usuarios',
          icone: Shield,
        },
        {
          id: 'admin-auditoria',
          rotulo: 'Auditoria',
          to: '/admin/auditoria',
          icone: History,
        },
      ],
    });
  }

  return secoes;
}
