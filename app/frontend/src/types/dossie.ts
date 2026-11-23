/** Escopo de exportação do Dossiê Jurídico (US 06 / TA6.2 / TA6.4). */
export type EscopoDossie = 'INTERNO' | 'EXTERNO';

export const ESCOPO_DOSSIE_LABEL: Record<EscopoDossie, string> = {
  INTERNO: 'Dossiê Jurídico Completo (Uso Interno / Órgãos de Controle)',
  EXTERNO: 'Relatório para Transferência Externa (Omite Dados Super Restritos)',
};

/** Registro somente-leitura da trilha imutável de auditoria (sigi.audit_log). */
export interface AuditLogDTO {
  id: string;
  usuarioId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  endpoint: string;
  metodoHttp: string;
  detalhes: string | null;
  timestamp: string;
}

export interface ConvocacaoDossieDTO {
  id: string;
  origem?: string | null;
  tipo?: string | null;
  dataReferencia?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  local?: string | null;
  status?: string | null;
  linkReferencia?: string | null;
}

export interface AtaResumidaDossieDTO {
  id: string;
  [chave: string]: unknown;
}

/**
 * Dossiê Jurídico consolidado devolvido por GET /api/alunos/{id}/dossie/exportar.
 * Os blocos maiores são tipados de forma aberta porque o backend já devolve os DTOs
 * completos de cada domínio; o visualizador usa principalmente contadores e trilha.
 */
export interface DossieJuridicoDTO {
  protocolo: string;
  escopo: EscopoDossie;
  geradoEm: string;
  geradoPor: string | null;
  alunoId: string;
  nomeAluno: string;
  matricula: string;
  curso?: string | null;
  turma?: string | null;
  statusAluno?: string | null;
  prontuario?: {
    totalPeis?: number;
    totalPeas?: number;
    totalAnexos?: number;
    diagnosticoInicial?: string | null;
    historicoFamiliar?: string | null;
    historicoSocioemocional?: string | null;
  } | null;
  estudosDeCaso?: unknown[];
  planosAcao?: unknown[];
  peis?: unknown[];
  peas?: unknown[];
  atendimentos?: unknown[];
  relatoriosRaiRae?: unknown[];
  atasReuniao?: AtaResumidaDossieDTO[];
  convocacoes?: ConvocacaoDossieDTO[];
  notificacoes?: unknown[];
  anexos?: unknown[];
  laudosMedicos?: unknown[] | null;
  logsAuditoria?: AuditLogDTO[];
}
