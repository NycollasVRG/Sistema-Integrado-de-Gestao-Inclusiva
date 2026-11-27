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
  ADMIN: 'Governança de acessos RBAC, auditoria imutável e supervisão geral do SIGI-CLAI.',
  COORDENADOR: 'Supervisão pedagógica, gestão de alertas críticos, triagens e revisões de PEI.',
  CLAI_PSICOPEDAGOGO: 'Acompanhamento especializado, triagem de indicações, Estudos de Caso, PEIs e atas.',
  PROFESSOR: 'Apoio pedagógico em sala, adaptação DUA de provas, PEAs e indicação de estudantes.',
  ALUNO_APOIADOR: 'Consulta funcional de orientações pedagógicas para apoio inclusivo aos estudantes.',
};

export const SUBTITULO_INICIO_POR_ROLE: Record<Role, string> = {
  ADMIN: 'Painel Inicial • Administrador',
  COORDENADOR: 'Painel Inicial • Coordenador',
  CLAI_PSICOPEDAGOGO: 'Painel Inicial • Psicopedagogo CLAI',
  PROFESSOR: 'Painel Inicial • Professor',
  ALUNO_APOIADOR: 'Painel Inicial • Aluno Apoiador',
};

export function obterRotaInicialPorRole(role?: Role | null): string {
  return role ? ROTA_INICIAL_POR_ROLE[role] : '/inicio';
}

export function obterEstiloBadgeNivel(nivel?: NivelRestricao | null): string {
  switch (nivel) {
    case 'SUPER_RESTRICAO':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'RESTRICAO_MODERADA':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
}
