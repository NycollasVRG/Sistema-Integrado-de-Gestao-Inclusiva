import type { Role, NivelRestricao } from './auth';

export interface UsuarioAdminDTO {
  id: string;
  nome: string;
  email: string;
  role: Role;
  nivelRestricao: NivelRestricao;
  autorizacaoSaude: boolean;
  acessoAtivo: boolean;
  tokenVersion: number;
}

export interface UsuarioRevogadoResponseDTO {
  id: string;
  email: string;
  nome: string;
  acessoAtivo: boolean;
  tokenVersion: number;
  mensagem: string;
}
