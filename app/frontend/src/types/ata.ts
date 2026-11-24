/** Contratos da US 08 (Atas de Reunião) alinhados com os DTOs do backend. */

export type TipoReuniao = 'PEDAGOGICA' | 'ALINHAMENTO_FAMILIA';
export type StatusAta = 'RASCUNHO' | 'FINALIZADA';
export type StatusCompromisso = 'PENDENTE' | 'CONCLUIDO';

export const ROTULO_TIPO_REUNIAO: Record<TipoReuniao, string> = {
  PEDAGOGICA: 'Reunião Pedagógica',
  ALINHAMENTO_FAMILIA: 'Alinhamento com a Família',
};

export const ROTULO_STATUS_ATA: Record<StatusAta, string> = {
  RASCUNHO: 'Rascunho',
  FINALIZADA: 'Finalizada',
};

export interface AtaCompromissoRequestDTO {
  descricao: string;
  /** UUID de um usuário ativo no sistema (obrigatório no backend). */
  responsavelId: string;
  /** YYYY-MM-DD */
  prazo: string;
}

export interface AtaCompromissoResponseDTO {
  id: string;
  descricao: string;
  responsavelId: string | null;
  responsavelNome: string | null;
  /** YYYY-MM-DD */
  prazo: string;
  status: StatusCompromisso;
  lembreteEnviadoEm?: string | null;
}

export interface AtaAssinaturaRequestDTO {
  nomeParticipante: string;
  papelParticipante: string;
  /** Opcional: participantes externos não possuem usuário no sistema. */
  usuarioId?: string | null;
}

/** Envelope do POST /api/atas/{id}/assinaturas. */
export interface AtaAssinaturasRequestDTO {
  assinaturas: AtaAssinaturaRequestDTO[];
}

export interface AtaAssinaturaResponseDTO {
  id: string;
  nomeParticipante: string;
  papelParticipante: string;
  usuarioId: string | null;
  assinadoEm: string;
  ipOrigem?: string | null;
  /** SHA-256 do conteúdo normativo no momento da coleta. */
  hashConteudo?: string | null;
}

export interface TermoAditivoRequestDTO {
  texto: string;
}

export interface TermoAditivoResponseDTO {
  id: string;
  ataId: string;
  texto: string;
  criadoPor?: string | null;
  criadoEm: string;
}

/** Corpo do POST /api/atas. */
export interface AtaReuniaoRequestDTO {
  alunoId: string;
  tipoReuniao: TipoReuniao;
  /** LocalDateTime sem fuso, no formato aceito pelo backend (YYYY-MM-DDTHH:mm). */
  dataReuniao: string;
  localReuniao?: string | null;
  pauta: string;
  deliberacoes?: string | null;
  compromissos: AtaCompromissoRequestDTO[];
}

/** Corpo do PUT /api/atas/{id}: mesmo conteúdo, sem o identificador do estudante. */
export type AtaReuniaoUpdateDTO = Omit<AtaReuniaoRequestDTO, 'alunoId'>;

/** Resposta completa da ata (AtaReuniaoResponseDTO). */
export interface AtaReuniaoResponseDTO {
  id: string;
  alunoId: string;
  alunoNome?: string | null;
  tipoReuniao: TipoReuniao;
  dataReuniao: string;
  localReuniao?: string | null;
  pauta: string;
  deliberacoes?: string | null;
  status: StatusAta;
  documentoAssinadoAnexado: boolean;
  documentoNomeOriginal?: string | null;
  documentoContentType?: string | null;
  documentoTamanhoBytes?: number | null;
  finalizadaEm?: string | null;
  finalizadaPor?: string | null;
  assinaturas: AtaAssinaturaResponseDTO[];
  compromissos: AtaCompromissoResponseDTO[];
  termosAditivos: TermoAditivoResponseDTO[];
  criadoPor?: string | null;
  criadoEm: string;
  atualizadoEm?: string | null;
}

/** Extensões aceitas pelo endpoint de documento assinado da ata. */
export const EXTENSOES_DOCUMENTO_ATA = '.pdf,.png,.jpg,.jpeg';
export const TAMANHO_MAXIMO_DOCUMENTO_ATA_BYTES = 10 * 1024 * 1024;
