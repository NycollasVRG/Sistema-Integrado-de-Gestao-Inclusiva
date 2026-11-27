import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
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

export type DestaqueMenu = 'padrao' | 'admin';

export interface ItemMenuLateral {
  id: string;
  rotulo: string;
  descricao: string;
  to: string;
  icone: LucideIcon;
  destaque?: DestaqueMenu;
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
  podeGerirCargos: boolean;
}

/** Constrói as seções e itens do menu lateral esquerdo de acordo com o cargo/RBAC autenticado. */
export function obterSecoesMenuLateral(permissoes: PermissoesMenu): SecaoMenuLateral[] {
  const {
    role,
    isAdmin,
    podeIndicarEstudante,
    podeGerirTriagem,
    podeVerDashboard,
    podeAdaptarDua,
    podeGerirCargos,
  } = permissoes;

  const principal: ItemMenuLateral[] = [
    {
      id: 'inicio',
      rotulo: 'Início',
      descricao: 'Visão geral e atalhos do seu cargo',
      to: obterRotaInicialPorRole(role),
      icone: Home,
      correspondenciaExata: true,
    },
  ];

  if (podeVerDashboard) {
    principal.push({
      id: 'dashboard',
      rotulo: 'Dashboard de Alertas',
      descricao: 'Indicadores, alertas e tratativas',
      to: '/dashboard',
      icone: LayoutDashboard,
    });
  }

  const acompanhamento: ItemMenuLateral[] = [
    {
      id: 'estudantes',
      rotulo: role === 'ALUNO_APOIADOR' ? 'Estudantes Acompanhados' : 'Gestão de Estudantes',
      descricao:
        role === 'ALUNO_APOIADOR'
          ? 'Consulta funcional de prontuários'
          : 'Catálogo, busca e prontuários',
      to: '/estudantes',
      icone: Users,
    },
  ];

  if (podeGerirTriagem) {
    acompanhamento.push({
      id: 'triagem',
      rotulo: 'Triagem e Indicações',
      descricao: 'Analisar indicações e iniciar estudos',
      to: '/triagem',
      icone: ClipboardList,
    });
  }

  if (podeIndicarEstudante) {
    acompanhamento.push({
      id: 'indicar-estudante',
      rotulo: 'Indicar Estudante',
      descricao: 'Encaminhar demanda espontânea à CLAI',
      to: '/indicacoes/nova',
      icone: ClipboardPlus,
    });
  }

  if (podeAdaptarDua) {
    acompanhamento.push({
      id: 'adaptacao-dua',
      rotulo: 'Adaptação DUA',
      descricao: 'Adaptar provas com apoio de IA',
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

  if (isAdmin || podeGerirCargos) {
    const itensGestao: ItemMenuLateral[] = [];

    if (isAdmin) {
      itensGestao.push({
        id: 'admin-usuarios',
        rotulo: 'Gestão de Usuários',
        descricao: 'Controle de acessos e perfis RBAC',
        to: '/admin/usuarios',
        icone: Shield,
        destaque: 'admin',
      });
    }

    if (podeGerirCargos) {
      itensGestao.push({
        id: 'gestao-cargos',
        rotulo: 'Gestão de Cargos',
        descricao: 'Cadastro e gestão de cargos institucionais',
        to: '/cargos',
        icone: Briefcase,
        destaque: 'admin',
      });
    }

    if (isAdmin) {
      itensGestao.push({
        id: 'admin-auditoria',
        rotulo: 'Trilha de Auditoria',
        descricao: 'Logs imutáveis somente leitura',
        to: '/admin/auditoria',
        icone: History,
        destaque: 'admin',
      });
    }

    secoes.push({
      id: 'administracao',
      titulo: isAdmin ? 'Administração' : 'Coordenação',
      itens: itensGestao,
    });
  }

  return secoes;
}
