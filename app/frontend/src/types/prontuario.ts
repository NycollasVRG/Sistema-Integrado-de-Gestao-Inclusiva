/**
 * ProntuarioResponseDTO do back-end. Os históricos são omitidos do JSON
 * (@JsonInclude NON_NULL) para perfis ACESSO_FUNCIONAL (TA11.3), por isso são opcionais.
 */
export interface ProntuarioConsolidadoDTO {
  alunoId: string;
  nomeAluno: string;
  matricula: string;
  estudoDeCasoId?: string;
  statusEstudoDeCaso?: string;
  diagnosticoInicial?: string;
  historicoFamiliar?: string;
  historicoSocioemocional?: string;
  totalPeis: number;
  totalPeas: number;
  totalAnexos: number;
  atualizadoEm?: string;
}
