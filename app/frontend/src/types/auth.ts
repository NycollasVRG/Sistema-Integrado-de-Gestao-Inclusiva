/** Contratos de autenticação/RBAC alinhados com LoginResponseDTO e UsuarioSessaoDTO do back-end. */
export type Role =
  | 'ADMIN'
  | 'COORDENADOR'
  | 'CLAI_PSICOPEDAGOGO'
  | 'PROFESSOR'
  | 'ALUNO_APOIADOR';

export type NivelRestricao =
  | 'SUPER_RESTRICAO'
  | 'RESTRICAO_MODERADA'
  | 'ACESSO_FUNCIONAL';

export interface SessaoUsuario {
  token: string;
  tipoToken: string;
  userId: string;
  nome: string;
  email: string;
  role: Role;
  nivelRestricao: NivelRestricao;
  autorizacaoSaude: boolean;
  tokenVersion: number;
}

export const ROTULO_ROLE: Record<Role, string> = {
  ADMIN: 'Administrador',
  COORDENADOR: 'Coordenador',
  CLAI_PSICOPEDAGOGO: 'Psicopedagogo CLAI',
  PROFESSOR: 'Professor',
  ALUNO_APOIADOR: 'Aluno Apoiador',
};
