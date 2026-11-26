export interface DadosFormularioPlanoAcao {
  periodoLetivo: string;
  periodoIngresso: string;
  dataNascimento: string;
  telefoneEstudante: string;
  emailEstudante: string;
  nomeResponsavel: string;
  grauParentescoResponsavel: string;
  telefoneResponsavel: string;
  emailResponsavel: string;
  possuiComorbidade: boolean | null;
  comorbidadeDetalhes: string;
  usaMedicacaoContinua: boolean | null;
  medicacaoDetalhes: string;
  frequentaServicosApoio: boolean | null;
  servicosApoioDetalhes: string;
  apresentouDocumentosComprobatorios: boolean | null;
  documentosComprobatoriosDetalhes: string;
  identificacaoNecessidadesEspecificas: string;
  relatoPercursoEducacional: string;
  demandasIdentificadas: string;
  propostasIntervencao: string;
  assinaturaCoordenadorClai: string;
  dataAssinatura: string;
}

export interface PlanoAcaoRequestDTO {
  acompanhamentoId: string;
  periodoLetivo?: string | null;
  periodoIngresso?: string | null;
  dataNascimento?: string | null;
  telefoneEstudante?: string | null;
  emailEstudante?: string | null;
  nomeResponsavel?: string | null;
  grauParentescoResponsavel?: string | null;
  telefoneResponsavel?: string | null;
  emailResponsavel?: string | null;
  possuiComorbidade?: boolean | null;
  comorbidadeDetalhes?: string | null;
  usaMedicacaoContinua?: boolean | null;
  medicacaoDetalhes?: string | null;
  frequentaServicosApoio?: boolean | null;
  servicosApoioDetalhes?: string | null;
  apresentouDocumentosComprobatorios?: boolean | null;
  documentosComprobatoriosDetalhes?: string | null;
  identificacaoNecessidadesEspecificas?: string | null;
  relatoPercursoEducacional?: string | null;
  demandasIdentificadas?: string | null;
  propostasIntervencao?: string | null;
  assinaturaCoordenadorClai?: string | null;
  dataAssinatura?: string | null;
}

export type PlanoAcaoUpdateDTO = Omit<PlanoAcaoRequestDTO, 'acompanhamentoId'>;

export interface PlanoAcaoResponseDTO {
  id: string;
  acompanhamentoId: string;
  alunoId: string;
  nomeEstudante: string | null;
  matriculaEstudante: string | null;
  cursoEstudante: string | null;
  periodoLetivo: string | null;
  periodoIngresso: string | null;
  dataNascimento: string | null;
  telefoneEstudante: string | null;
  emailEstudante: string | null;
  nomeResponsavel: string | null;
  grauParentescoResponsavel: string | null;
  telefoneResponsavel: string | null;
  emailResponsavel: string | null;
  possuiComorbidade?: boolean | null;
  comorbidadeDetalhes?: string | null;
  usaMedicacaoContinua?: boolean | null;
  medicacaoDetalhes?: string | null;
  frequentaServicosApoio?: boolean | null;
  servicosApoioDetalhes?: string | null;
  apresentouDocumentosComprobatorios?: boolean | null;
  documentosComprobatoriosDetalhes?: string | null;
  identificacaoNecessidadesEspecificas: string | null;
  relatoPercursoEducacional: string | null;
  demandasIdentificadas: string | null;
  propostasIntervencao: string | null;
  assinaturaCoordenadorClai: string | null;
  dataAssinatura: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
}
