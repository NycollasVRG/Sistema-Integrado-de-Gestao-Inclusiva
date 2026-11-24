import type { StatusEstudoCaso } from './estudoDeCaso';

export type ProntuarioModalTipo =
  | 'ATENDIMENTO'
  | 'ESTUDO'
  | 'EMITIR_RAE'
  | 'GERAR_DOSSIE'
  | 'NOVA_ATA'
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

/** Corpo do POST /api/atendimentos (AtendimentoRequestDTO do back-end). */
export interface NovoAtendimentoRequestDTO {
  alunoId: string;
  tipoAtendimento: TipoAtendimento;
  /** YYYY-MM-DD */
  dataAtendimento: string;
  profissionalResponsavel: string;
  descricao: string;
  encaminhamentos?: string;
}

/** Corpo do PUT /api/atendimentos/{id} (AtendimentoUpdateDTO): substituição completa; o aluno não muda. */
export interface AtualizarAtendimentoRequestDTO {
  tipoAtendimento: TipoAtendimento;
  dataAtendimento: string;
  profissionalResponsavel: string;
  descricao: string;
  /** Vazio/ausente limpa o campo no servidor. */
  encaminhamentos?: string;
}

/**
 * Resposta da API de atendimentos (AtendimentoResponseDTO).
 * As datas-hora ({@code criadoEm}, {@code atualizadoEm}, {@code edicaoPermitidaAte}) chegam como
 * LocalDateTime sem fuso; use utils/atendimento.ts para interpretá-las.
 */
export interface NovoAtendimentoResponseDTO {
  id: string;
  alunoId: string;
  nomeEstudante?: string | null;
  matriculaAluno: string;
  tipoAtendimento: TipoAtendimento;
  dataAtendimento: string;
  profissionalResponsavel: string;
  descricao: string;
  encaminhamentos?: string | null;
  /** UUID do autor; comparado com {@code sessao.userId} para liberar a edição. */
  criadoPor?: string | null;
  criadoEm: string;
  atualizadoEm?: string | null;
  edicaoPermitidaAte?: string | null;
}

export interface NovoEstudoRapidoRequestDTO {
  alunoId: string;
  status: StatusEstudoCaso;
  diagnosticoInicial: string;
  historico: string;
  indicadoresIds: string[];
}
