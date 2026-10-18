import type { StatusEstudoCaso } from './estudoDeCaso';

export type ProntuarioModalTipo =
  | 'ATENDIMENTO'
  | 'ESTUDO'
  | 'EMITIR_RAE'
  | 'GERAR_DOSSIE'
  | null;

export type TipoAtendimento =
  | 'PEDAGOGICO'
  | 'PSICOLOGICO'
  | 'ASSISTENCIA_SOCIAL'
  | 'ACESSIBILIDADE'
  | 'MULTIDISCIPLINAR';

export type TipoDocumentoProntuario = 'RAE' | 'DOSSIE';

export interface AlunoModalData {
  id: string;
  nome: string;
  matricula: string;
  curso: string;
  turma?: string;
}

export interface NovoAtendimentoRequestDTO {
  alunoId: string;
  matriculaAluno: string;
  tipoAtendimento: TipoAtendimento;
  dataAtendimento: string;
  profissionalResponsavel: string;
  descricao: string;
  encaminhamentos?: string;
}

export interface NovoAtendimentoResponseDTO {
  id: string;
  alunoId: string;
  matriculaAluno: string;
  tipoAtendimento: TipoAtendimento;
  dataAtendimento: string;
  profissionalResponsavel: string;
  descricao: string;
  encaminhamentos?: string;
  criadoEm: string;
}

export interface NovoEstudoRapidoRequestDTO {
  alunoId: string;
  status: StatusEstudoCaso;
  diagnosticoInicial: string;
  indicadoresIds: string[];
}

export interface EmissaoDocumentoRequestDTO {
  alunoId: string;
  matriculaAluno: string;
  tipoDocumento: TipoDocumentoProntuario;
  periodoReferencia?: string;
  incluirHistoricoCompleto?: boolean;
  observacoesAdicionais?: string;
}

export interface EmissaoDocumentoResponseDTO {
  id: string;
  alunoId: string;
  tipoDocumento: TipoDocumentoProntuario;
  protocolo: string;
  geradoEm: string;
  resumo: string;
}
