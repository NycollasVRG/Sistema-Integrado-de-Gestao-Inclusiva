/** Contratos de anexos do estudante (AnexoEstudanteResponseDTO do back-end). */
export type TipoClassificacaoAnexo =
  | 'LAUDO_MEDICO'
  | 'DIAGNOSTICO_NEUROPSICOLOGICO'
  | 'DOCUMENTO_PEDAGOGICO';

export interface AnexoEstudanteDTO {
  id: string;
  alunoId: string;
  nomeOriginal: string;
  contentType: string;
  tamanhoBytes: number;
  classificacao: TipoClassificacaoAnexo;
  criptografado: boolean;
  criadoEm: string;
}

/** TA11.2: laudos e diagnósticos neuropsicológicos exigem SUPER_RESTRICAO + autorizacaoSaude. */
export function isAnexoSensivel(classificacao: TipoClassificacaoAnexo): boolean {
  return classificacao === 'LAUDO_MEDICO' || classificacao === 'DIAGNOSTICO_NEUROPSICOLOGICO';
}

export const ROTULO_CLASSIFICACAO: Record<TipoClassificacaoAnexo, string> = {
  LAUDO_MEDICO: 'Laudo Médico',
  DIAGNOSTICO_NEUROPSICOLOGICO: 'Diagnóstico Neuropsicológico',
  DOCUMENTO_PEDAGOGICO: 'Documento Pedagógico',
};
