import type { NivelRestricao, Role } from '../types/auth';

/** Rotas iniciais dedicadas por cargo (todo login redireciona para a rota correspondente). */
export const ROTA_INICIAL_POR_ROLE: Record<Role, string> = {
  ADMIN: '/inicio/admin',
  COORDENADOR: '/inicio/coordenador',
  CLAI_PSICOPEDAGOGO: '/inicio/psicopedagogo',
  PROFESSOR: '/inicio/professor',
  ALUNO_APOIADOR: '/inicio/aluno-apoiador',
};

export const ROTULO_NIVEL_RESTRICAO: Record<NivelRestricao, string> = {
  SUPER_RESTRICAO: 'Super Restrição',
  RESTRICAO_MODERADA: 'Restrição Moderada',
  ACESSO_FUNCIONAL: 'Acesso Funcional',
};

export const DESCRICAO_CURTA_ROLE: Record<Role, string> = {
  ADMIN: 'Gestão de usuários, auditoria e acompanhamento geral do sistema.',
  COORDENADOR: 'Acompanhamento de alertas, triagens e revisões de PEI.',
  CLAI_PSICOPEDAGOGO: 'Triagem de indicações, prontuários e acompanhamentos da CLAI.',
  PROFESSOR: 'Consulta de estudantes, adaptações de provas e encaminhamentos.',
  ALUNO_APOIADOR: 'Consulta de orientações pedagógicas para apoio aos estudantes.',
};

export const SUBTITULO_INICIO_POR_ROLE: Record<Role, string> = {
  ADMIN: 'Início • Administrador',
  COORDENADOR: 'Início • Coordenador',
  CLAI_PSICOPEDAGOGO: 'Início • Psicopedagogo CLAI',
  PROFESSOR: 'Início • Professor',
  ALUNO_APOIADOR: 'Início • Aluno Apoiador',
};

export function obterRotaInicialPorRole(role?: Role | null): string {
  return role ? ROTA_INICIAL_POR_ROLE[role] : '/inicio';
}

export function obterEstiloBadgeNivel(nivel?: NivelRestricao | null): string {
  switch (nivel) {
    case 'SUPER_RESTRICAO':
      return 'bg-ifpb-tealLight text-ifpb-teal border-ifpb-teal/30';
    case 'RESTRICAO_MODERADA':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-ifpb-greenLight text-ifpb-greenHover border-ifpb-green/30';
  }
}
