import type { NivelRestricao } from './auth';

export interface CargoDTO {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  nivelRestricaoPadrao: NivelRestricao;
  autorizacaoSaudePadrao: boolean;
  ativo: boolean;
  sistema: boolean;
  criadoEm: string | null;
  atualizadoEm: string | null;
}

export interface CargoRequestDTO {
  codigo: string;
  nome: string;
  descricao: string | null;
  nivelRestricaoPadrao: NivelRestricao;
  autorizacaoSaudePadrao: boolean;
  ativo: boolean;
}
