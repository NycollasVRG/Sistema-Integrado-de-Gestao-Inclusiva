/** Valores aceitos pelo backend em `RaiRequestDTO.tipoRelatorio`. */
export type TipoRelatorio = 'RAI' | 'RAE';

export type NivelAprendizado = 'SATISFATORIO' | 'BOM' | 'OTIMO';

export interface RaiHabilidadeDTO {
  id?: string | null;
  ordem?: number;
  habilidadeDesenvolvida: string;
  nivelAprendizado: NivelAprendizado;
  observacoes?: string | null;
}

export const OPCOES_RELACIONAMENTO_RAI = [
  'afetivo',
  'agressivo',
  'socializado',
  'antissocial',
  'outros',
] as const;

export const OPCOES_HABILIDADES_COGNITIVAS_RAI = [
  'foco',
  'memória',
  'atenção',
  'compreensão geral',
  'criatividade',
  'responsabilidades sociais',
  'outros',
] as const;

export const OPCOES_HABILIDADES_SOCIOEMOCIONAIS_RAI = [
  'empatia',
  'autoestima',
  'ética',
  'autoconhecimento',
  'confiança',
  'compromisso',
  'autonomia',
  'criatividade',
  'paciência',
  'outros',
] as const;

export const ROTULO_NIVEL_APRENDIZADO: Record<NivelAprendizado, string> = {
  SATISFATORIO: 'Satisfatório',
  BOM: 'Bom',
  OTIMO: 'Ótimo',
};

/** Corpo do POST/PUT /api/rais (RaiRequestDTO do back-end). */
export interface RaiRequestDTO {
  alunoId: string;
  peiId?: string | null;
  acompanhamentoId?: string | null;
  tipoRelatorio: TipoRelatorio;
  bimestre: number;
  indicativoRegressao?: boolean;
  descricao?: string | null;
  periodoLetivo?: string | null;
  componenteCurricular?: string | null;
  docente?: string | null;
  relacionamentoOpcoes?: string[];
  relacionamentoOutros?: string | null;
  relacionamentoComentario?: string | null;
  habilidadesCognitivasOpcoes?: string[];
  habilidadesCognitivasOutros?: string | null;
  habilidadesCognitivasComentario?: string | null;
  habilidadesSocioemocionaisOpcoes?: string[];
  habilidadesSocioemocionaisOutros?: string | null;
  habilidadesSocioemocionaisComentario?: string | null;
  avancosGerais?: string | null;
  dificuldadesAprendizagem?: string | null;
  fatoresExternos?: string | null;
  habilidadesDesenvolvidas?: RaiHabilidadeDTO[];
  parecer?: string | null;
  dataRelatorio?: string | null;
  assinaturaDocente?: string | null;
}

/** Resposta do back-end (RaiResponseDTO), inclusive em GET /api/rais/{id}. */
export interface RaiResponseDTO {
  id: string;
  alunoId: string;
  nomeEstudante?: string | null;
  matriculaEstudante?: string | null;
  cursoEstudante?: string | null;
  peiId?: string | null;
  acompanhamentoId?: string | null;
  tipoRelatorio: TipoRelatorio;
  bimestre: number;
  indicativoRegressao?: boolean | null;
  descricao?: string | null;
  periodoLetivo?: string | null;
  componenteCurricular?: string | null;
  docente?: string | null;
  relacionamentoOpcoes?: string[];
  relacionamentoOutros?: string | null;
  relacionamentoComentario?: string | null;
  habilidadesCognitivasOpcoes?: string[];
  habilidadesCognitivasOutros?: string | null;
  habilidadesCognitivasComentario?: string | null;
  habilidadesSocioemocionaisOpcoes?: string[];
  habilidadesSocioemocionaisOutros?: string | null;
  habilidadesSocioemocionaisComentario?: string | null;
  avancosGerais?: string | null;
  dificuldadesAprendizagem?: string | null;
  fatoresExternos?: string | null;
  habilidadesDesenvolvidas?: RaiHabilidadeDTO[];
  parecer?: string | null;
  dataRelatorio?: string | null;
  assinaturaDocente?: string | null;
  criadoEm: string;
  atualizadoEm?: string | null;
}
